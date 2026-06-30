---
name: frontend-mobile-quality
description: >
  Closes the front-end gaps generators leave behind: responsive layouts, accessibility, performance on
  slow connections and older devices, real-device and cross-browser bugs, and mobile deep links.
  Activates when the user mentions responsive design, accessibility, screen readers, mobile bugs, older
  Android/Safari, special characters breaking input, shared links opening in a browser instead of the
  app, or "it looks fine on my machine but breaks for users". Applies to any app with a UI, especially
  mobile.
user-invokable: true
metadata:
  category: frontend-mobile-quality
---

# Front-End & Mobile Quality

A generator can produce a good-looking interface in minutes, but it rarely produces a **responsive**
one that survives small screens, an **accessible** one that works with a screen reader, or a **fast**
one on a weak connection. It looks right on your machine; real users on older phones, slower networks,
or with unusual characters in their data hit bugs that lead to uninstalls.

Applies to anything with a UI. Freedom: **medium** — adapt to the framework.

## When to Use This Skill

- User mentions responsive design, accessibility, or screen readers.
- User reports "fine for me, broken for users" or device-specific bugs.
- User mentions older Android / older Safari / special characters breaking input.
- Shared links open in a browser instead of the installed app.
- User is preparing a mobile or cross-device launch.

## How It Works

1. **Verify what the generator skips.** Check explicitly for:
   - **responsive** behaviour at real breakpoints, not just desktop width,
   - **accessibility** — semantic markup, labels, focus order, a screen-reader pass,
   - **performance** on a slow connection and a low-end device.
2. **Test under real, unfriendly conditions.** Users do the testing you didn't: older devices, throttled
   networks, and unusual input (apostrophes, non-Latin names). Reproduce those before they do — that's
   where the uninstall-causing breaks hide.
3. **Fix mobile deep links.** Without proper universal/app links, a shared URL opens in a browser
   instead of the app and people drop off. Configure the platform association so links land in-app.

## Examples

### Example 1: "It's perfect on my laptop but users say it's broken"
**Action**: Run the unfriendly-conditions check.
**Output**:
```
"Perfect on your device" isn't "works for users." Verify:
- responsive at mobile breakpoints; tap targets usable,
- accessibility: labels, focus order, a screen-reader pass,
- performance on a throttled connection + a low-end device,
- input with apostrophes / non-Latin characters.
```

### Example 2: "Shared links open in the browser, not my app"
**Action**: Configure deep links.
**Output**:
```
Set up the iOS universal-link and Android app-link associations (association files + handlers) so
shared URLs open in the installed app instead of a browser tab.
```

## Do / Don't

- **Do** test responsiveness, accessibility, and performance explicitly — the generator won't.
- **Do** test older devices, throttled networks, and unusual input.
- **Don't** judge quality by how it looks on your own machine.
- **Don't** ship mobile without configured deep links.
