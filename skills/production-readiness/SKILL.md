---
name: production-readiness
description: >
  Closes the gap between an app that demos well and one that holds up for real users. Activates when a
  build "works for me but breaks for everyone else", is stuck at the "almost done" stage, when the
  owner can't explain or maintain AI-generated code, when a developer is being brought in to take it
  over, or when someone asks what unglamorous work is left before launch. Covers the last-mile of
  shipping, owning the generated code, lightweight docs, and right-sizing effort to the app's stage.
user-invokable: true
metadata:
  category: production-readiness
---

# Production Readiness — The Last Mile

AI gets you a running app quickly. Turning that into something people can rely on is a separate job,
and it's mostly the unglamorous part: handling the inputs you didn't expect, the states you didn't
design, and the failures you didn't plan for. This skill is about that mindset — ownership and
discipline, not a single tool.

Applies to essentially any AI-built app. Freedom: **high** — principles you adapt, not rigid steps.

## When to Use This Skill

- Someone says "it works on my machine / in the demo but breaks for real users".
- A project is "almost done" but stalled on the unglamorous remainder.
- The owner (often non-technical) can't explain what the generated code does.
- A new developer is taking over an AI-built codebase.
- Someone asks "what's left that isn't a feature?" before launch.

## How It Works

1. **Reset expectations about "done."** The quick part is the path where everything goes right. The
   slow part — input validation, error and empty states, retries, the deploy-and-recover story — is
   the actual engineering, and it's where most demos quietly fall over. Budget time for it explicitly.
2. **Pressure-test the build like a stranger would.** You know the one path that works; users don't.
   - have someone who *didn't* build it try it cold,
   - feed it bad, slow, huge, and empty inputs on purpose,
   - add the missing non-feature work it surfaces (validation, fallbacks, friendly errors).
3. **Make the generated code yours.** You can't operate what you can't explain:
   - read through every file and make sure you understand what it does,
   - rename anything whose name doesn't match its real job,
   - remove the dead and duplicated code the generator left behind.
4. **Write down what isn't obvious from the code**, while it's still fresh:
   - the key decisions and why they were made,
   - how to set up the environment, secrets, and external services,
   - any deliberate shortcuts and the reason they exist.
5. **Right-size the effort to the stage.** Don't build for a million users while you have a hundred,
   and don't ignore reliability once people actually depend on it. Early on, ship features; as usage
   grows, invest in operations; at real scale, invest in architecture.
6. **Hand specifics to the focused skills.** Run `audit` to see which areas apply; this skill sets the
   posture, the domain skills do the work.

## Examples

### Example 1: "It's basically done, just polishing"
**Action**: Reframe "polish" as the real remaining work; run the stranger test.
**Output**:
```
"Done" really means:
- [ ] Someone who didn't build it completed the core flow without help
- [ ] It survives bad input, no network, and empty/huge data
- [ ] Error, empty, and loading states exist
- [ ] There's a way to deploy and roll back  (→ deployment-cicd)
Until those hold, it's a demo wearing a product's clothes.
```

### Example 2: "A dev I hired says the code is unmaintainable"
**Action**: Ownership pass + the three missing docs.
**Output**:
```
1. Walk every file; rename misleading names; delete dead code.
2. Write: key decisions + why, environment/secrets setup, deliberate shortcuts.
That documentation gap is usually why a handed-over AI codebase feels hostile.
```

## Do / Don't

- **Do** treat the unglamorous remainder as the main work, not an afterthought.
- **Do** make sure the owner can explain every file before launch.
- **Don't** mistake "the happy path works" for "it's ready".
- **Don't** over-build for scale you don't have yet.
