# Design: Jetpack Connection Status in Snippet

## Goal

Add Jetpack connection status to the copied snippet in `content.js`, so happiness engineers can immediately see connection health when picking up a case.

## Status States

Three states are derived from the text content of `.site-debugger-results h2`:

| Condition | Emoji | Extra text |
|---|---|---|
| h2 is exactly `Everything looks great!` | 🟢 | none |
| h2 contains `site-only connection` | 🟡 | text inside parentheses (e.g. `site-only connection`) |
| anything else | 🔴 | full h2 text |

## Snippet Format

Plain text:
```
Site: https://example.com | JPDB 🟢 | RWDB |
Site: https://example.com | JPDB 🟡 `site-only connection` | RWDB |
Site: https://example.com | JPDB 🔴 `XML-RPC: connect error` | RWDB |
```

HTML (for Zendesk rich text paste): backtick-wrapped text becomes `<code>` tags.

```html
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🟢 | RWDB |
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🟡 <code>site-only connection</code> | RWDB |
Site: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🔴 <code>XML-RPC: connect error</code> | RWDB |
```

## Implementation

File changed: `content.js` only.

### New function: `getConnectionStatus()`

Reads `.site-debugger-results h2` and returns:
```js
{ emoji, label }
// label is null when green, string when yellow/red
```

Extraction logic:
- Green: `label = null`
- Yellow: extract text inside parentheses from h2 via `/\(([^)]+)\)/`
- Red: use full h2 text as label

### Changes to `buildSnippet()`

Replace the current emoji detection:
```js
const emoji = document.body.innerText.includes('Everything looks great!') ? '🟢' : '🔴';
```

With a call to `getConnectionStatus()`, then build the JPDB segment:
- If `label` is null: `JPDB 🟢`
- If `label` is set: `JPDB 🟡 \`site-only connection\`` (plain) / `JPDB 🟡 <code>site-only connection</code>` (HTML)

No other files change. No new permissions needed.
