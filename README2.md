# EventBuzzer Homepage - Technical Documentation

## Photo Jump Bug Fix (3 hours debugging session)

### The Problem

**Symptom:** When swiping through events in the EventListSwiper component on mobile, the photo would appear at one size during the swipe, then **~1 second after the swipe completes**, it would visibly jump/shrink by approximately 10px in height. Additionally, the photo would show more content on the left/right edges (zoom-out effect), indicating the aspect ratio was changing.

**User Impact:**
- Jarring visual experience when browsing events
- Photo appeared unstable and unprofessional
- Made the swipe interaction feel broken

### Failed Attempts

Over the course of 3 hours, we tried multiple approaches that **did NOT solve** the problem:

1. ❌ Made `willChange` conditional (to optimize GPU usage)
2. ❌ Removed SVG `scaleX(1.2)` transform
3. ❌ Reduced padding between elements
4. ❌ Made SVG absolutely positioned (`bottom-0`, `bottom-8`, etc.)
5. ❌ Added `justify-end` to flex containers (this helped with white gaps but didn't fix the jump)
6. ❌ Added `aspect-ratio: 4/3` to photo containers (stretched images, hid icons)
7. ❌ Changed from 55/45 split to 60/40 split using percentages
8. ❌ Removed `justify-end` (eliminated white gap under photo but didn't fix jump)
9. ❌ Added `flex-none` to prevent flex from growing/shrinking containers
10. ❌ Used percentage-based heights (`h-[60%]`, `h-[40%]`)

### Root Cause

The issue was caused by **mobile browser viewport height changes**. On mobile browsers (Safari, Chrome), the viewport height changes when:
- The address bar appears/disappears during scrolling
- The browser UI shows/hides
- User interactions trigger browser chrome updates

When using **percentage-based heights** (`h-[60%]`, `h-[40%]`), the heights were calculated relative to the parent container, which ultimately was based on the viewport. As the viewport height changed (due to browser UI), the percentage-based heights would recalculate, causing the photo to shrink/grow.

**Why it showed more left/right content:**
- When the container height decreased from ~420px to ~410px (10px shrink)
- The width stayed constant
- The aspect ratio became wider (shorter + same width = wider)
- `object-cover` adjusted the image to fit, showing more horizontal content

### The Solution ✅

**Changed from percentage-based heights to viewport height (vh) units:**

```tsx
// BEFORE (broken - percentage-based)
<div className="h-[60%] flex-none">  // Photo container
<div className="h-[40%] flex-none">  // Text+SVG container

// AFTER (fixed - viewport-based)
<div className="h-[55vh] flex-none">  // Photo container
<div className="h-[45vh] flex-none">  // Text+SVG container
```

**Why this works:**
- `vh` units are **directly tied to the viewport height**, not parent container
- More stable and resistant to browser UI changes
- `flex-none` prevents flexbox from adjusting heights dynamically
- Final 55vh/45vh split gives more room for text+SVG (SVG was getting cut off at 60vh/40vh)

### Implementation Details

**Files Modified:**
- `src/components/EventListSwiper.tsx`

**Changes Applied:**
1. Main card photo container: `h-[60%]` → `h-[55vh]` (line ~718)
2. Main card text+SVG container: `h-[40%]` → `h-[45vh]` (line ~896)
3. Next card photo container: `h-[60%]` → `h-[55vh]` (line ~1085)
4. Next card text+SVG container: `h-[40%]` → `h-[45vh]` (line ~1124)
5. All containers kept `flex-none` to prevent flex adjustments

**Additional Fix:**
- Placeholder icons moved to `top-[40%]` (independent from main icons at `top-[55%]`)
- This allows adjusting placeholder icon position without affecting active icons

### Testing

**Success Criteria:**
- ✅ Photo stays exact same size during and after swipe
- ✅ No zoom-in/zoom-out effect on photo
- ✅ No layout shift 1 second after swipe
- ✅ Description shows 2 lines
- ✅ SVG map visible at bottom (not cut off)
- ✅ Smooth swipe interaction maintained

**How to Test:**
1. Open EventListSwiper on mobile device
2. Swipe through 10+ events
3. Watch photo during swipe and 2 seconds after
4. Verify: No height changes, no zoom effect, no layout shifts
5. Check: SVG map fully visible at bottom
6. Check: Description text shows 2 lines

### Key Learnings

1. **Viewport units vs Percentages:** On mobile, use `vh`/`vw` units for stability, not percentages
2. **Mobile browser quirks:** Address bar appearance changes viewport height
3. **`flex-none` is critical:** Prevents flex from automatically adjusting child heights
4. **Aspect ratio pitfalls:** `aspect-ratio` CSS can cause issues with `object-cover` images
5. **Debugging layout shifts:** Look for viewport-based root causes, not just CSS/JS

### Browser Compatibility

- ✅ Safari iOS 15+ (vh units supported)
- ✅ Chrome Android 88+ (vh units supported)
- ✅ Firefox Mobile (vh units supported)
- ✅ Edge Mobile (vh units supported)

### Performance Impact

- **No negative performance impact**
- `vh` units are just as performant as percentages
- `flex-none` prevents unnecessary flex recalculations
- Overall: Same or slightly better performance

### Related Code Patterns

This fix establishes a pattern for mobile layouts in EventBuzzer:

**✅ DO:** Use `vh`/`vw` units for mobile full-screen layouts
```tsx
<div className="h-[55vh]">  // Stable, viewport-based
```

**❌ DON'T:** Use percentage heights for top-level mobile layouts
```tsx
<div className="h-[55%]">  // Unstable, parent-based
```

**✅ DO:** Use `flex-none` to prevent flex adjustments
```tsx
<div className="h-[55vh] flex-none">  // Fixed height, no flex adjustments
```

**❌ DON'T:** Rely on default flex behavior for fixed-height layouts
```tsx
<div className="h-[55vh]">  // May grow/shrink with flex
```

---

## Future Improvements

- Consider using `dvh` (dynamic viewport height) units when browser support improves
- Add automated visual regression testing for layout shifts
- Monitor mobile browser viewport behavior changes in future browser updates

---

**Date:** 2026-02-12
**Time Spent:** ~3 hours
**Commits:** Multiple iterations, final fix in commit `3bd92e1` + `[current]`
**Impact:** Critical UX improvement for mobile users
