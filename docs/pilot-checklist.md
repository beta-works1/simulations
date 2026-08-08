# GS8 Pilot Checklist

For teachers / facilitators running 2–3 classroom sessions. No developer tools required.

## Before class
- [ ] Open `/gs8` on one tablet with Wi‑Fi, then turn Wi‑Fi off and reload — library and a few sims still open
- [ ] Confirm Urdu toggle (library header or sim ⚙ settings) flips shell chrome and RTL layout
- [ ] Confirm Teacher view (`/gs8/teacher`) shows empty or prior progress and Export CSV works
- [ ] Optional: install PWA / open in standalone if available

## During class — watch for
1. **Guided Mode stuck points** — which step do students linger on? Note sim id + step number.
2. **Slow devices** — which sims stutter when opening or dragging? Note device model if known.
3. **Urdu gaps** — awkward or missing strings (shell is translated; most sim bodies still English until filled in `src/i18n/locales/ur.json`).
4. **Controls confusion** — Free Explore vs Guided; students who never open Recap.
5. **Accessibility** — anyone using keyboard / high contrast / reduced motion?

## After class — log feedback
Open a GitHub issue in this repo with title prefix `[pilot]` and include:
- School / grade / date (no student names)
- Device type(s)
- Bullet list of stuck points / slow sims / Urdu notes
- Optional: attach exported CSV from Teacher view (device-level aggregate only)

## Success signals
- Students can complete Guided Mode on at least one P1 sim without adult clicks
- Offline reload works on lab tablets
- Teacher can export progress from one device after the period
