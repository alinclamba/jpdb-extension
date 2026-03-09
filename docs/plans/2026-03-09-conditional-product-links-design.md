# Design: Conditional Product Links in Snippet

**Date:** 2026-03-09

## Summary

Extend the "Copy JPDB info" button to include conditional links in the copied snippet based on which Jetpack products a site has active.

## Detection

The JPDB debugger page (`jptools.wordpress.com/debug/`) contains a "Useful links" section inside Blog Details. This section only renders links for products the site actually has. Presence of a link with specific text = product is active.

## Mapping

| Link text on page | Label in snippet | Notes |
|---|---|---|
| Backup and Scan | RWDB | Rewind debugger |
| Social RC | SocialRC | Social report card |
| Videos | VideoTools | Video file tools |
| Akismet | AKMC | Akismet key info |

## Snippet format

Plain text:
```
Site: https://example.com | JPDB 🟢 | RWDB | SocialRC |
```

HTML (each label is a hyperlink using the href extracted directly from the page):
```html
<strong>Site</strong>: <a href="...">https://example.com</a> | <a href="...">JPDB</a> 🟢 | <a href="...">RWDB</a> | <a href="...">SocialRC</a> |
```

## Implementation

- Add a `getUsefulLink(text)` helper that finds an `<a>` in the "Useful links" section by its trimmed text content and returns its `href` (or `null` if absent).
- In `buildSnippet()`, call `getUsefulLink()` for each product and append to plain/html strings if present.
- No blog IDs or emails hardcoded — all URLs come from the page.

## Extensibility

Adding a new product = one entry in the mapping array. No structural changes needed.
