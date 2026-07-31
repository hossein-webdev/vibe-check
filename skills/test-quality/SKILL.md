---
name: test-quality
description: >
  Judges and improves a test suite on quality rather than coverage percentage — because a
  high-coverage suite full of brittle, tautological, over-mocked tests catches nothing. Covers
  anti-fragility (no substring assertions on error text, no reaching into private symbols, no
  tautological readbacks, no recomputing the expected value with the same logic under test), rigor
  (fixed expected vectors, boundary and error cases, framework primitives), mocking discipline
  (never mock the unit under test), reuse (parametrized cases over copy-paste), correctness (tests
  pass and verify real library behavior), and coverage treated as a floor never a target. Activates
  when the user mentions test quality, flaky or brittle tests, "my tests pass but bugs still ship",
  coverage percentage, mutation testing, writing tests for an untested module, or reviewing an
  AI-generated test suite.
user-invokable: true
metadata:
  category: test-quality
  version: "4.0.0"
---

# Test Quality

Generators write tests that *pass*, and passing is the wrong bar. A suite can hit 90% coverage and
still catch nothing: assertions that match a substring of an error message, tests that mock the very
thing under test, expected values recomputed with the same formula being verified. Coverage measures
which lines *ran* — not whether a bug would have been *caught*.

The question that matters: **if someone silently broke this code, would this suite fail?**

Freedom: **medium** — the anti-fragility rules are near-absolute; the rest adapts to stack and stage.

> Rubric adapted from [beyond-test-coverage](https://github.com/rollinsio/beyond-test-coverage)
> by Michael Rollins (MIT licensed), which benchmarks LLM-generated suites on quality axes rather
> than coverage percentage.

## Rules

| ID | Check | If it fails |
|---|---|---|
| TEST-01 | No assertion on error-message substrings — assert on types, codes, or raised classes | P2 |
| TEST-02 | No reaching into private/internal symbols — test the public contract | P2 |
| TEST-03 | No tautological assertions (constructing a value then asserting it equals itself) | P2 |
| TEST-04 | Expected values are fixed vectors, not recomputed with the logic under test | P1 (the test proves nothing) |
| TEST-05 | Boundaries and error paths covered, not just the happy path | P1 |
| TEST-06 | The unit under test is never mocked; mock only external boundaries | P1 |
| TEST-07 | Repeated cases are parametrized/table-driven, not copy-pasted | P3 |
| TEST-08 | Suite passes, and non-obvious library assumptions are verified against real behavior | P1 |
| TEST-09 | Coverage treated as a floor to hold, never a number to chase | P3 |

## When to Use This Skill

- User says "my tests pass but bugs still reach production", or tests feel brittle/flaky.
- User asks to write tests for an untested module, or to review an AI-generated suite.
- User mentions coverage percentage, mutation testing, or a coverage gate.
- A refactor broke dozens of tests that were testing implementation, not behavior.
- Before relying on CI as a safety net (→ `deployment-cicd` DEPLOY-03/04).

## How It Works

### 1. Anti-fragility — tests that break for the right reasons (TEST-01..04)
Fragile tests fail on harmless refactors and pass through real bugs. The four worst patterns:
- **Error-message substring assertions.** `assert "not found" in str(err)` breaks when someone
  rewords the message and passes when the wrong error type is raised. Assert the **exception type**
  or a stable **error code** instead.
- **Private-symbol access.** Testing `_internal_helper()` locks the implementation in place; the
  public behavior is what users depend on and what must not silently change.
- **Tautological readbacks.** `u = User(name="a"); assert u.name == "a"` verifies the language works,
  not your code. Assert on something the code *decided*.
- **Recomputed expectations.** If the expected value is produced by the same formula being tested,
  the test agrees with any bug. Use **fixed vectors** — values computed independently, or captured
  from a known-good reference — especially for hashing, crypto, and math.

### 2. Rigor — cover what actually breaks (TEST-05)
- Boundaries: empty, one, many, maximum, off-by-one, zero, negative, null/None.
- Error paths: bad input, timeouts, permission denied — the unhappy paths users live on.
- Use the framework's primitives (fixtures, parametrization, snapshot/approval tests) instead of
  hand-rolling scaffolding.

### 3. Mocking discipline (TEST-06)
Mock the **boundary**, never the unit. A hand-rolled mock of the class under test means the suite is
asserting against your mock's behavior, not the real implementation — the most common way an
AI-written suite reaches high coverage while verifying nothing. Mock the network, the clock, the
filesystem, third-party SDKs; run your own logic for real.

### 4. Reuse (TEST-07)
Ten near-identical tests differing by one value should be one parametrized/table-driven case. Fewer
lines per behavior means the suite stays readable and people keep adding to it.

### 5. Correctness (TEST-08)
- The suite must actually pass — a skipped or `xfail`-ed test is not coverage.
- **Verify non-obvious library assumptions against real behavior** rather than trusting a
  generator's recollection of an API. If a test encodes "this library returns `None` here", confirm
  it in a REPL first; generated tests frequently assert against APIs that don't behave that way.

### 6. Coverage is a floor, not a target (TEST-09)
Hold the line — coverage shouldn't regress — but never write a test whose purpose is the number. The
useful question isn't "what percentage?" but **"which mutations would survive?"** If flipping a
comparison or deleting a branch leaves the suite green, that's the real gap. Mutation testing tools
(Stryker, mutmut, PIT, go-mutesting) measure this directly.

## Fix playbook

```text
Reviewing an AI-generated suite — grep for the four fragility smells first:
  1. error-substring asserts   → search: in str(  /  .message.contains  /  match=".*"
  2. private access            → search: ._  (dot-underscore) inside test files
  3. tautological readbacks    → constructor immediately followed by an assert on the same field
  4. recomputed expectations   → the expected value calls the function under test (or its helper)
Then check mocking: does any mock/patch target the module under test itself? That's TEST-06.
```
```text
Untested module, starting from zero:
  1. List the public contract (exported functions, their inputs/outputs/raises).
  2. One fixed-vector test per contract item — real expected values, not recomputed.
  3. Add boundaries + error paths as a parametrized table.
  4. Run mutation testing on the module; every surviving mutant is a missing assertion.
```

## Examples

### Example 1: "We have 92% coverage but bugs keep shipping"
**Output**:
```
Coverage says lines ran, not that failures would be caught. Audit for the fragility smells:
[TEST-04] expectations recomputed with the logic under test → the test agrees with any bug
[TEST-06] the unit itself mocked → you're testing the mock
[TEST-01] error-substring asserts → pass on the wrong error, fail on a reworded one
Then run mutation testing: surviving mutants are the true gap, not the missing 8%.
```

### Example 2: "Every refactor breaks 40 tests"
**Output**:
```
[TEST-02] The suite is pinned to implementation, not contract — private helpers under test.
Rewrite against the public API, [TEST-07] collapse the near-duplicates into a parametrized table,
and keep coverage as a floor [TEST-09] so the rewrite can't quietly regress it.
```

## Do / Don't

- **Do** assert exception types/codes, fixed expected vectors, and public behavior.
- **Do** mock external boundaries only, and parametrize repeated cases.
- **Don't** assert on error-message text, private symbols, or values you recomputed.
- **Don't** chase a coverage number — ask which mutations would survive instead.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution. Rubric adapted from beyond-test-coverage (c) Michael Rollins, MIT.</sub>
