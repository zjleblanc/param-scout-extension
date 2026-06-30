import { extractPairs } from './parser.js';

const STORAGE_KEY_PREFIX = 'param_scout_tab_';

function storageKey(tabId) {
  return `${STORAGE_KEY_PREFIX}${tabId}`;
}

/**
 * Parse the URL, persist results to session storage, update the badge, and
 * notify the content script in the given tab.
 */
async function processTab(tabId, url) {
  const pairs = extractPairs(url);

  await chrome.storage.session.set({
    [storageKey(tabId)]: { pairs, url },
  });

  if (pairs.length > 0) {
    await chrome.action.setBadgeText({ text: String(pairs.length), tabId });
    await chrome.action.setBadgeBackgroundColor({ color: '#6b3492', tabId });
  } else {
    await chrome.action.setBadgeText({ text: '', tabId });
  }

  // Best-effort message to the content script — it may not be injected yet on
  // restricted pages, so we swallow the error.
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PARAM_SCOUT_UPDATE', pairs });
  } catch {
    // Content script not available (e.g. chrome:// pages, PDFs).
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.url || changeInfo.status === 'complete') && tab.url) {
    processTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) {
    processTab(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(storageKey(tabId));
});
