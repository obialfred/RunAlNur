---
name: Today Panel Polish
overview: Fix the visual spacing issues in TodayPanel (filter pills padding) and rewrite the Calendar component using react-day-picker v9's correct API for a properly styled date picker.
todos:
  - id: fix-pills-spacing
    content: Fix TodayPanel filter pills vertical padding (py-4 instead of pb-3)
    status: completed
  - id: rewrite-calendar-v9
    content: Rewrite Calendar component using react-day-picker v9 class name API
    status: completed
  - id: deploy-verify
    content: Build, deploy to Vercel, verify on mobile
    status: completed
---

# Today Panel Visual Polish

## Issues Identified

### 1. Filter Pills Spacing (All, Personal, House)

**Current problem**: The context filter pills have no top padding - they sit directly against the header border above.

**Location**: [TodayPanel.tsx](runalnur-app/components/dashboard/TodayPanel.tsx) line 100

```tsx
// Current (broken):
<div className="px-4 pb-3 border-b border-border">

// Should be:
<div className="px-4 py-4 border-b border-border">
```

The fix adds `py-4` (top AND bottom padding of 16px) instead of just `pb-3` (bottom only 12px), centering the pills vertically between the header divider and the section divider below.

### 2. Calendar Component Using Wrong API

**Current problem**: The Calendar component uses react-day-picker v8 class names, but v9 is installed. The v9 API uses completely different class name keys.

**V8 (deprecated) class names being used**:

- `months`, `caption`, `nav_button`, `table`, `head_row`, `head_cell`, `row`, `cell`, `day`, `day_selected`, `day_today`, `day_outside`, etc.

**V9 correct class names**:

- `root`, `months`, `month`, `month_caption`, `caption_label`
- `nav`, `button_previous`, `button_next`, `chevron`  
- `month_grid`, `weekdays`, `weekday`, `weeks`, `week`, `day`, `day_button`
- DayFlags: `disabled`, `hidden`, `outside`, `focused`, `today`
- SelectionState: `selected`, `range_start`, `range_middle`, `range_end`

**Location**: [calendar.tsx](runalnur-app/components/ui/calendar.tsx)

The calendar needs a full rewrite using the v9 `classNames` prop with correct keys. The weekday header spacing issue (Su/Mo/Tu squished together) is caused by using `head_cell` (deprecated) instead of `weekday`.

## Implementation

### Step 1: Fix TodayPanel spacing

- Change `pb-3` to `py-4` on the context filter wrapper div
- This gives equal 16px padding top and bottom

### Step 2: Rewrite Calendar component for v9

- Use the correct v9 class name keys: `root`, `months`, `month`, `month_caption`, `caption_label`, `nav`, `button_previous`, `button_next`, `month_grid`, `weekdays`, `weekday`, `weeks`, `week`, `day`, `day_button`
- Use DayFlag keys for states: `today`, `outside`, `disabled`, `hidden`
- Use SelectionState keys: `selected`, `range_end`, `range_middle`
- Ensure proper spacing on weekday headers (`weekday` class with `w-9` and centered text)
- Style the day buttons for proper touch targets

### Step 3: Build, deploy, verify

- Run lint/build to catch any issues
- Deploy to Vercel production
- Test on mobile to verify calendar popup works and spacing is correct