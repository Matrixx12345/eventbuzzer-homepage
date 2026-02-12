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

## Bidirectional Swipe Bug Fix (Additional 2+ hours)

### The Problem

After implementing the photo jump fix, we added bidirectional swiping (swipe down to go to previous event). However, this introduced a new issue:

**Symptom:** When swiping DOWN to see the previous event, a **40px white gap** appeared during the swipe between the previous card's SVG/text and the current card's photo below it. After the swipe completed, everything would "fall down" to close the gap.

**User Impact:**
- Jarring visual gap during swipe to previous event
- Content appeared to "jump" or "fall" after swipe completed
- Inconsistent layout between swipe state and final state

### Root Cause

The Previous card (swipe down) was using `h-screen` for its outer container, while the Main card (current/final state) was using `h-full`:

```tsx
// BEFORE (broken - 40px gap during swipe)
// Previous card:
<div className="md:hidden absolute bottom-full left-0 right-0 h-screen bg-white">

// Main card:
<div className="relative w-full h-full bg-white md:rounded-3xl md:shadow-2xl overflow-hidden">
```

**Why this caused the gap:**
- `h-screen` = 100vh (always viewport height, absolute)
- `h-full` = 100% of parent (relative to parent container)
- During swipe transitions, these calculated to slightly different heights (~40px difference)
- The mismatch created a visible white gap during the swipe

### The Solution ✅

**Changed Previous card from `h-screen` to `h-full`:**

```tsx
// AFTER (fixed - no gap)
// Previous card:
<div className="md:hidden absolute bottom-full left-0 right-0 h-full bg-white">

// Main card:
<div className="relative w-full h-full bg-white md:rounded-3xl md:shadow-2xl overflow-hidden">
```

**Why this works:**
- Both Previous and Main cards now use `h-full` consistently
- Same height calculation during swipe and final state
- No gap during transition
- Smooth, seamless swipe experience

### Implementation Details

**File Modified:**
- `src/components/EventListSwiper.tsx`

**Change:**
- Line ~1096: Previous card outer container: `h-screen` → `h-full`

**Related Changes (also part of bidirectional swipe):**
1. Added Previous card positioned at `bottom-full` (above current card)
2. Native touchmove listener with `{ passive: false }` to prevent pull-to-refresh
3. Previous card image: `loading="eager"` to prevent layout shift
4. Card Content div: `h-full flex flex-col md:block` (matches Main card exactly)
5. Text+SVG container: `h-[45vh] flex-none flex flex-col relative md:h-auto md:block md:overflow-y-auto` (matches Main card)

### Testing

**Success Criteria:**
- ✅ No 40px white gap during swipe to previous event
- ✅ Smooth transition between swipe and final state
- ✅ Content doesn't "fall down" after swipe completes
- ✅ Previous card layout matches Main card exactly

**How to Test:**
1. Open EventListSwiper on mobile
2. Swipe DOWN (to go to previous event)
3. Watch for white gaps during the swipe
4. Verify: No gap between previous card SVG and current card photo
5. Check: Smooth transition, no "falling down" effect

### Key Learnings

1. **Use `h-full` for nested containers, not `h-screen`:** When containers are nested within parents that already define the viewport height, use `h-full` to inherit from parent rather than `h-screen` to reference viewport directly
2. **Container height consistency is critical:** Swipe cards that transition into each other must use identical height calculations (e.g., all use `h-full` or all use `h-screen`, not mixed)
3. **Relative vs Absolute units:** `h-full` (relative) is more stable than `h-screen` (absolute) when transitioning between states
4. **Copy exact classes from working components:** When adding new swipe directions, copy ALL classes from the working direction to ensure consistency

### Related Code Pattern

**✅ DO:** Use `h-full` for swipe cards that transition into main card
```tsx
<div className="md:hidden absolute bottom-full left-0 right-0 h-full bg-white">
```

**❌ DON'T:** Mix `h-screen` and `h-full` in cards that transition into each other
```tsx
<div className="md:hidden absolute bottom-full left-0 right-0 h-screen bg-white">  // ❌ Creates gap
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
