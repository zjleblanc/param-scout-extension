import { extractPairs } from './parser.js';

const STORAGE_KEY_PREFIX = 'param_scout_tab_';

const COPY_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
  <path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5v-7A1.5 1.5 0 0 1 2.5 1h7A1.5 1.5 0 0 1 11 2.5V3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

const CHECK_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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
    // Clipboard write blocked; silent fallback
  }
}

function buildPairRow(pair) {
  const li = document.createElement('li');
  li.className = 'pair-row';

  const sourceBadge = document.createElement('span');
  sourceBadge.className = 'pair-source-badge';
  sourceBadge.textContent = pair.source;

  const resource = document.createElement('span');
  resource.className = 'pair-resource';
  resource.textContent = pair.resource;

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

  li.append(sourceBadge, resource, eq, id, copyBtn);
  return li;
}

function renderPairs(pairs, url) {
  const emptyState = document.getElementById('empty-state');
  const pairsList = document.getElementById('pairs-list');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const urlPill = document.getElementById('url-pill');
  const footer = document.getElementById('footer');
  const pairCount = document.getElementById('pair-count');

  if (url) {
    try {
      const parsed = new URL(url);
      urlPill.textContent = parsed.hostname + parsed.pathname;
      urlPill.title = url;
    } catch {
      urlPill.textContent = url;
    }
  }

  if (!pairs || pairs.length === 0) {
    emptyState.hidden = false;
    pairsList.hidden = true;
    copyAllBtn.hidden = true;
    footer.hidden = true;
    return;
  }

  emptyState.hidden = true;
  pairsList.hidden = false;
  copyAllBtn.hidden = false;
  footer.hidden = false;

  pairsList.innerHTML = '';
  pairs.forEach((pair) => pairsList.appendChild(buildPairRow(pair)));

  const count = pairs.length;
  pairCount.textContent = `${count} pair${count !== 1 ? 's' : ''} found`;

  copyAllBtn.addEventListener('click', () => {
    const text = pairs.map(pairToString).join('\n');
    copyText(text, copyAllBtn);
  });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const key = `${STORAGE_KEY_PREFIX}${tab.id}`;
  const result = await chrome.storage.session.get(key);
  const stored = result[key];

  if (stored && stored.url === tab.url) {
    renderPairs(stored.pairs, stored.url);
  } else if (tab.url) {
    // Fallback: parse inline — covers first load and SPA navigation races
    const pairs = extractPairs(tab.url);
    renderPairs(pairs, tab.url);
  } else {
    renderPairs([], null);
  }
}

init();
