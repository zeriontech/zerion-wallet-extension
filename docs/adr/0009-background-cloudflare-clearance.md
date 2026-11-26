# Background Cloudflare clearance: DNR cookie mirror, not an offscreen document

ZPI challenges the extension's service worker with Cloudflare managed challenges (`cf-mitigated: challenge`). The clearance is a `cf_clearance` cookie with the `Partitioned` attribute, and a service-worker fetch does not send partitioned cookies even with `credentials: 'include'`. Extension documents (popup, side panel, tabs) do not have this limitation, which is why the existing Turnstile sheet works for UI requests.

Decision: read the cookies with `chrome.cookies.getAll({ partitionKey: {} })` and mirror them into one `declarativeNetRequest` session rule per ZPI host. The rule sets the full `Cookie` header on requests whose `tabIds` are `[TAB_ID_NONE]` and whose initiator is the extension (`initiatorDomains: [extensionId]`), for `xmlhttprequest`/`other`. `declarativeNetRequestWithHostAccess` is enough for `modifyHeaders` and does not add a permission warning. The rule is refreshed on startup and on `chrome.cookies.onChanged`, and removed when there is no usable `cf_clearance`.

The alternative, running ZPI calls in an offscreen document, was rejected: it needs the `offscreen` permission, a second document lifecycle, and message plumbing for every request, only to obtain the same cookie behaviour extension documents already have. The DNR path also keeps callers and `ky` hooks in place, so timeouts and error propagation are unchanged.

Consequences:

- The rule must never match web pages. `tabIds: [TAB_ID_NONE]` plus the extension initiator is the boundary; a page request from `app.zerion.io` cannot match.
- The full Cookie header is required because `set` replaces an existing header. `src/background/cloudflare/cookies.ts` builds it from all cookies applicable to the host, one value per name, using the freshest `cf_clearance` across partitions.
- Settings can invalidate a still-unexpired clearance (Cloudflare Precursor). A challenged call then starts a new resolution; the flow does not assume the cookie is sufficient.
- The 30-minute Security check tab cooldown uses the dismissal timestamp in Chrome session storage. It survives worker suspension, including when closing the tab is what wakes the worker. It does not block the sheet in an open extension UI.
- Firefox is not built. It has a background page rather than a service worker, no `chrome.runtime.getContexts`, and different cookie partitioning; the feature flag is gated to Chrome.
- Chrome 119+ is required for `partitionKey` in `chrome.cookies.getAll` and `chrome.runtime.getContexts`.
