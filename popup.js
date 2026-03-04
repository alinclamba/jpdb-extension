const input = document.getElementById('url-input');
const statusEl = document.getElementById('status');
const snippetBtn = document.getElementById('snippet-btn');
const errorEl = document.getElementById('error');

let inFlight = false;
let snippetPlain = '';
let snippetHtml = '';

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripUrl(raw) {
  return raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

input.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const raw = input.value;
  if (!raw.trim() || inFlight) return;

  const domain = stripUrl(raw);
  if (!domain) return;

  inFlight = true;
  snippetBtn.style.display = 'none';
  errorEl.style.display = 'none';
  snippetBtn.classList.remove('copied');
  statusEl.textContent = 'Checking…';

  const jpdbUrl = `https://jptools.wordpress.com/debug/?url=${encodeURIComponent(domain)}`;

  let emoji;
  try {
    const res = await fetch(jpdbUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    emoji = text.includes('Everything looks great!') ? '🟢' : '🔴';
  } catch {
    statusEl.textContent = '';
    errorEl.textContent = 'Not reachable. Are you proxied?';
    errorEl.style.display = 'block';
    inFlight = false;
    return;
  }

  const siteUrl = `https://${domain}`;

  snippetPlain = `Site: ${siteUrl} | JPDB ${emoji} |`;
  snippetHtml = `Site: ${escHtml(siteUrl)} | <a href="${escHtml(jpdbUrl)}">JPDB</a> ${emoji} |`;

  statusEl.textContent = '';
  snippetBtn.textContent = snippetPlain;
  snippetBtn.style.display = 'block';

  inFlight = false;
});

snippetBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([snippetPlain], { type: 'text/plain' }),
        'text/html': new Blob([snippetHtml], { type: 'text/html' }),
      }),
    ]);
    snippetBtn.textContent = 'Copied!';
    snippetBtn.classList.add('copied');
    setTimeout(() => {
      snippetBtn.textContent = snippetPlain;
      snippetBtn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error(err);
    snippetBtn.textContent = 'Copy failed';
    setTimeout(() => {
      snippetBtn.textContent = snippetPlain;
    }, 2000);
  }
});
