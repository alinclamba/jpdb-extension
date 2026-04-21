# Design: JPDB Extension — Snippet Improvements

## Goals

1. Show Jetpack connection status (with detail when degraded/broken)
2. Show product links only when the site has the relevant plan
3. Fix double `https://` bug in site URL

---

## 1. Jetpack Connection Status

### Status States

Derived from `.site-debugger-results h2`:

| Condition | Emoji | Inline label |
|---|---|---|
| h2 is exactly `Everything looks great!` | 🟢 | none |
| h2 contains `site-only connection` | 🟡 | text inside parentheses, e.g. `site-only connection` |
| anything else | 🔴 | full h2 text |

### Snippet Format

Always-present fields: site URL + JPDB status. Product links appear only when plan is active.

Plain text:
```
Site: https://example.com | JPDB 🟢 |
Site: https://example.com | JPDB 🟡 `site-only connection` |
Site: https://example.com | JPDB 🔴 `XML-RPC: connect error` | RWDB | VideoTools |
```

HTML (Zendesk rich text): backtick text becomes `<code>`, labels become links.

```html
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🟢 |
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🟡 <code>site-only connection</code> |
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🔴 <code>XML-RPC: connect error</code> | <a href="...">RWDB</a> |
```

### Implementation

New function `getConnectionStatus()` reads `.site-debugger-results h2` and returns `{ emoji, label }` where `label` is `null` when green, a string otherwise.

- Green: `label = null`
- Yellow: extract text inside parentheses via `/\(([^)]+)\)/`
- Red: use full h2 text

Replace current emoji detection in `buildSnippet()`:
```js
// before
const emoji = document.body.innerText.includes('Everything looks great!') ? '🟢' : '🔴';

// after
const { emoji, label } = getConnectionStatus();
```

JPDB segment in snippet:
- `label` is null → `JPDB 🟢`
- `label` is set → `JPDB 🟡 \`site-only connection\`` (plain) / `JPDB 🟡 <code>site-only connection</code>` (HTML)

---

## 2. Plan-Based Product Links

### Problem

Links for RWDB, VideoTools, SocialRC, AKMC are always present in the jptools page regardless of plan. The current code shows them unconditionally. They should only appear when the site has the relevant plan.

### Plan Detection

Plans are read from `#get_plans_and_products strong` elements. Each plan appears as two consecutive `strong` tags: human-readable name + slug. Match on slug prefix (stable across billing periods and variants).

```js
function getSitePlanSlugs() {
  return [...document.querySelectorAll('#get_plans_and_products strong')]
    .map(el => el.innerText.trim());
}
```

### Product Rules

| Label | Slug prefix(es) that trigger it | Link text in page |
|---|---|---|
| RWDB | `jetpack_backup`, `jetpack_scan` | `Backup and Scan` |
| VideoTools | `jetpack_videopress` | `Videos` |
| SocialRC | `jetpack_social` | `Social RC` |
| AKMC | `jetpack_anti_spam` | `Akismet` |

RWDB appears once even if both Backup and Scan plans are present.

### Implementation

Replace `PRODUCTS` array and `getUsefulLink()` logic in `buildSnippet()`:

```js
const PRODUCT_RULES = [
  { label: 'RWDB',       slugPrefixes: ['jetpack_backup', 'jetpack_scan'], linkText: 'Backup and Scan' },
  { label: 'VideoTools', slugPrefixes: ['jetpack_videopress'],             linkText: 'Videos' },
  { label: 'SocialRC',   slugPrefixes: ['jetpack_social'],                 linkText: 'Social RC' },
  { label: 'AKMC',       slugPrefixes: ['jetpack_anti_spam'],              linkText: 'Akismet' },
];
```

For each rule: check if any site plan slug starts with any of the rule's `slugPrefixes`. If yes, get the link from the page via `getUsefulLink(linkText)` and include the product in the snippet.

---

## 3. Bug Fix: Double `https://` in Site URL

`resolveSiteUrl()` always prepends `https://` when `raw` is not a numeric blog ID. If `?url=` already contains the protocol, the result is `https://https://example.com`.

Fix — check for existing protocol before prepending:

```js
function resolveSiteUrl(raw) {
  if (/^\d+$/.test(raw)) {
    const match = document.body.innerText.match(/siteurl:\s*(https?:\/\/[^\s(]+)/);
    return match ? match[1] : raw;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}
```

---

## Scope

Only `content.js` changes. No new permissions, no manifest changes.
