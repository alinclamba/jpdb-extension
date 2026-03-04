const input = document.getElementById('url-input');
const statusEl = document.getElementById('status');
const snippetBtn = document.getElementById('snippet-btn');
const errorEl = document.getElementById('error');

let inFlight = false;

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

  let emoji;
  try {
    const res = await fetch(`https://jptools.wordpress.com/debug/?url=${encodeURIComponent(domain)}`);
    const text = await res.text();
    emoji = text.includes('Everything looks great!') ? '🟢' : '🔴';
  } catch {
    statusEl.textContent = '';
    errorEl.textContent = 'Not reachable. Are you proxied?';
    errorEl.style.display = 'block';
    inFlight = false;
    return;
  }

  const jpdbUrl = `https://jptools.wordpress.com/debug/?url=${encodeURIComponent(domain)}`;
  const siteUrl = `https://${domain}`;

  const plainText = `Site: ${siteUrl} | JPDB ${emoji} |`;
  const htmlText = `Site: ${siteUrl} | <a href="${jpdbUrl}">JPDB</a> ${emoji} |`;

  statusEl.textContent = '';
  snippetBtn.textContent = plainText;
  snippetBtn.style.display = 'block';

  // Store for clipboard
  snippetBtn._plain = plainText;
  snippetBtn._html = htmlText;

  inFlight = false;
});

snippetBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([snippetBtn._plain], { type: 'text/plain' }),
        'text/html': new Blob([snippetBtn._html], { type: 'text/html' }),
      }),
    ]);
    snippetBtn.textContent = 'Copied!';
    snippetBtn.classList.add('copied');
    setTimeout(() => {
      snippetBtn.textContent = snippetBtn._plain;
      snippetBtn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    snippetBtn.textContent = 'Copy failed';
  }
});
