# Snippet Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `content.js` so the copied snippet shows Jetpack connection status with detail, product links only when the plan is active, and fixes a double-`https://` bug.

**Architecture:** All changes are in `content.js`. Three independent improvements applied in sequence: bug fix → connection status → plan-based products. No new files, no new permissions.

**Tech Stack:** Vanilla JS, Chrome Extension MV3 content script. No build step. Manual testing by loading the extension unpacked in Chrome.

---

## File Map

| File | Change |
|---|---|
| `content.js` | Fix `resolveSiteUrl`, add `getConnectionStatus`, add `getSitePlanSlugs`, add `getBlogId`, replace `PRODUCTS` with `PRODUCT_RULES`, update `buildSnippet` |

---

## Task 1: Fix double `https://` in site URL

**Files:**
- Modify: `content.js`

- [ ] **Step 1: Open `content.js` and replace `resolveSiteUrl`**

Find:
```js
function resolveSiteUrl(raw) {
  if (!/^\d+$/.test(raw)) return `https://${raw}`;
  // Numeric blog ID — extract siteurl from the Blog Details section
  const match = document.body.innerText.match(/siteurl:\s*(https?:\/\/[^\s(]+)/);
  return match ? match[1] : raw;
}
```

Replace with:
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

- [ ] **Step 2: Verify manually**

1. Load extension unpacked in Chrome (`chrome://extensions` → Load unpacked → select project folder)
2. Navigate to `https://jptools.wordpress.com/debug/?url=https://example.com`
3. Click "Copy JPDB info"
4. Paste somewhere — site URL should be `https://example.com`, NOT `https://https://example.com`
5. Navigate to `https://jptools.wordpress.com/debug/?url=example.com` (no protocol)
6. Paste — should still be `https://example.com`

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "fix: prevent double https:// in site URL"
```

---

## Task 2: Add Jetpack connection status to snippet

**Files:**
- Modify: `content.js`

- [ ] **Step 1: Add `getConnectionStatus()` after `resolveSiteUrl`**

Insert this function:
```js
function getConnectionStatus() {
  const h2 = document.querySelector('.site-debugger-results h2');
  const text = h2 ? h2.innerText.trim() : '';
  if (text === 'Everything looks great!') return { emoji: '🟢', label: null };
  if (text.includes('site-only connection')) {
    const match = text.match(/\(([^)]+)\)/);
    return { emoji: '🟡', label: match ? match[1] : text };
  }
  return { emoji: '🔴', label: text || 'Unknown error' };
}
```

- [ ] **Step 2: Update `buildSnippet()` to use `getConnectionStatus()`**

Find in `buildSnippet()`:
```js
  const emoji = document.body.innerText.includes('Everything looks great!') ? '🟢' : '🔴';
```

Replace with:
```js
  const { emoji, label } = getConnectionStatus();
  const jpdbPlain = label ? `JPDB ${emoji} \`${label}\`` : `JPDB ${emoji}`;
  const jpdbHtml  = label
    ? `<a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji} <code>${escHtml(label)}</code>`
    : `<a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji}`;
```

- [ ] **Step 3: Update the return value in `buildSnippet()` to use the new variables**

Find:
```js
  return {
    plain: `Site: ${siteUrl} | JPDB ${emoji}${plainExtra} |`,
    html:  `<strong>Site</strong>: <a href="${escHtml(siteUrl)}">${escHtml(siteUrl)}</a> | <a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji}${htmlExtra} |`,
  };
```

Replace with:
```js
  return {
    plain: `Site: ${siteUrl} | ${jpdbPlain}${plainExtra} |`,
    html:  `<strong>Site</strong>: <a href="${escHtml(siteUrl)}">${escHtml(siteUrl)}</a> | ${jpdbHtml}${htmlExtra} |`,
  };
```

- [ ] **Step 4: Verify manually — three cases**

Reload extension in `chrome://extensions` (click refresh icon).

**Case A — green:**
Navigate to a site where jptools shows `Everything looks great!`. Copy snippet. Expected plain text:
```
Site: https://example.com | JPDB 🟢 |
```

**Case B — yellow:**
Navigate to a site where jptools shows `Everything looks great! (site-only connection)`. Copy snippet. Expected plain text:
```
Site: https://example.com | JPDB 🟡 `site-only connection` |
```

**Case C — red:**
Navigate to a site with a broken connection. Copy snippet. Expected plain text:
```
Site: https://example.com | JPDB 🔴 `<full error text from h2>` |
```

Also paste into Zendesk internal note field to verify the HTML version renders with `<code>` formatting.

- [ ] **Step 5: Commit**

```bash
git add content.js
git commit -m "feat: add Jetpack connection status to snippet"
```

---

## Task 3: Plan-based product links

**Files:**
- Modify: `content.js`

- [ ] **Step 1: Add `getSitePlanSlugs()` and `getBlogId()` after `getConnectionStatus()`**

```js
function getSitePlanSlugs() {
  return [...document.querySelectorAll('#get_plans_and_products strong')]
    .map(el => el.innerText.trim());
}

function getBlogId() {
  const el = document.querySelector('#jptools-debug-more-info-blog-id strong');
  return el ? el.innerText.trim() : '';
}
```

- [ ] **Step 2: Replace `PRODUCTS` array with `PRODUCT_RULES`**

Find:
```js
const PRODUCTS = [
  { linkText: 'Backup and Scan', label: 'RWDB' },
  { linkText: 'Social RC',       label: 'SocialRC' },
  { linkText: 'Videos',          label: 'VideoTools' },
  { linkText: 'Akismet',         label: 'AKMC' },
];
```

Replace with:
```js
const PRODUCT_RULES = [
  { label: 'RWDB',       slugPrefixes: ['jetpack_backup', 'jetpack_scan'], linkText: 'Backup and Scan' },
  { label: 'VideoTools', slugPrefixes: ['jetpack_videopress'],             linkText: 'Videos' },
  { label: 'SocialRC',   slugPrefixes: ['jetpack_social'],                 linkText: 'Social RC' },
  { label: 'AKMC',       slugPrefixes: ['jetpack_anti_spam'],              linkText: 'Akismet' },
  { label: 'Stats',      slugPrefixes: ['jetpack_stats'],                  linkFn: (blogId) => `https://wordpress.com/my-stats/?blog=${blogId}` },
];
```

- [ ] **Step 3: Update `buildSnippet()` to use plan-based detection**

Find the product loop in `buildSnippet()`:
```js
  for (const { linkText, label } of PRODUCTS) {
    const href = getUsefulLink(linkText);
    if (href) {
      plainExtra += ` | ${label}`;
      htmlExtra  += ` | <a href="${escHtml(href)}">${label}</a>`;
    }
  }
```

Replace with:
```js
  const planSlugs = getSitePlanSlugs();
  const blogId = getBlogId();

  for (const rule of PRODUCT_RULES) {
    const hasProduct = rule.slugPrefixes.some(prefix =>
      planSlugs.some(slug => slug.startsWith(prefix))
    );
    if (!hasProduct) continue;

    const href = rule.linkFn ? rule.linkFn(blogId) : getUsefulLink(rule.linkText);
    if (!href) continue;

    plainExtra += ` | ${rule.label}`;
    htmlExtra  += ` | <a href="${escHtml(href)}">${rule.label}</a>`;
  }
```

- [ ] **Step 4: Verify manually**

Reload extension in `chrome://extensions`.

**Case A — site with no paid plans:**
Navigate to a site with no Jetpack plans. Copy snippet. Expected: no product labels after JPDB status.
```
Site: https://example.com | JPDB 🟢 |
```

**Case B — site with Backup + Scan + VideoPress:**
Navigate to a site with those plans (e.g. `alin.mystagingwebsite.com` used earlier). Copy snippet. Expected:
```
Site: https://alin.mystagingwebsite.com | JPDB 🟢 | RWDB | VideoTools |
```
RWDB appears once despite having both Backup and Scan. VideoTools link goes to the VideoPress tool page.

**Case C — site with Social + Stats + Akismet:**
Expected:
```
Site: https://example.com | JPDB 🟢 | SocialRC | AKMC | Stats |
```
Stats link should be `https://wordpress.com/my-stats/?blog=<blogId>`.

Paste all cases into Zendesk internal note to confirm product labels are hyperlinked in HTML version.

- [ ] **Step 5: Commit**

```bash
git add content.js
git commit -m "feat: show product links only when plan is active"
```
