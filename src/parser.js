/**
 * Patterns that identify a URL path segment as an ID rather than a resource name.
 *
 * Ordered from most-specific to least-specific so early matches short-circuit.
 */
const ID_PATTERNS = [
  // UUID v1–v5
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  // Pure numeric (e.g. 15, 183, 1042)
  /^\d+$/,
  // Pure hex string of 7+ chars (git SHA, MongoDB ObjectId, etc.)
  /^[0-9a-f]{7,}$/i,
  // Mixed alphanumeric: >= 6 chars, has both letters and digits, at least 2 digits
  // Avoids false-positives on plain words like "details" or "inventory"
  /^(?=.*[a-zA-Z])(?=(?:.*\d){2,})[a-zA-Z0-9_-]{6,}$/,
];

/**
 * Returns true when a path segment looks like an ID.
 * @param {string} segment
 * @returns {boolean}
 */
function isId(segment) {
  return ID_PATTERNS.some((re) => re.test(segment));
}

/**
 * Extracts resource/ID pairs from a URL's path segments.
 *
 * Strategy: walk segments left-to-right. When a segment is classified as an
 * ID, the last non-ID segment before it becomes the resource name.
 *
 * @param {string} pathname  URL pathname (e.g. "/inventories/inventory/15/sources/183/details")
 * @returns {{ resource: string, id: string, source: 'path' }[]}
 */
function parsePathPairs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const pairs = [];
  let lastResource = null;

  for (const segment of segments) {
    const decoded = decodeURIComponent(segment);
    if (isId(decoded)) {
      if (lastResource !== null) {
        pairs.push({ resource: lastResource, id: decoded, source: 'path' });
        lastResource = null;
      }
    } else {
      lastResource = decoded;
    }
  }

  return pairs;
}

/**
 * Extracts key/value pairs from all query parameters.
 *
 * Every parameter with a non-empty value is included, using the parameter
 * key as the resource name. Parameters without a value (e.g. `?flag`) are
 * skipped.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ resource: string, id: string, source: 'query' }[]}
 */
function parseQueryPairs(searchParams) {
  const pairs = [];
  for (const [key, value] of searchParams.entries()) {
    if (value !== '') {
      pairs.push({ resource: key, id: value, source: 'query' });
    }
  }
  return pairs;
}

/**
 * Extracts query pairs embedded within URL-encoded path segments.
 *
 * Some applications (e.g. ServiceNow) encode a query string inside a path
 * segment rather than appending it to the URL directly:
 *
 *   /params/target/sc_request.do%3Fsys_id%3Dabc%26sysparm_catalog%3Dxyz
 *
 * When a segment is percent-decoded and the result contains `?`, the portion
 * after `?` is treated as a query string and all non-empty key/value pairs
 * are extracted.
 *
 * @param {string} pathname
 * @returns {{ resource: string, id: string, source: 'query' }[]}
 */
function parseEmbeddedQueryPairs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const pairs = [];
  for (const segment of segments) {
    const decoded = decodeURIComponent(segment);
    const qIdx = decoded.indexOf('?');
    if (qIdx === -1) continue;
    try {
      const params = new URLSearchParams(decoded.slice(qIdx + 1));
      for (const [key, value] of params.entries()) {
        if (value !== '') {
          pairs.push({ resource: key, id: value, source: 'query' });
        }
      }
    } catch {
      // Ignore malformed embedded query strings
    }
  }
  return pairs;
}

/**
 * Parses a full URL string and returns all detected resource/ID pairs.
 *
 * @param {string} urlString
 * @returns {{ resource: string, id: string, source: 'path' | 'query' }[]}
 */
export function extractPairs(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return [];
  }

  // Skip non-http(s) URLs (chrome://, file://, etc.)
  if (!url.protocol.startsWith('http')) {
    return [];
  }

  return [
    ...parsePathPairs(url.pathname),
    ...parseEmbeddedQueryPairs(url.pathname),
    ...parseQueryPairs(url.searchParams),
  ];
}
