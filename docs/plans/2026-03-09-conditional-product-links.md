# Conditional Product Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the copied snippet to include conditional product links (RWDB, SocialRC, VideoTools, AKMC) based on links present in the "Useful links" section of the JPDB debugger page.

**Architecture:** Add a `getUsefulLink(text)` helper that scans the "Useful links" section for an anchor by text and returns its href. Update `buildSnippet()` to check for each product and append to both plain and HTML snippet strings.

**Tech Stack:** Vanilla JS, Chrome MV3 content script. No build step. Manual testing by reloading the extension in chrome://extensions.

---

### Task 1: Add `getUsefulLink()` helper

**Files:**
- Modify: `content.js`

**Step 1: Add helper after `buildSnippet()`**

Find the "Useful links" heading by scanning all elements for text containing "Useful links", then collect all `<a>` tags in the same container and match by trimmed text.

```js
function getUsefulLink(linkText) {
  const anchors = document.querySelectorAll('a');
  for (const a of anchors) {
    if (a.textContent.trim() === linkText) return a.href;
  }
  return null;
}
```

Note: The "Useful links" section is scoped to Blog Details, but since the link labels are unique enough (e.g., "Social RC", "Backup and Scan"), a full-page scan is safe.

**Step 2: Verify manually**

Reload extension, open DevTools on the JPDB page, run:
```js
getUsefulLink('Backup and Scan')
// Expected: "https://mc.a8c.com/rewind/debugger.php?site=213505378"

getUsefulLink('Social RC')
// Expected: a URL or null if site has no Social plan
```

---

### Task 2: Update `buildSnippet()` to append conditional links

**Files:**
- Modify: `content.js`

**Step 1: Define the product mapping inside `buildSnippet()`**

```js
const products = [
  { linkText: 'Backup and Scan', label: 'RWDB' },
  { linkText: 'Social RC',       label: 'SocialRC' },
  { linkText: 'Videos',          label: 'VideoTools' },
  { linkText: 'Akismet',         label: 'AKMC' },
];
```

**Step 2: Build conditional strings after existing plain/html**

```js
let plainExtra = '';
let htmlExtra = '';

for (const { linkText, label } of products) {
  const href = getUsefulLink(linkText);
  if (href) {
    plainExtra += ` | ${label}`;
    htmlExtra  += ` | <a href="${escHtml(href)}">${label}</a>`;
  }
}

return {
  plain: `Site: ${siteUrl} | JPDB ${emoji} |${plainExtra}`,
  html:  `<strong>Site</strong>: <a href="${escHtml(siteUrl)}">${escHtml(siteUrl)}</a> | <a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji} |${htmlExtra}`,
};
```

**Step 3: Verify manually**

Reload extension, open JPDB page for a site with backup. Click "Copy JPDB info", paste into a rich-text editor. Expected:
- Plain: `Site: https://example.com | JPDB 🟢 | RWDB | SocialRC |` (only products present on page)
- HTML: each label is a clickable hyperlink

Also test on a site with no backup plan — RWDB should not appear.

**Step 4: Commit**

```bash
git add content.js docs/plans/2026-03-09-conditional-product-links-design.md docs/plans/2026-03-09-conditional-product-links.md
git commit -m "feat: add conditional product links (RWDB, SocialRC, VideoTools, AKMC) to copied snippet"
```
