function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSiteParam() {
  return new URLSearchParams(window.location.search).get('url') || '';
}

function buildSnippet() {
  const raw = getSiteParam();
  if (!raw) return null;

  const isNumericId = /^\d+$/.test(raw);
  const siteUrl = isNumericId ? raw : `https://${raw}`;
  const jpdbUrl = `https://jptools.wordpress.com/debug/?url=${encodeURIComponent(raw)}`;
  const emoji = document.body.innerText.includes('Everything looks great!') ? '🟢' : '🔴';

  return {
    plain: `Site: ${siteUrl} | JPDB ${emoji} |`,
    html: `Site: ${escHtml(siteUrl)} | <a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji} |`,
  };
}

const btn = document.createElement('button');
btn.textContent = 'Copy JPDB info';
btn.title = 'Copy JPDB snippet to clipboard';

Object.assign(btn.style, {
  position: 'fixed',
  left: '0',
  top: '50%',
  transform: 'translateY(-50%) rotate(-90deg)',
  transformOrigin: 'left center',
  translate: '0 -100%',
  zIndex: '99999',
  padding: '8px 16px',
  background: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '0 0 8px 8px',
  fontSize: '13px',
  fontFamily: 'system-ui, sans-serif',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
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

document.body.appendChild(btn);
