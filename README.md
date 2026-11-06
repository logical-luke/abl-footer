# abl-footer

The shared AppsByLuke product footer, rendered as a custom element with Declarative Shadow DOM so host CSS cannot restyle it.

## Install

```sh
npm install github:logical-luke/abl-footer#v1.0.0
```

## API

```js
import { renderFooter } from 'abl-footer';

renderFooter({
  product: 'Acme',                 // required
  links: { privacy: '/privacy' },  // privacy, terms, refund, contact, status
  year: 2026,                      // default: current year
  home: false,                     // true on appsbyluke.com: "AppsByLuke" linking to /
  labels: { privacy: 'Prywatność' },
  assetBase: '/abl-footer',        // where footer.css is served
});
```

It returns a string. Only the given links render, always in the order privacy, terms, refund, contact, status. Every value is HTML-escaped.

Copy the stylesheet and font into your public directory at build time:

```sh
npx abl-footer copy public   # writes public/abl-footer/{footer.css,geist-latin-wght-normal.woff2,Geist-OFL.txt}
```

## Colours

Four variables cross into the shadow root. Set them on `abl-footer` or any ancestor.

| Variable | Light | Dark |
| --- | --- | --- |
| `--abl-ink` | `#1a1a1a` | `#f5f5f4` |
| `--abl-muted` | `#4f4d49` | `#b5b2ac` |
| `--abl-line` | `#d6d3cc` | `#3d3b38` |
| `--abl-accent` | `#0a6666` | `#6fd3cf` |

Dark follows `prefers-color-scheme`. A site that switches with `data-theme` maps the variables to its own tokens:

```css
abl-footer {
  --abl-ink: var(--color-text);
  --abl-muted: var(--color-text-muted);
  --abl-line: var(--color-border);
  --abl-accent: var(--color-accent);
}
```

## Astro

```astro
---
import { renderFooter } from 'abl-footer';
const footer = renderFooter({ product: 'Acme', links: { privacy: '/privacy', terms: '/terms' } });
---
<Fragment set:html={footer} />
```

```json
{ "scripts": { "build": "abl-footer copy public && astro build" } }
```

## Vue SSR

```vue
<div v-html="footer" />
```

with `footer` from `renderFooter(...)`, and `abl-footer copy public` in the build. Add `isCustomElement: (tag) => tag === 'abl-footer'` to the Vue compiler options if it warns.

## Static HTML

```sh
npx abl-footer copy public
npx abl-footer html --product Acme --privacy /privacy --terms /terms --status https://status.example.com > footer.html
```

Paste the fragment into each page. Flags: `--privacy --terms --refund --contact --status --year --home`.

## CSP

Styles load through `<link>`, so `style-src 'self'` holds. The output has no `style` attribute and no `<style>` element, and the footer needs no JavaScript. Declarative Shadow DOM needs Chrome 111, Safari 16.4 or Firefox 123. The stylesheet is linked in the document as well as inside the shadow root because browsers do not register `@font-face` from a shadow root.

## Font

Geist is bundled as `geist-latin-wght-normal.woff2` under the family name "ABL Geist". It is licensed under the SIL Open Font License, see `assets/Geist-OFL.txt`.
