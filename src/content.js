/* Content script — injected into every http(s) page.
   The overlay lives in an isolated Shadow DOM to prevent style leakage. */

const SHADOW_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :host {
    --bg: #ffffff;
    --surface: #f5f5f5;
    --border: #e2e2e2;
    --text: #111111;
    --text-muted: #6b7280;
    --accent: #c4622d;
    --accent-fg: #ffffff;
    --accent-green: #2b5219;
    --badge-bg: #fdeee6;
    --badge-text: #c4622d;
    --copy-bg: #f3f4f6;
    --copy-hover: #e5e7eb;
    --copy-success: #d1fae5;
    --copy-success-text: #065f46;
    --radius: 10px;
    --shadow: 0 4px 20px rgba(0,0,0,0.14);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: var(--text);
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --bg: #1c1c1c;
      --surface: #262626;
      --border: #363636;
      --text: #eeeeee;
      --text-muted: #9ca3af;
      --accent: #e8893a;
      --accent-green: #7abf5a;
      --badge-bg: #3a1f0a;
      --badge-text: #f0a050;
      --copy-bg: #2e2e2e;
      --copy-hover: #3a3a3a;
      --copy-success: #064e3b;
      --copy-success-text: #6ee7b7;
      --shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
  }

  #pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: 20px;
    padding: 6px 12px 6px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    box-shadow: var(--shadow);
    transition: transform 0.15s, opacity 0.15s;
    white-space: nowrap;
  }

  #pill:hover { transform: scale(1.04); }
  #pill:active { transform: scale(0.97); }

  #pill svg { width: 14px; height: 14px; flex-shrink: 0; }

  #dismiss-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    margin-left: 2px;
    border-radius: 50%;
    transition: color 0.15s;
  }
  #dismiss-btn:hover { color: #fff; }
  #dismiss-btn svg { width: 12px; height: 12px; }

  #panel {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    min-width: 220px;
    max-width: 300px;
    overflow: hidden;
  }

  #panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    gap: 6px;
  }

  #panel-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  #close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    border-radius: 4px;
    padding: 2px;
    transition: color 0.15s, background 0.15s;
  }
  #close-btn:hover { color: var(--text); background: var(--surface); }
  #close-btn svg { width: 13px; height: 13px; }

  #pairs-list {
    list-style: none;
    padding: 4px 0;
    max-height: 240px;
    overflow-y: auto;
  }

  .pair-row {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    gap: 5px;
  }

  .pair-row:hover { background: var(--surface); }

  .pair-source {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--badge-bg);
    color: var(--badge-text);
    flex-shrink: 0;
  }

  .pair-resource { font-weight: 600; flex-shrink: 0; }
  .pair-eq { color: var(--text-muted); flex-shrink: 0; }
  .pair-id {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: var(--accent-green);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--copy-bg);
    border: none;
    border-radius: 4px;
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }
  .copy-btn:hover { background: var(--copy-hover); color: var(--text); }
  .copy-btn.success { background: var(--copy-success); color: var(--copy-success-text); }
  .copy-btn svg { width: 11px; height: 11px; pointer-events: none; }
`;

const COPY_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
  <path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5v-7A1.5 1.5 0 0 1 2.5 1h7A1.5 1.5 0 0 1 11 2.5V3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

const CHECK_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

let hostEl = null;
let shadowRoot = null;
let currentPairs = [];
let dismissed = false;

function pairToString(pair) {
  return `${pair.resource}=${pair.id}`;
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.innerHTML = CHECK_ICON;
    btn.classList.add('success');
    setTimeout(() => {
      btn.innerHTML = COPY_ICON;
      btn.classList.remove('success');
    }, 1500);
  } catch {
    // Clipboard unavailable
  }
}

function buildPill(count) {
  const btn = document.createElement('button');
  btn.id = 'pill';
  btn.title = 'Show extracted params';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Brim -->
      <ellipse cx="12" cy="17.5" rx="9" ry="1.8" fill="currentColor"/>
      <!-- Crown -->
      <path d="M5.5 17 C6 17 7 8 12 8 C17 8 18 17 18.5 17 Z" fill="currentColor"/>
      <!-- Band (subtle dark cutout via opacity) -->
      <rect x="5.7" y="14.6" width="12.6" height="1.8" rx="0.4" fill="rgba(0,0,0,0.28)"/>
      <!-- Question mark -->
      <path d="M10 11.5 C10 9.4 14 9.4 14 11.5 C14 12.6 12 13 12 13.8"
            stroke="rgba(0,0,0,0.28)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <circle cx="12" cy="14.5" r="0.65" fill="rgba(0,0,0,0.28)"/>
    </svg>
    <span>${count} param${count !== 1 ? 's' : ''}</span>
  `;

  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'dismiss-btn';
  dismissBtn.title = 'Dismiss overlay';
  dismissBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissed = true;
    hostEl.remove();
    hostEl = null;
    shadowRoot = null;
  });

  btn.appendChild(dismissBtn);
  btn.addEventListener('click', () => showPanel());
  return btn;
}

function buildPairRow(pair) {
  const li = document.createElement('li');
  li.className = 'pair-row';

  const src = document.createElement('span');
  src.className = 'pair-source';
  src.textContent = pair.source;

  const res = document.createElement('span');
  res.className = 'pair-resource';
  res.textContent = pair.resource;

  const eq = document.createElement('span');
  eq.className = 'pair-eq';
  eq.textContent = '=';

  const id = document.createElement('span');
  id.className = 'pair-id';
  id.textContent = pair.id;
  id.title = pair.id;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.title = `Copy ${pair.id}`;
  copyBtn.innerHTML = COPY_ICON;
  copyBtn.addEventListener('click', () => copyText(pair.id, copyBtn));

  li.append(src, res, eq, id, copyBtn);
  return li;
}

function buildPanel(pairs) {
  const panel = document.createElement('div');
  panel.id = 'panel';

  const header = document.createElement('div');
  header.id = 'panel-header';

  const title = document.createElement('span');
  title.id = 'panel-title';
  title.textContent = 'Param Scout';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-btn';
  closeBtn.title = 'Close panel';
  closeBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  closeBtn.addEventListener('click', () => showPill(pairs.length));

  header.append(title, closeBtn);

  const list = document.createElement('ul');
  list.id = 'pairs-list';
  pairs.forEach((pair) => list.appendChild(buildPairRow(pair)));

  panel.append(header, list);
  return panel;
}

function clearShadow() {
  if (!shadowRoot) return;
  // Remove everything except the style tag
  const toRemove = shadowRoot.querySelectorAll('#pill, #panel');
  toRemove.forEach((el) => el.remove());
}

function showPill(count) {
  clearShadow();
  shadowRoot.appendChild(buildPill(count));
}

function showPanel() {
  clearShadow();
  shadowRoot.appendChild(buildPanel(currentPairs));
}

function ensureHost() {
  if (hostEl && hostEl.isConnected) return;

  hostEl = document.createElement('div');
  hostEl.id = 'param-scout-host';
  document.body.appendChild(hostEl);

  shadowRoot = hostEl.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = SHADOW_CSS;
  shadowRoot.appendChild(style);
}

function update(pairs) {
  currentPairs = pairs;

  if (dismissed || pairs.length === 0) {
    if (hostEl) {
      hostEl.remove();
      hostEl = null;
      shadowRoot = null;
    }
    if (pairs.length > 0) {
      // New pairs appeared after dismiss — reset dismiss state and show again
      dismissed = false;
    } else {
      return;
    }
  }

  if (pairs.length === 0) return;

  ensureHost();

  // If panel is currently open, refresh it; otherwise show the pill
  const panelOpen = shadowRoot.getElementById('panel');
  if (panelOpen) {
    showPanel();
  } else {
    showPill(pairs.length);
  }
}

// Listen for updates from the service worker
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'PARAM_SCOUT_UPDATE') {
    dismissed = false; // New navigation — reset dismiss
    update(msg.pairs ?? []);
  }
});
