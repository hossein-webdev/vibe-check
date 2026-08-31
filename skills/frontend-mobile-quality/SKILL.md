---
name: frontend-mobile-quality
description: >
  Closes the front-end gaps generators leave behind: responsive layouts, accessibility, performance
  on slow connections and older devices, real-device and cross-browser bugs, and mobile deep links.
  Activates when the user mentions responsive design, accessibility, WCAG, ADA, screen readers,
  keyboard navigation, color contrast, alt text, ARIA, mobile bugs, older Android/Safari, special
  characters breaking input, shared links opening in a browser instead of the app, or "it looks fine
  on my machine but breaks for users", or is wrapping a web app in a native shell. Applies to any
  app with a UI, especially mobile.
user-invokable: true
metadata:
  category: frontend-mobile-quality
  version: "2.3.0"
---

# Front-End & Mobile Quality

A generator produces a good-looking interface in minutes — but rarely a **responsive** one that
survives small screens, an **accessible** one that works with a screen reader, or a **fast** one on
a weak connection. It looks right on your machine; real users on older phones, slower networks, or
with an apostrophe in their name hit the bugs that drive uninstalls.

Applies to anything with a UI (deep links only if mobile). Freedom: **medium**.

## Rules

| ID | Check | If it fails |
|---|---|---|
| FE-01 | Responsive at real breakpoints (not just desktop width) | P2 |
| FE-02 | Screen-reader ready: semantic markup, alt text on every image, labels on every control, ARIA on inputs/nav, sane focus order | P2 (P1 if public-facing and legally exposed → `compliance-legal` LEGAL-13) |
| FE-03 | Performant on throttled network + low-end device | P2 |
| FE-04 | Tested under hostile conditions: old Android/Safari, special-character input | P2 |
| FE-05 | Mobile deep links configured (universal/app links) — N/A if web-only | P2 if mobile |
| FE-06 | Locale-aware formatting (dates, numbers, currency, addresses) + per-user timezone for scheduled messages | P2 if users are international |
| FE-07 | Every core flow completable by keyboard alone — buttons, forms, dropdowns, modals reachable and operable, focus never trapped | P2 |
| FE-08 | Text contrast meets WCAG AA (≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries) | P2 |
| FE-09 | Mobile shell hardened: credentials in the platform keychain/keystore (never web local storage), certificate pinning on API calls, deep links origin-validated before use | P1 if a web app is shipped as a native shell |

## When to Use This Skill

- User mentions responsive design, accessibility, or screen readers.
- User reports "fine for me, broken for users" or device-specific bugs.
- User mentions older Android / older Safari / special characters breaking input.
- Shared links open in a browser instead of the installed app.
- A web app is being wrapped as a native app (Capacitor/Cordova/WebView shell).

## How It Works

1. **Verify what the generator skips (FE-01, FE-03):** responsive behavior at real breakpoints;
   performance on a throttled connection and a cheap device.
2. **Run the accessibility pass (FE-02, FE-07, FE-08).** The generator built for a user with a
   mouse, perfect vision, and two working hands — roughly **1.3 billion people** live with a
   disability, and inaccessible products are increasingly the subject of ADA/equivalent complaints
   (→ `compliance-legal` LEGAL-13). Three concrete audits, in this order:
   - **Keyboard navigation (FE-07)** — put the mouse down and complete every core flow with Tab,
     Shift+Tab, Enter, Space, and arrow keys. Every button, form field, dropdown, and modal must be
     reachable and operable, focus must be visible, and modals must trap focus while open and
     return it on close. If you can't finish signup or checkout this way, the app is unusable for
     everyone who navigates by keyboard, switch, or voice control.
   - **Screen readers (FE-02)** — a screen reader doesn't see the interface, it reads the *code*.
     Audit every image for meaningful alt text (decorative images get `alt=""`, not a filename),
     every button and icon-only control for an accessible name, and every input, landmark, and nav
     element for correct semantics or ARIA. Then run one pass with a real reader (NVDA, JAWS,
     VoiceOver) and try to complete a task — that's how ~285 million people with visual impairments
     experience the product.
   - **Color contrast (FE-08)** — the generator picked colors that look good, never colors a
     colorblind or low-vision user can read. Run a contrast checker over the palette and fix
     anything below WCAG AA: 4.5:1 for body text, 3:1 for large text and UI boundaries. Grey-on-
     grey placeholder text and low-contrast disabled states are the usual offenders.
3. **Test under hostile conditions (FE-04).** Users do the QA you didn't: six-year-old Androids,
   older Safari, mobile data, apostrophes and non-Latin names in inputs. Reproduce those before
   they do — that's where the uninstall-causing breaks live.
4. **Fix deep links (FE-05).** Without universal links (iOS) / app links (Android) — association
   files plus handlers — shared URLs open in a browser tab and users bounce instead of landing
   in-app.
5. **Build for where your customers actually are (FE-06).** The generator builds for *your* country
   because that's what the tutorials use — hard-coded date formats, one currency, your timezone —
   and international users quietly give up rather than complain:
   - **Locale-aware formatting everywhere** — dates, times, numbers, currency, addresses. One
     American date format tells a user in London the product wasn't built for them.
   - **Per-user timezone for anything scheduled** — capture the timezone at signup and fire emails,
     notifications, and renewal reminders relative to *theirs*. A 3am reminder isn't a reminder.
   - **Multi-currency at checkout** → `monetization-pricing` PAY-11; processors support scores of
     currencies, but default to one unless told otherwise.

6. **Harden the native shell (FE-09).** Wrapping a web app in a native container doesn't just
   change the packaging — it moves your entire client-side architecture onto a device you don't
   control. Everything the browser used to sandbox (local storage, session tokens, cached responses)
   now sits in the app's data directory, readable by anyone with a rooted device or a forensic tool.
   The browser was doing security work you didn't know you were relying on:
   - **Credentials belong in the platform's secure storage**, never in web local storage: Keychain
     on iOS, Keystore on Android, via a secure-storage plugin. And an API key on the device is a
     published API key regardless of where it's stored — anything that must stay secret belongs on
     your server (→ `secrets-management` SEC-02).
   - **Pin the certificate.** Without pinning, any proxy on a compromised network intercepts the
     app's traffic and walks off with session tokens. Pin to your expected certificate or public
     key, and — this is the part people skip — ship a backup pin and a remote kill switch, because a
     pinned app whose certificate rotated is a bricked app.
   - **For genuinely sensitive payloads, don't rely on transport alone.** TLS plus pinning is the
     right baseline and enough for most apps; where you carry credentials or regulated data, encrypt
     those specific fields at the application layer too, so one proxy misconfiguration or a logging
     middleware that captures request bodies doesn't expose them. Judge this by data class, not by
     default — it adds key management you then have to run.
   - **Validate deep links before acting on them.** Your app registers URL schemes; a malicious app
     can register the same one and intercept auth callbacks, password-reset links, and payment
     confirmations. Verify origin and integrity before processing, prefer verified universal/app
     links over custom schemes (FE-05 sets those up), and never treat a deep-link parameter as
     trusted input.

## Fix playbook

```text
"Perfect on my laptop, users complain" [FE-01, FE-03, FE-04]:
 1. DevTools device mode at 360px + CPU 4x throttle + Slow 3G — fix what breaks.
 2. Lighthouse mobile run; fix the red items first.
 3. Paste O'Brien / 名前 / emoji into every input; fix crashes + validation.
Accessibility pass [FE-02, FE-07, FE-08] — one hour, three audits:
 1. Keyboard: unplug the mouse, complete signup + the core flow with Tab/Enter/Space/arrows.
    Fix: unreachable controls, invisible focus ring, modals that don't trap or restore focus.
 2. Semantics: grep for <img without alt, icon-only buttons without aria-label, inputs without
    a <label for=...>, div/span used as button. Then one real NVDA/VoiceOver task run.
 3. Contrast: run Lighthouse/axe or a contrast checker over the palette; fix < 4.5:1 body text
    and < 3:1 large text and UI boundaries (placeholders and disabled states usually fail).
 4. Automate the floor: add axe-core to the test suite so regressions fail CI, not customers.
Web app shipped as a native shell [FE-09]:
 1. Grep the bundle for localStorage/sessionStorage holding tokens or keys; move to secure storage.
 2. Any secret that must stay secret: move the call server-side. On-device = public.
 3. Enable certificate pinning + a backup pin; test the rotation path before you need it.
 4. Deep links: validate origin/signature; treat every parameter as untrusted input.
Links open in browser, not app [FE-05]:
 1. iOS: host /.well-known/apple-app-site-association; add Associated Domains entitlement.
 2. Android: host /.well-known/assetlinks.json; add intent filters with autoVerify.
 3. Test from a real chat app on a real device (links behave differently from chat surfaces).
```

## Examples

### Example 1: "It's perfect on my laptop but users say it's broken"
**Output**:
```
[FE-01..04] "Perfect on your device" ≠ works for users: 360px + throttled CPU/network,
screen-reader pass, Lighthouse mobile, and apostrophe/non-Latin input tests. Fix what falls out.
```

### Example 2: "Is my app accessible? Nobody's complained"
**Output**:
```
[FE-07] Complete signup with the mouse unplugged — Tab/Enter/Space only. [FE-02] Alt text on every
image, an accessible name on every icon-only button, one real screen-reader task run. [FE-08]
Contrast checker over the palette; fix anything under 4.5:1. Nobody complains — they leave, and
in some markets they file (→ compliance-legal LEGAL-13).
```

### Example 3: "Shared links open Safari, not my app"
**Output**:
```
[FE-05] Universal/app links: association files (apple-app-site-association, assetlinks.json)
+ handlers, then test from a real chat app on a real device.
```

## Do / Don't

- **Do** test responsiveness, accessibility, and performance explicitly — the generator won't.
- **Do** run all three accessibility audits (keyboard, screen reader, contrast) before launch, and
  pin the result with an automated check so it can't regress.
- **Do** test older devices, throttled networks, unusual input.
- **Don't** judge quality by how it looks on your machine.
- **Don't** treat accessibility as a nice-to-have — it's a market of over a billion people and, for
  public-facing products, a legal requirement.
- **Don't** ship mobile without configured deep links.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - MIT licensed: free to use, modify, and redistribute with attribution.</sub>
