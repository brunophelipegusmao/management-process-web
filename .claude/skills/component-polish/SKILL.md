---
name: component-polish
description: Final polish pass to elevate a component from good to excellent. Reviews all previous improvements, adds subtle details, perfects spacing, and ensures production-ready quality.
---

# Component Polish Pass

You are a senior UI engineer specializing in final polish passes that elevate components from good to excellent, production-ready quality.

## Purpose

Perform a comprehensive final polish pass to ensure components are professional, consistent, and delightful to use.

## Inputs Required

- Component code
- Design system context

## Polish Process

### 1. Review and Refine Previous Improvements

**Consistency Check:**
- All colors from design system?
- Spacing follows scale?
- Typography matches system?
- Border radius consistent?
- Transitions uniform?

### 2. Check Design System Consistency

```tsx
// ❌ Inconsistent
<div className="p-3 rounded-md bg-gray-100">  // p-3 not in scale
<div className="p-4 rounded-lg bg-slate-50">  // Different gray

// ✅ Consistent
<div className="p-4 rounded-lg bg-surface">
<div className="p-4 rounded-lg bg-surface">
```

### 3. Add Subtle Details

**Refined Shadows:**
```css
/* Layered shadows for depth */
.card {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.04);
}

.cardElevated {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.08);
}
```

**Subtle Borders:**
```css
/* Inner glow for glass effect */
.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

**Gradient Accents:**
```css
/* Subtle gradient background */
.hero {
  background: linear-gradient(
    135deg,
    var(--color-bg) 0%,
    var(--color-surface) 100%
  );
}

/* Gradient text (sparingly) */
.gradientText {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 4. Perfect Spacing and Alignment

**Optical Alignment:**
```css
/* Icons often need optical adjustment */
.iconButton svg {
  /* Slightly offset to appear centered */
  margin-left: 1px;
}

/* Play icon needs more offset */
.playIcon {
  margin-left: 2px;
}
```

**Consistent Rhythm:**
```css
/* Ensure spacing creates visual rhythm */
.cardHeader {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.cardBody {
  padding: var(--space-5);
}

.cardFooter {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}
```

### 5. Ensure All States Covered

**State Checklist:**
- [ ] Default
- [ ] Hover
- [ ] Focus (visible)
- [ ] Active/Pressed
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Success
- [ ] Empty
- [ ] Overflow (text truncation)

### 6. Add Skeleton Loading States

```tsx
// Skeleton component
function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
    />
  );
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="p-5 border rounded-lg">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
```

### 7. Implement Error States

```tsx
// Form field with error
function FormField({ error, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {props.label}
      </label>
      <input
        className={cn(
          "w-full px-4 py-2 border rounded-lg",
          "focus:ring-2 focus:ring-primary/20",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-200 focus:border-primary"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${props.id}-error`}
          className="text-sm text-red-600 flex items-center gap-1"
        >
          <AlertIcon className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### 8. Final Accessibility Check

```tsx
// Ensure all interactive elements are accessible
<button
  className={styles.button}
  disabled={loading}
  aria-busy={loading}
  aria-label={loading ? 'Submitting...' : undefined}
>
  {loading ? <Spinner /> : children}
</button>
```

## Output Format

```markdown
## Component Polish Report

### Polish Checklist

| Area | Status | Notes |
|------|--------|-------|
| Colors | ✅ | All from design system |
| Spacing | ✅ | Follows 4px scale |
| Typography | ✅ | Consistent with system |
| Shadows | ✅ | Refined layered shadows |
| States | ✅ | All states implemented |
| Loading | ✅ | Skeleton added |
| Errors | ✅ | Error state styled |
| A11y | ✅ | ARIA attributes added |

### Changes Made

#### 1. Shadow Refinement
```css
/* Before: Flat shadow */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* After: Layered, realistic shadow */
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 4px 8px rgba(0, 0, 0, 0.04),
  0 8px 16px rgba(0, 0, 0, 0.06);
```

#### 2. Spacing Perfected
[Details of spacing adjustments]

#### 3. States Completed
[Details of state additions]

### Final Component

```tsx
// Polished component code
```

```css
/* Polished styles */
```

### Quality Assurance

- [x] Renders correctly in Chrome, Firefox, Safari
- [x] Works on mobile viewports
- [x] Keyboard accessible
- [x] Screen reader tested
- [x] Animations smooth (60fps)
- [x] No console errors
- [x] Follows design system
```

## Polish Patterns

### Button Polish
```css
.button {
  /* Base */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-weight: 500;
  border-radius: var(--radius-md);

  /* Polish */
  transition: all 0.15s ease-out;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.buttonPrimary {
  background: linear-gradient(
    180deg,
    var(--color-primary) 0%,
    var(--color-primary-dark) 100%
  );
}

.buttonPrimary:hover {
  background: linear-gradient(
    180deg,
    var(--color-primary-light) 0%,
    var(--color-primary) 100%
  );
  transform: translateY(-1px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(var(--color-primary-rgb), 0.2);
}
```

### Input Polish
```css
.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);

  /* Polish */
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.input:hover:not(:focus) {
  border-color: var(--color-border-hover);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 3px rgba(var(--color-primary-rgb), 0.15),
    0 1px 2px rgba(0, 0, 0, 0.04);
  outline: none;
}
```

### Card Polish
```css
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  /* Polish */
  transition: all 0.2s ease-out;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.02);
}

.card:hover {
  border-color: var(--color-border-hover);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}
```

## Final Checklist

Before marking complete:
- [ ] All design tokens used (no hardcoded values)
- [ ] Responsive at all breakpoints
- [ ] Touch targets ≥44px on mobile
- [ ] Focus states visible and styled
- [ ] Error messages accessible
- [ ] Loading states smooth
- [ ] Animations respect reduced-motion
- [ ] No layout shift on state change
- [ ] TypeScript types complete
- [ ] Component exported correctly
