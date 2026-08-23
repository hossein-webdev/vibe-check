---
name: growth-activation
description: >
  Covers the half of shipping that isn't engineering the product: building an audience while you
  build, validating what to scope from what customers already use and pay for, instrumenting the
  path from discovery to purchase, getting new users to their first real value, and keeping them
  past week three. Activates when the user mentions a launch or launch plan, "I shipped and nobody
  came", waitlists, pre-launch audience or building in public, conversion rate, funnel, checkout
  abandonment, pricing-page testing, onboarding, activation, the aha moment, day-two return, churn,
  retention, cohorts, feature adoption, or asks what to build next for real customers. Applies to any product with users you want
  to keep — before launch as much as after.
user-invokable: true
metadata:
  category: growth-activation
  version: "1.2.0"
---

# Growth & Activation

You can harden all thirteen layers and still launch to silence. The product is the part that gets
engineered carefully; how anyone finds it, why they trust it, whether they reach the thing it's
good at, and whether they come back — that usually gets left to hope. It doesn't have to be. Every
step from "never heard of you" to "renewed again" has a measurable rate, a diagnosable failure, and
a fix, which makes this engineering work with a different unit of output.

Two failure modes bracket this skill. **Before launch:** months of building, a link posted on launch
day, nothing. **After launch:** signups climb, the dashboard stays green, and the product quietly
dies because most of those people never came back after day two.

Applies to any product with users. Freedom: **medium** — the instrumentation is prescriptive, the
tactics are yours.

## Rules

| ID | Check | If it fails |
|---|---|---|
| GROW-01 | An audience is being built *during* the build, not after — by launch day there's evidence people want it (comments, waitlist, testers, referrals) | P2 pre-launch |
| GROW-02 | Scope validated from what target customers already use and pay for, not from what's easy to generate | P2 pre-launch |
| GROW-03 | Every step from discovery to purchase is instrumented: entries, drop-offs, conversions per step | P2 once selling |
| GROW-04 | Funnel changes are versioned and tested like code (pricing page, checkout), with abandonment tracked as a first-class metric | P3 |
| GROW-05 | The activation window is defined: one core action, completed in the first session, with a nudge when it isn't | P1 for retention |
| GROW-06 | Week-three habit gate watched: meaningful weekly actions per user, alerting on a drop below *that user's* own average | P2 |
| GROW-07 | Retention read from **cohorts** (signups grouped by week), never from total-user counts | P2 |
| GROW-08 | Core-feature adoption measured; low usage diagnosed as discovery vs value before anything is rebuilt | P2 |
| GROW-09 | A ~100-day post-launch review is scheduled, treating the launch build as a hypothesis to be revised from behavior | P3 |
| GROW-10 | Onboarding runs past the first session: complexity revealed as the user demonstrates readiness, and day-1/day-7 re-engagement references what that user actually created | P2 for retention |

## When to Use This Skill

- The user is planning a launch, or shipped and nobody came.
- The user asks what to build next, or which features real customers would pay for.
- Conversion, funnel, checkout abandonment, or pricing-page testing comes up.
- Signups look healthy but usage, engagement, or revenue doesn't follow.
- The user mentions onboarding, activation, the aha moment, day-two return, churn, or cohorts.
- (Pricing *levels* and the money path → `monetization-pricing`; ICP and positioning → PAY-12.)

## How It Works

### 1. Build the audience on the same clock as the product (GROW-01)
Every week spent building without publishing anything about what you're building, for the customer
you're building it for, is a week your future customers don't know you exist. The builders who
launch to an audience built it *while* building — they ran both tracks at once, and the second one
does not start itself:
- **Learn to publish before you need to.** The failure isn't only starting late, it's discovering on
  launch day that you don't know how — where to look, how to open, how to cut thirty seconds
  together — so the first attempt gets deleted and nothing goes out. Rehearse somewhere with no
  stakes: a throwaway account, an unrelated topic, nobody you know watching. Bad output and zero
  views are the *point*; you're building the muscle, not an audience. Give it a couple of months
  before it matters. It's the same reason you don't learn deploys during an incident.
- **Run a content track in parallel**, aimed at the specific customer in your ICP (→
  `monetization-pricing` PAY-12), from early in the build. Building in public is the cheap version:
  the decisions, the tradeoffs, the thing that broke.
- **By launch day you want proof, not hope** — comments, conversations, a waitlist, early testers who
  told you what they thought, people referring it before it's live. That social proof becomes the
  most useful section of the page on day one.
- **Understand the real competition.** You aren't competing with the three products in your category;
  you're competing with every notification, ad, and unread email in that person's day. Launching to
  strangers with zero prior contact isn't a launch strategy, it's a raffle.

**The shape of the calendar.** The app can be built in a weekend; the business can't. Working
backwards from launch, roughly: **~200 days out** learn the skill with no stakes; **~100 days out**
point it at the product and build in public until launch day carries proof (GROW-01); **~100 days
after**, real behavior finally exists and the build gets revised against it (GROW-09). The exact
numbers aren't the claim — the granularity is. Entity, content engine, audience, launch, iteration:
these move in hundred-day blocks, not weeks, and the plan that assumes otherwise skips the part
that was never optional.

### 2. Scope from what people already use (GROW-02)
A generator will build any feature you name and never once ask whether a customer requested it, so
building becomes its own reward and the product fills with things nobody opens:
- **Go audit a real operator's stack.** Sit with a business owner in your target segment and have
  them show you every tool they run the business on. Expect ten-plus platforms and a four-figure
  feature count.
- **Count what they actually touch** — it is routinely a few dozen features out of a thousand. The
  rest isn't bad software; it was built for every business rather than *this* one. That gap is what
  every operator means when they say they hate their software.
- **The used subset is your scope.** Not a guess and not a brainstorm — a validated feature list
  derived from observed usage, built to work perfectly for one segment. Unlimited generation
  capacity is a trap here: the most valuable thing it can do is help you *audit*, not add.
- Pairs with `production-readiness` PROD-07: scope from what's used, then keep the shipped set
  healthy rather than growing it.

### 3. Instrument the buying journey (GROW-03, GROW-04)
You would never run the application without error tracking. Running the business without conversion
tracking is the same bet with money instead of uptime:
- **Map every step from the buyer's side** — how they find you, what they see first, where they
  hesitate, what makes them click, where they leave and never return. Those are systems questions,
  not marketing ones. The landing page, the pricing page, and the checkout flow are each a system
  with a rate that can be measured, diagnosed, and improved.
- **Track three numbers per step**: who entered, who dropped, who converted. The step with the
  steepest drop is the whole roadmap for that week.
- **Version and test it like code (GROW-04)** — A/B test the pricing page the way you'd test a
  feature, and treat checkout abandonment with the seriousness you give API latency. Revenue that
  isn't measured isn't engineered; it's luck with extra steps.

### 4. Win the first session (GROW-05)
Roughly **six in ten signups never return after day two**, and the cause is almost always that the
first session never proved why the product matters:
- **Name the one core action** that separates users who stay from users who leave — the first
  project created, the first data import, the first document shared. Every product has one; most
  teams have never written theirs down.
- **Track completion within the first 24 hours.** Missing it collapses the odds of a next-day
  return, so this is the single highest-leverage metric before launch and after.
- **Put the target in seconds, not sessions.** The user should *do* the core action inside the
  first minute — not watch a tour, not read documentation. Prefilled templates, sample data, and
  smart defaults are how you get there: a project tracker should have a project with tasks in it
  before onboarding finishes. Empty-state-then-tutorial is the pattern that loses people.
- **Nudge when it doesn't happen** — email, in-app prompt, a tooltip on the right screen. Builders
  hesitate here because nudges feel pushy; silence is what actually loses the user.

**Onboarding doesn't end at the first session (GROW-10).** A launch spike converts on the signup
page and then quietly empties out — thousands of signups, most gone within the week — because
nothing after account creation gave them a reason to return. Two structures carry the arc:
- **Progressive disclosure.** Don't show every feature in session one. Gate complexity behind
  demonstrated readiness: first session the core workflow, second customization, third the
  integrations. Track the milestones and reveal against them. A full-featured first screen reads as
  homework, and the feature you buried is one the user will actually find when it's relevant.
- **Re-engagement that references their own data.** A generic "come back, we miss you" is ignored;
  "your project has three tasks due tomorrow" is a reason to open the app, because it's about the
  thing *they* built. Fire event-based triggers at day one and day seven post-signup, keyed to what
  the user created — which only works if GROW-05 got them to create something in the first place.

### 5. Survive week three (GROW-06)
The 48-hour gate has a sequel. Around week three the novelty is gone and the user has to *choose*
to come back, which is where a product either becomes a habit or becomes a subscription somebody
means to cancel:
- **Count meaningful weekly actions, not logins** — core-feature use, not an opened tab.
- **Compare each user against their own baseline.** A global threshold hides the customer who went
  from twenty actions a week to four; that person is leaving, and a fixed cutoff won't say so.
- **The first missed session is the intervention window.** By the time a cancellation arrives the
  decision is weeks old and the cancellation is just paperwork.

### 6. Read the numbers that tell the truth (GROW-07, GROW-08)
- **Cohorts, not totals.** Total users only goes up, so it stays green while the product dies.
  Group signups by the week they joined and chart each group's return rate over time: you see
  exactly which week people stop coming back, and who those people were. Totals structurally cannot
  show you that.
- **Feature adoption per cohort.** If 80% of users never open a feature, that's a **discovery**
  problem far more often than a feature problem — the fix is placement, naming, or onboarding, not
  a rebuild. Diagnose which one before spending a sprint (→ `observability` OBS-12 session replays
  make this visible).
- Without this instrumentation you're guessing, and guessing builds more of what nobody asked for
  while the things people wanted stay broken.

### 7. Treat the launch build as a hypothesis (GROW-09)
What you launch is not the product; it's your best guess at the product, and you can't tell the
difference until real behavior arrives:
- **Schedule the review at ~100 days.** By then there's actual data: what gets used, what gets
  ignored, what people pay for, what they ask you never to build.
- **Expect it to look different.** In a majority of projects the day-100 product diverges sharply
  from launch day — because users described what they wanted through behavior and someone was
  willing to read it.
- **Pivoting on evidence is the winning move, and holding on isn't loyalty.** The product is a tool
  that serves a market, not a statement about you. The best version is the one your users designed;
  the expensive one is the one you defended.

## Fix playbook

```text
"Nobody came" [GROW-01]:
 1. Don't relaunch yet. Pick the one place your customer already gathers; show up weekly for 8 weeks.
 2. Publish the build: decisions, tradeoffs, what broke. Ask questions you actually need answered.
 3. Waitlist + 5 real conversations before any second launch. Zero replies = the scope is wrong, not the copy.
No idea what to build [GROW-02]:
 1. Sit with one target operator; list every tool they pay for and every feature they touch in a week.
 2. The touched list is the scope. Build that, for that segment, and nothing adjacent.
Funnel is a black box [GROW-03/04]:
 1. Instrument: landing view -> signup start -> signup complete -> activation -> checkout -> paid.
 2. Table it weekly: entered / dropped / converted per step. Fix the steepest drop only.
 3. A/B the pricing page; alert on checkout abandonment like you alert on 5xx.
Signups don't stick [GROW-05/06/07]:
 1. Write down the core action. Query: % of signups completing it within 24h.
 2. Nudge sequence for non-completers (t+1h in-app, t+24h email, t+72h last touch).
 2b. [GROW-10] Seed the empty state: template/sample data so the core action is doable in <60s.
 2c. [GROW-10] Day-1 and day-7 triggers that name the user's own object, not the product.
 3. Weekly cohort chart: signup week x weeks-since-signup return %. Find the cliff week.
 4. Per-user baseline alert: this week's actions < 50% of that user's 4-week average -> flag.
```

## Examples

### Example 1: "I launched last week and got almost no signups"
**Output**:
```
[GROW-01] The launch didn't fail — it started 100 days too late. Nothing to relaunch until there's
an audience: pick the one community your customer already lives in, publish the build weekly, and
get to real conversations. Proof of demand (waitlist, testers, referrals) is the launch prerequisite,
not the launch result. [GROW-02] While you do that, audit what a real operator in that segment
already pays for and uses — that list is your scope.
```

### Example 2: "Signups are up and to the right but revenue is flat"
**Output**:
```
[GROW-07] Totals only go up; chart cohorts by signup week and find where returns fall off.
[GROW-05] Then check what share complete the core action in the first 24h — if it's low, the
product never got a chance to matter. [GROW-03] And instrument discovery→purchase: entered /
dropped / converted per step. Flat revenue with rising signups is almost always one identifiable
step, not a general malaise.
```

## Do / Don't

- **Do** build the audience on the same clock as the product — the second track never starts itself.
- **Do** rehearse publishing somewhere with no stakes before it matters; launch day is a bad place
  to learn a new skill.
- **Do** scope from what customers already use and pay for, not from what's easy to generate.
- **Do** instrument the funnel the way you instrument the application; measure the drop, fix the drop.
- **Do** define the core action and nudge the users who miss it.
- **Don't** read total-user counts as health — they rise while the product dies.
- **Don't** treat low feature usage as a feature problem before ruling out discovery.
- **Don't** defend the launch build against the behavior data; it was always a hypothesis.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
