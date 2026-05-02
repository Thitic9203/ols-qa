# Frontend Performance Patterns

## Core Web Vitals Quick Reference

| Metric | Full name | Measures | Good | Poor |
|--------|-----------|----------|------|------|
| LCP | Largest Contentful Paint | Load speed | < 2.5s | > 4.0s |
| CLS | Cumulative Layout Shift | Visual stability | < 0.1 | > 0.25 |
| INP | Interaction to Next Paint | Responsiveness | < 200ms | > 500ms |
| TTFB | Time to First Byte | Server speed | < 800ms | > 1800ms |
| FCP | First Contentful Paint | First paint | < 1.8s | > 3.0s |

## Lighthouse CI Config Template

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/dashboard"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttlingMethod": "simulate"
      }
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift":  ["error", {"maxNumericValue": 0.1}],
        "interactive":              ["warn",  {"maxNumericValue": 3800}],
        "total-blocking-time":      ["warn",  {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lhci-reports"
    }
  }
}
```

## Bundle Size Budget Reference

| App type | main.js | vendor.js | CSS | Images (per) |
|----------|---------|-----------|-----|--------------|
| Landing page | < 50KB | < 100KB | < 20KB | < 200KB |
| SPA (standard) | < 150KB | < 300KB | < 30KB | < 500KB |
| Admin/dashboard | < 250KB | < 400KB | < 50KB | < 1MB |

(All sizes gzipped)

## LCP Optimization Checklist

```
[ ] Largest element preloaded? (<link rel="preload" as="image">)
[ ] Server response time < 600ms? (TTFB)
[ ] No render-blocking scripts above the fold?
[ ] Images have explicit width/height (avoid layout shift)?
[ ] Hero image next-gen format (WebP/AVIF)?
[ ] CDN serving static assets?
```

## CLS Fixes

```html
<!-- ❌ Causes CLS — no dimensions -->
<img src="hero.jpg" alt="Hero">

<!-- ✅ Fixed — explicit aspect ratio -->
<img src="hero.jpg" alt="Hero" width="1200" height="630"
     style="aspect-ratio: 1200/630">
```

```css
/* Reserve space for dynamic content */
.ad-slot { min-height: 250px; }
.skeleton { height: 48px; width: 100%; }
```

## INP (Interaction) Optimization

Long tasks > 50ms block the main thread and cause high INP.

```js
// ❌ Long synchronous work
function handleClick() {
  const result = heavyComputation(data);  // blocks for 200ms
  updateUI(result);
}

// ✅ Break into smaller tasks
function handleClick() {
  updateUI('loading...');
  setTimeout(() => {                        // yield to browser
    const result = heavyComputation(data);
    updateUI(result);
  }, 0);
}

// ✅ Or use scheduler API (modern browsers)
async function handleClick() {
  updateUI('loading...');
  await scheduler.yield();
  const result = heavyComputation(data);
  updateUI(result);
}
```

## Bundle Analysis Commands

```bash
# source-map-explorer: show what's in each chunk
npx source-map-explorer 'dist/static/js/*.js' --html report.html

# webpack-bundle-analyzer: interactive treemap
ANALYZE=true npm run build  # if configured

# vite: rollup-plugin-visualizer
# add to vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true })]
```
