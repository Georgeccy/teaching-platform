# 2023 DSE Paper 1 网页课件 v4 — Overview

## What was done

Iterated from v3 to v4 with one critical bug fix:

### Bug Fix: Drag-and-Drop Cross-Slide Collision (Q22 / page 16)

**Symptom:** On page 16 (Q22 · Character Match), dragging an option (A–E) into a drop zone would display the option text from a *different* question (Q20 · Timeline on page 14) instead of the intended option.

**Root cause:** `initDragDrop()` in `js/main.js` used `document.querySelector('.draggable[data-word="' + word + '"]')` in the drop handlers — a **global DOM lookup**. Both Q20 and Q22 use `data-word` values "A" through "E", so the selector always returned the **first match in document order** (Q20's element), regardless of which slide the user was on.

**Fix:** Replaced the data-word lookup with `document.querySelector('.draggable.dragging')` — the `.dragging` class is added in the `dragstart` handler and removed in `dragend` (which fires after `drop`), so it reliably identifies the exact element being dragged without any scope collision.

**Verification (headless Chrome):**
- V3 (before fix): dragging "A. Parents" (Q22) → placed "A. Timothy caused an explosion" (Q20) ❌
- V4 (after fix): dragging "A. Parents" (Q22) → placed "A. Parents" (Q22) ✅
- Q20's pool confirmed not affected by Q22 drags ✅

## File structure
```
2023DSE-Paper1_v4/
├── index.html    (title updated to v4)
├── css/main.css  (unchanged from v3)
└── js/main.js    (2 lines changed: drop handlers for zones + pools)
```
