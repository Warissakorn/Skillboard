# Scrutinize: compact cards and palette

Goal: retain small portrait cards and readable Thai labels without text escaping
buttons, using a restrained blue/slate palette in light and dark modes.

Scope: focused review of card rendering, actions, layout toggle and theme cascade.
Simpler alternative: retain existing buttons/handlers and replace only equal-width
tracks with intrinsic-width wrapping. No new menus, smaller fonts or framework.

## Major — equal tracks force Thai action labels outside their boxes (fixed)

Before fix: popup/popup.css:451 sets 164px border-box width with 10px padding;
line 455 splits the remaining 142px into three tracks with two 4px gaps, about
44.67px each; line 457 prevents wrapping. After borders/padding, text gets only
about 38.67px. User screenshot shows คัดลอก crossing the button border.

Trace: window-mode.js:26 toggleCardMode → applyCardMode:18 applies card-mode;
popup.js:209 render → createSkillItem:94 → copy label:143 and click handler:144
→ handleCopy:246 → navigator.clipboard.writeText. The defect is layout, not the
clipboard path. Fixed at popup/popup.css:455–457: flex-wrap with non-shrinking
intrinsic buttons, full-row primary action, normal wrapping for extreme text.
Cards may grow vertically when labels require another row; list remains scrollable.
Title container now has min-width:0 (line 464), so long names can shrink/wrap.

## Major — mock tests cannot establish visual containment (outstanding gate)

Evidence: tests/popup.test.cjs setup supplies synthetic objects, not a browser CSS
layout engine. Previous 31 passing checks did not prevent the screenshot defect.
Reran 20 UI/window tests and 11 storage assertions; this confirms the mocked paths
only. Browser previews were previously blocked by environment URL policy; no
attempt was made to circumvent that restriction.

Before merge, render both themes at 420px popup width and 360px/280px mini widths,
with Thai labels, long unbroken names, 1/2/10 cards and enlarged text. Verify button
text fits, focus is visible, horizontal scrolling reaches the last card and every
action remains reachable. No visual pass is claimed.

Palette: popup/popup.css:1–29 now uses blue/slate tokens. Calculated sRGB luminance
contrast values are saved in after/palette-contrast.json; minimum among evaluated
normal text pairs is 5.54:1. This is a numeric color check, not full accessibility
certification. Also corrected dialog error specificity at popup/popup.css:468:
the generic dialog p rule previously overrode the red error color.

Verdict: fix-then-ship — implementation updated, but real-browser text containment
remains the release gate. Content-script insertion and cross-window persistence
were not re-reviewed in this focused CSS pass.
