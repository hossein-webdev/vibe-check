---
name: frontend-mobile-quality
description: >
  Closes the front-end gaps generators leave behind: responsive layouts, accessibility, performance
  on slow connections and older devices, real-device and cross-browser bugs, and mobile deep links.
  Activates when the user mentions responsive design, accessibility, screen readers, mobile bugs,
  older Android/Safari, special characters breaking input, shared links opening in a browser instead
  of the app, or "it looks fine on my machine but breaks for users". Applies to any app with a UI,
  especially mobile.
user-invokable: true
metadata:
  category: frontend-mobile-quality
  version: "2.0.0"
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
| FE-02 | Accessible: semantic markup, labels, focus order, screen-reader pass | P2 |
| FE-03 | Performant on throttled network + low-end device | P2 |
| FE-04 | Tested under hostile conditions: old Android/Safari, special-character input | P2 |
| FE-05 | Mobile deep links configured (universal/app links) — N/A if web-only | P2 if mobile |

## When to Use This Skill

- User mentions responsive design, accessibility, or screen readers.
- User reports "fine for me, broken for users" or device-specific bugs.
- User mentions older Android / older Safari / special characters breaking input.
- Shared links open in a browser instead of the installed app.

## How It Works

1. **Verify what the generator skips (FE-01..03):** responsive behavior at real breakpoints;
   semantic markup, labels, focus order, one full screen-reader pass; performance on a throttled
   connection and a cheap device.
2. **Test under hostile conditions (FE-04).** Users do the QA you didn't: six-year-old Androids,
   older Safari, mobile data, apostrophes and non-Latin names in inputs. Reproduce those before
   they do — that's where the uninstall-causing breaks live.
3. **Fix deep links (FE-05).** Without universal links (iOS) / app links (Android) — association
   files plus handlers — shared URLs open in a browser tab and users bounce instead of landing
   in-app.

## Fix playbook

```text
"Perfect on my laptop, users complain" [FE-01..04]:
 1. DevTools device mode at 360px + CPU 4x throttle + Slow 3G — fix what breaks.
 2. Keyboard-only walk + screen reader pass (NVDA/VoiceOver); label every control.
 3. Lighthouse mobile run; fix the red items first.
 4. Paste O'Brien / 名前 / emoji into every input; fix crashes + validation.
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

### Example 2: "Shared links open Safari, not my app"
**Output**:
```
[FE-05] Universal/app links: association files (apple-app-site-association, assetlinks.json)
+ handlers, then test from a real chat app on a real device.
```

## Do / Don't

- **Do** test responsiveness, accessibility, and performance explicitly — the generator won't.
- **Do** test older devices, throttled networks, unusual input.
- **Don't** judge quality by how it looks on your machine.
- **Don't** ship mobile without configured deep links.

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
