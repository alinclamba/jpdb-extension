function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSiteParam() {
  return new URLSearchParams(window.location.search).get('url') || '';
}

function resolveSiteUrl(raw) {
  if (/^\d+$/.test(raw)) {
    const match = document.body.innerText.match(/siteurl:\s*(https?:\/\/[^\s(]+)/);
    return match ? match[1] : raw;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

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

function getSitePlanSlugs() {
  return [...document.querySelectorAll('#get_plans_and_products strong')]
    .map(el => el.innerText.trim());
}

function getBlogId() {
  const el = document.querySelector('#jptools-debug-more-info-blog-id strong');
  return el ? el.innerText.trim() : '';
}

function getUsefulLink(linkText) {
  const anchors = document.querySelectorAll('a');
  for (const a of anchors) {
    if (a.textContent.trim().toLowerCase() === linkText.toLowerCase()) return a.href;
  }
  return null;
}

const PRODUCT_RULES = [
  { label: 'RWDB',       slugPrefixes: ['jetpack_backup', 'jetpack_scan'], linkText: 'Backup and Scan' },
  { label: 'VideoTools', slugPrefixes: ['jetpack_videopress'],             linkText: 'Videos' },
  { label: 'SocialRC',   slugPrefixes: ['jetpack_social'],                 linkText: 'Social RC' },
  { label: 'AKMC',       slugPrefixes: ['jetpack_anti_spam'],              linkText: 'Akismet' },
  { label: 'Stats',      slugPrefixes: ['jetpack_stats'],                  linkFn: (blogId) => `https://wordpress.com/my-stats/?blog=${blogId}` },
];

function buildSnippet() {
  const raw = getSiteParam();
  if (!raw) return null;

  const siteUrl = resolveSiteUrl(raw);
  const jpdbUrl = `https://jptools.wordpress.com/debug/?url=${encodeURIComponent(raw)}`;
  const { emoji, label } = getConnectionStatus();
  const jpdbPlain = label ? `JPDB ${emoji} \`${label}\`` : `JPDB ${emoji}`;
  const jpdbHtml  = label
    ? `<a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji} <code>${escHtml(label)}</code>`
    : `<a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji}`;

  let plainExtra = '';
  let htmlExtra = '';

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

  return {
    plain: `Site: ${siteUrl} | ${jpdbPlain}${plainExtra} |`,
    html:  `<strong>Site</strong>: <a href="${escHtml(siteUrl)}">${escHtml(siteUrl)}</a> | ${jpdbHtml}${htmlExtra} |`,
  };
}

const btn = document.createElement('button');
btn.textContent = 'Copy JPDB info';
btn.title = 'Copy JPDB snippet to clipboard';

Object.assign(btn.style, {
  padding: '6px 14px',
  background: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontFamily: 'system-ui, sans-serif',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  verticalAlign: 'middle',
});

btn.addEventListener('mouseenter', () => { btn.style.background = '#005bb5'; });
btn.addEventListener('mouseleave', () => {
  if (btn.textContent !== 'Copied!') btn.style.background = '#0070f3';
});

btn.addEventListener('click', async () => {
  const snippet = buildSnippet();
  if (!snippet) {
    btn.textContent = 'No URL param found';
    btn.style.background = '#c00';
    setTimeout(() => {
      btn.textContent = 'Copy JPDB info';
      btn.style.background = '#0070f3';
    }, 2000);
    return;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([snippet.plain], { type: 'text/plain' }),
        'text/html': new Blob([snippet.html], { type: 'text/html' }),
      }),
    ]);
    btn.textContent = 'Copied!';
    btn.style.background = '#1a8a3a';
    setTimeout(() => {
      btn.textContent = 'Copy JPDB info';
      btn.style.background = '#0070f3';
    }, 2000);
  } catch (err) {
    console.error(err);
    btn.textContent = 'Copy failed';
    btn.style.background = '#c00';
    setTimeout(() => {
      btn.textContent = 'Copy JPDB info';
      btn.style.background = '#0070f3';
    }, 2000);
  }
});

const nav = document.querySelector('.pri-nav.home-nav');
if (nav) {
  const li = document.createElement('li');
  li.appendChild(btn);
  nav.prepend(li);
} else {
  document.body.appendChild(btn);
}
