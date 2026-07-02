#!/usr/bin/env node
/**
 * vibe-check static pre-scanner.
 *
 * Read-only. Walks a project directory and emits JSON facts the audit skill
 * reasons over: tracked env files, secret-looking strings in client-reachable
 * source, framework/hosting/db/auth/ai/payment/queue/mobile signals, CI/tests/
 * migrations presence, and logging/error-tracking imports.
 *
 * Usage:
 *   node scan.mjs <project-dir> [--json <out-file>]
 *
 * Exit codes: 0 = scan completed (findings or not), 1 = bad usage / unreadable dir.
 * Requires Node >= 18. No dependencies. Never modifies the target.
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, sep } from 'node:path';
import { execSync } from 'node:child_process';

const MAX_FILE_BYTES = 512 * 1024;      // skip huge files
const MAX_FILES_SCANNED = 4000;         // hard cap so monorepos stay fast
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', '.turbo', '.vercel',
  'coverage', '.cache', 'vendor', '__pycache__', '.venv', 'venv', 'target',
]);
const TEXT_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.rb',
  '.go', '.rs', '.java', '.php', '.json', '.yml', '.yaml', '.toml', '.env',
  '.html', '.css', '.sql', '.sh', '.ps1', '.md',
]);

// Secret-looking patterns. Tuned for low noise: long opaque values only.
const SECRET_PATTERNS = [
  { id: 'stripe-live', re: /sk_live_[0-9a-zA-Z]{10,}/ },
  { id: 'stripe-test', re: /sk_test_[0-9a-zA-Z]{10,}/ },
  { id: 'openai', re: /sk-[A-Za-z0-9_-]{20,}/ },
  { id: 'aws-key', re: /AKIA[0-9A-Z]{16}/ },
  { id: 'gcp-key', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { id: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{30,}/ },
  { id: 'jwt-hardcoded', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: 'postgres-url', re: /postgres(?:ql)?:\/\/[^\s'"@]+:[^\s'"@]+@/ },
  { id: 'mysql-url', re: /mysql:\/\/[^\s'"@]+:[^\s'"@]+@/ },
  { id: 'mongo-url', re: /mongodb(?:\+srv)?:\/\/[^\s'"@]+:[^\s'"@]+@/ },
  { id: 'generic-assign', re: /(?:api[_-]?key|secret|token|password)["'\s]*[:=]["'\s]*[A-Za-z0-9+/_-]{24,}["']/i },
];

// Dependency classification → aspects.
const DEP_CLASSES = {
  frameworks: ['next', 'react', 'vue', 'nuxt', 'svelte', '@sveltejs/kit', 'astro', 'remix', '@remix-run/react', 'express', 'fastify', 'hono', 'koa', 'nestjs', '@nestjs/core', 'vite'],
  db: ['drizzle-orm', 'prisma', '@prisma/client', 'typeorm', 'sequelize', 'mongoose', 'pg', 'mysql2', 'better-sqlite3', '@supabase/supabase-js', 'firebase', 'firebase-admin', 'convex', '@neondatabase/serverless', '@planetscale/database', 'redis', 'ioredis', 'knex',
  ],
  auth: ['@clerk/nextjs', '@clerk/clerk-sdk-node', 'auth0', '@auth0/nextjs-auth0', 'next-auth', '@auth/core', 'better-auth', 'lucia', 'passport', 'jsonwebtoken', 'jose', 'bcrypt', 'bcryptjs', 'argon2'],
  ai: ['openai', '@anthropic-ai/sdk', 'ai', '@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/google', '@google/generative-ai', 'replicate', 'cohere-ai', 'langchain', '@langchain/core', 'llamaindex'],
  payments: ['stripe', '@stripe/stripe-js', 'paypal-rest-sdk', '@paypal/checkout-server-sdk', 'braintree', 'square', 'lemonsqueezy.ts', '@lemonsqueezy/lemonsqueezy.js'],
  queue: ['bullmq', 'bull', 'bee-queue', 'inngest', '@trigger.dev/sdk', 'agenda', 'node-cron', 'croner', 'graphile-worker', 'pg-boss'],
  mobile: ['react-native', 'expo', '@capacitor/core', '@ionic/react', 'nativescript'],
  observability: ['@sentry/nextjs', '@sentry/node', '@sentry/react', 'pino', 'winston', 'bunyan', 'posthog-js', 'posthog-node', '@datadog/browser-rum', 'dd-trace', 'newrelic', '@opentelemetry/api'],
  testing: ['vitest', 'jest', 'mocha', '@playwright/test', 'cypress', 'ava', 'supertest', '@testing-library/react'],
};

const HOSTING_FILES = {
  vercel: 'vercel.json', netlify: 'netlify.toml', cloudflare: 'wrangler.toml',
  fly: 'fly.toml', render: 'render.yaml', railway: 'railway.json',
  liara: 'liara.json', docker: 'Dockerfile', compose: 'docker-compose.yml',
  heroku: 'Procfile',
};

const MONOREPO_FILES = ['pnpm-workspace.yaml', 'turbo.json', 'nx.json', 'lerna.json'];
const LOCKFILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'];

function usage() {
  console.error('Usage: node scan.mjs <project-dir> [--json <out-file>]');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();
const root = args[0];
const jsonOutIdx = args.indexOf('--json');
const jsonOut = jsonOutIdx !== -1 ? args[jsonOutIdx + 1] : null;

let rootStat;
try { rootStat = statSync(root); } catch { console.error(`Error: cannot read ${root}`); process.exit(1); }
if (!rootStat.isDirectory()) { console.error(`Error: ${root} is not a directory`); process.exit(1); }

// ---------- helpers ----------
const rel = (p) => p.slice(root.length).replace(/\\/g, '/').replace(/^\//, '');

function* walk(dir, depth = 0) {
  if (depth > 8) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(join(dir, e.name), depth + 1);
    } else if (e.isFile()) {
      yield join(dir, e.name);
    }
  }
}

function safeRead(p) {
  try {
    if (statSync(p).size > MAX_FILE_BYTES) return null;
    return readFileSync(p, 'utf8');
  } catch { return null; }
}

function gitTrackedEnvFiles() {
  try {
    const out = execSync('git ls-files', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split(/\r?\n/).filter((f) => /(^|\/)\.env($|\.)/.test(f) && !/\.env\.example$|\.env\.sample$|\.env\.template$/.test(f));
  } catch { return null; } // not a git repo or git unavailable
}

// ---------- collect ----------
const result = {
  scannedAt: null, // stamped by caller if needed; Date intentionally not used for reproducibility
  root: root.replace(/\\/g, '/'),
  project: { monorepo: [], packageJsons: [], lockfiles: [], hosting: [], ci: [], tests: false, migrationsDirs: [] },
  deps: { frameworks: [], db: [], auth: [], ai: [], payments: [], queue: [], mobile: [], observability: [], testing: [] },
  env: { trackedEnvFiles: [], envExampleExists: false, gitAvailable: true },
  secrets: [], // { file, line, pattern, clientReachable }
  signals: {
    apiRoutes: [], webhookRoutes: [], workersDirs: [], customAuthFiles: [],
    clientAiCalls: [], rlsMentions: 0, corsCspMentions: 0, i18n: false,
  },
  stats: { filesScanned: 0, truncated: false },
};

// package.json(s) + dep classification
for (const p of walk(root)) {
  const r = rel(p);
  const base = r.split('/').pop();
  if (base === 'package.json' && !r.includes('node_modules')) {
    result.project.packageJsons.push(r);
    const txt = safeRead(p);
    if (txt) {
      try {
        const pkg = JSON.parse(txt);
        const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const [cls, names] of Object.entries(DEP_CLASSES)) {
          for (const n of names) if (all[n] && !result.deps[cls].includes(n)) result.deps[cls].push(n);
        }
      } catch { /* unparseable package.json — ignore */ }
    }
  }
}

// top-level project facts
for (const f of MONOREPO_FILES) if (existsSync(join(root, f))) result.project.monorepo.push(f);
for (const f of LOCKFILES) if (existsSync(join(root, f))) result.project.lockfiles.push(f);
for (const [name, f] of Object.entries(HOSTING_FILES)) if (existsSync(join(root, f))) result.project.hosting.push(name);
if (existsSync(join(root, '.github', 'workflows'))) {
  try { result.project.ci = readdirSync(join(root, '.github', 'workflows')).filter((f) => /\.ya?ml$/.test(f)); } catch { /* ignore */ }
}
result.env.envExampleExists = ['.env.example', '.env.sample', '.env.template'].some((f) => existsSync(join(root, f)));

const tracked = gitTrackedEnvFiles();
if (tracked === null) { result.env.gitAvailable = false; } else { result.env.trackedEnvFiles = tracked; }

// file sweep
let count = 0;
for (const p of walk(root)) {
  if (count >= MAX_FILES_SCANNED) { result.stats.truncated = true; break; }
  const r = rel(p);
  const ext = extname(r).toLowerCase();
  const base = r.split('/').pop();

  // structure signals from paths alone
  if (/(^|\/)(app|pages|src)\/.*api\//.test(r) && /route\.(ts|js)x?$|\.py$|\.go$/.test(base)) result.signals.apiRoutes.push(r);
  if (/webhook|callback/i.test(r) && /\.(ts|js|py|go)x?$/.test(ext + base)) result.signals.webhookRoutes.push(r);
  if (/(^|\/)(workers?|jobs|queues?)\//.test(r)) { const d = r.split('/').slice(0, -1).join('/'); if (!result.signals.workersDirs.includes(d)) result.signals.workersDirs.push(d); }
  if (/(^|\/)(migrations?|drizzle|prisma\/migrations)\//.test(r)) { const d = r.split('/')[0]; if (!result.project.migrationsDirs.includes(d)) result.project.migrationsDirs.push(d); }
  if (/vitest|jest|playwright|cypress/.test(base) || /(^|\/)(tests?|__tests__)\//.test(r)) result.project.tests = true;
  if (/i18n|locales?\//.test(r)) result.signals.i18n = true;

  if (!TEXT_EXT.has(ext)) { count++; continue; }
  const txt = safeRead(p);
  count++;
  if (!txt) continue;

  // client-reachable heuristic: under app/(non-api), pages/(non-api), src/components, public, or *.html
  const clientReachable = (/(^|\/)(app|pages|src)\//.test(r) && !/\/api\//.test(r) && /\.(jsx?|tsx?|vue|svelte|html)$/.test(ext)) || /(^|\/)public\//.test(r);

  // secret patterns (skip .env.example-style files and lockfiles)
  if (!/\.env\.(example|sample|template)$/.test(base) && !LOCKFILES.includes(base)) {
    const lines = txt.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const { id, re } of SECRET_PATTERNS) {
        if (re.test(lines[i])) {
          result.secrets.push({ file: r, line: i + 1, pattern: id, clientReachable });
          break; // one hit per line is enough
        }
      }
    }
  }

  // content signals
  if (/createClient|new OpenAI|new Anthropic|generateText|streamText/.test(txt) && clientReachable && /openai|anthropic|@ai-sdk|generative-ai/i.test(txt)) {
    result.signals.clientAiCalls.push(r);
  }
  if (/jsonwebtoken|jwt\.sign|bcrypt|argon2|crypto\.pbkdf2/.test(txt) && !/node_modules/.test(r)) {
    if (!result.signals.customAuthFiles.includes(r) && result.signals.customAuthFiles.length < 20) result.signals.customAuthFiles.push(r);
  }
  if (/ROW LEVEL SECURITY|CREATE POLICY|\brls\b/i.test(txt)) result.signals.rlsMentions++;
  if (/Content-Security-Policy|Access-Control-Allow-Origin|X-Frame-Options/i.test(txt)) result.signals.corsCspMentions++;
}
result.stats.filesScanned = count;

// trim noisy arrays
result.signals.apiRoutes = result.signals.apiRoutes.slice(0, 30);
result.signals.webhookRoutes = result.signals.webhookRoutes.slice(0, 15);
result.secrets = result.secrets.slice(0, 50);

const json = JSON.stringify(result, null, 2);
if (jsonOut) writeFileSync(jsonOut, json);
console.log(json);
