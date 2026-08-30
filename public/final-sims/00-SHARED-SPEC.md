# SHARED BUILD SPEC — PCTB Class 8 Science Simulation Suite

## 0. NON-NEGOTIABLE TECHNICAL CONTRACT
- One single `.html` file per simulation. No build step, no bundler, no npm, no server. Double-click to run.
- 100% offline. Zero network requests. No CDN, no Google Fonts, no external scripts/images. Inline CSS/JS. Graphics: data-URI / inline SVG / procedurally drawn. System font stack.
- No frameworks. Vanilla HTML + CSS + JS, canvas and/or inline SVG. No React, D3, jQuery, PhET npm. PhET design language + pedagogy, vanilla implementation.
- File size under 2 MB.
- Runs on Chrome, Firefox, Edge, Safari, Android. Layout at 360px and 1920px. No horizontal scroll.

## 1. PhET PEDAGOGY
- Discovery before explanation. Productive in 5 seconds. No modal tutorial.
- Controls suggest their use. Cut unused controls.
- Immediate visible feedback under 100ms. No Submit button to see a result.
- Make the invisible visible (electrons here).
- Multiple linked representations: scene + numeric readout + graph from same state.
- Productive failure allowed. NEVER block with an error dialog — show the consequence.
- Class 8, ages 13–14. Depth from manipulable relationships, not extra formulas.

## 2. REQUIRED STRUCTURE
1. Masthead — title + one-line framing
2. Guided Challenge Bar — 5 sequential tasks
3. The Stage — most screen area
4. Instrument Panel — controls, live readouts, at least one live chart
Plus Check Your Understanding: 5 MCQs, instant why-explanation, score, Try again.

## 3. GUIDED CHALLENGE BAR
5 numbered tasks unlock in order. Each: one plain sentence goal; auto-detects completion (student never presses "I'm done"); "Show me" performs the setup; one-line payoff on completion.
Progress: free play → guided observation → prediction → breaking it → real-world connection.

## 4. UI / UX
Mobile-first, 44×44 touch targets, large slider thumbs, stage never needs pinch-zoom.
System fonts. Body 16px min. Never below 12.5px. Tabular-nums on numeric readouts.
EXACT tokens:
```
--accent:#1F6FD0
--good:#237A46
--warn:#8C5A05
--crit:#A0173F
--panel:#FFFFFF  --panel-2:#F2F4F5  --panel-border:#8A8A8A
--text:#14202A   --text-2:#46565F   --text-3:#71828C
```
Plus 2–3 domain colours (wire, electron, glow/hot).
Never encode meaning in colour alone.
Light/dim profile toggle `:root[data-profile="dim"]`.
60fps rAF. Never setInterval for animation.
Honour prefers-reduced-motion: periodic static updates instead of continuous motion.
Always: Play/Pause, Step, Reset, speed control.
A11y: keyboard, :focus-visible, role/aria-label/desc on scene, aria-live=polite on narration and readouts.
Class 8 English. PCTB textbook terminology. English ⇄ Urdu toggle. All user-facing strings in one STRINGS object at top of script.

## 5. CODE QUALITY
Sections: CONFIG → STRINGS → STATE → PHYSICS/MODEL → RENDER → CONTROLS → GUIDE → QUIZ → LOOP.
Separate model from view. step(dt) advances model; render only reads and draws. Never mutate model in draw.
All tunables in CONFIG, commented, teacher-editable.
Comment the science, not the syntax.
Reset returns exactly initial state, no leftovers.

## 6. DELIVERABLE
HTML comment README at top: chapter/topic, learning objectives, misconceptions, which CONFIG values teachers may adjust.
