# Accessibility (a11y) Patterns Reference

## WCAG 2.1 Levels

| Level | Meaning | axe tag |
|-------|---------|---------|
| A | Minimum — must meet | `wcag2a` |
| AA | Standard — should meet (legal requirement in many countries) | `wcag2aa` |
| AAA | Enhanced — nice to have | `wcag2aaa` |

**Target: WCAG 2.1 AA** for most web apps.

---

## Most Common Violations (axe rule IDs)

### 1. `color-contrast`
Text color vs background doesn't have enough contrast ratio.
- AA requires: **4.5:1** for normal text, **3:1** for large text (18px+ or 14px bold)
- Fix: Use a contrast checker (e.g. [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker)), adjust colors

```css
/* ❌ Fails AA — ratio ~2.5:1 */
color: #999; background: #fff;

/* ✅ Passes AA — ratio 4.6:1 */
color: #767676; background: #fff;
```

### 2. `image-alt`
`<img>` missing `alt` attribute.
```html
<!-- ❌ -->
<img src="logo.png">

<!-- ✅ Informative image -->
<img src="logo.png" alt="<ORG> logo">

<!-- ✅ Decorative image (hidden from screen readers) -->
<img src="divider.png" alt="">
```

### 3. `label` / `label-content-name-mismatch`
Form input missing associated label.
```html
<!-- ❌ Placeholder is NOT a label -->
<input type="email" placeholder="Email">

<!-- ✅ Explicit label -->
<label for="email">Email address</label>
<input id="email" type="email">

<!-- ✅ aria-label (when visual label isn't possible) -->
<input type="search" aria-label="Search products">
```

### 4. `button-name`
Button has no accessible name.
```html
<!-- ❌ Icon button with no label -->
<button><svg>...</svg></button>

<!-- ✅ aria-label -->
<button aria-label="Close dialog"><svg>...</svg></button>

<!-- ✅ visually hidden text -->
<button><svg aria-hidden="true">...</svg><span class="sr-only">Close</span></button>
```

### 5. `heading-order`
Headings skip levels (h1 → h3, skipping h2).
```html
<!-- ❌ -->
<h1>Page title</h1>
<h3>Section</h3>   ← skipped h2

<!-- ✅ -->
<h1>Page title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### 6. `link-name`
Link has no accessible text.
```html
<!-- ❌ "Click here" or empty -->
<a href="/profile">Click here</a>
<a href="/docs"><img src="docs.png"></a>

<!-- ✅ Descriptive text -->
<a href="/profile">View your profile</a>
<a href="/docs"><img src="docs.png" alt="Documentation"></a>
```

### 7. `keyboard` / `focusable-content`
Interactive elements not reachable by keyboard.
```html
<!-- ❌ div acting as button — not keyboard accessible -->
<div onclick="submit()">Submit</div>

<!-- ✅ Use semantic elements -->
<button onclick="submit()">Submit</button>

<!-- ✅ If you must use div -->
<div role="button" tabindex="0" onclick="submit()" onkeydown="...">Submit</div>
```

---

## sr-only Utility Class

```css
/* Hide visually but keep accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## ARIA Roles Quick Reference

| Element | Role | When to use |
|---------|------|------------|
| `<nav>` | `navigation` | Main navigation landmark |
| `<main>` | `main` | Primary content area |
| `<aside>` | `complementary` | Secondary content |
| `<footer>` | `contentinfo` | Site footer |
| `<dialog>` | `dialog` | Modal dialogs |
| `aria-live="polite"` | — | Dynamic content updates |
| `aria-expanded` | — | Collapsible elements |
| `aria-required` | — | Required form fields |

---

## axe Violation Report Structure

```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
      "nodes": [
        {
          "html": "<p class=\"subtitle\">Loading...</p>",
          "target": [".subtitle"],
          "failureSummary": "Fix: Element has insufficient color contrast of 2.55:1 (foreground: #aaaaaa, background: #ffffff, font size: 14.0pt)"
        }
      ]
    }
  ]
}
```

**Reading violations:** `violations[n].nodes[n].failureSummary` tells you exactly what to fix.

---

## Testing Dynamic Content

```typescript
// Wait for content to load before scanning
await page.waitForSelector('[data-testid="dashboard-loaded"]');
const results = await new AxeBuilder({ page }).analyze();

// Scan a specific component only
const results = await new AxeBuilder({ page })
  .include('#modal-container')
  .analyze();
```
