# Silent Cloudflare solving: offscreen first, visible fallback

ADR 0009 deliberately avoided silent solving: the clearance came from a visible sheet or page. Product now wants the common case to be invisible. Most challenges need no user interaction, and interrupting a background refresh with a full-page check is disproportionate when the same first-party widget can finish on its own.

Decision: when a background ZPI call is challenged, first load `https://app.zerion.io/turnstile.html` in a hidden offscreen document and wait up to 5 seconds for the existing `set-turnstile-token` message. On a token, the normal solved path runs: the cookie mirror refreshes, waiting calls retry, and no extension UI opens. On any failure — `chrome.offscreen` unavailable, document creation error, iframe error, or timeout — the offscreen document is closed and the existing visible flow (sheet if a UI is open, otherwise the Security check page) is shown.

This does not introduce a new challenge solver. It is the same widget, same origin, and same token handler as the visible surfaces. What changes is where it runs and whether the user sees it.

Consequences:

- Requires the `offscreen` permission. Chrome allows one offscreen document per extension; an attempt closes any stale one, creates a fresh page, and always closes it before the attempt promise settles.
- The offscreen page is an extension document. Its runtime messages are accepted only from extension pages, and it forwards only the token's arrival, never the token value.
- The 5-second budget is a product choice: long enough for pre-clearance to complete, short enough that an interactive challenge still falls back quickly. A challenge that needs interaction always falls back.
- `cloudflareChallengeSolved` gains the `offscreen` surface so we can measure how often the hidden path succeeds. No `cloudflareChallengeIssued` event is emitted for a silent solve because nothing was shown to the user.
- The offscreen path is Chrome-only, like the rest of this feature. Firefox has no offscreen API.
- The visible fallback must remain fully functional. A change to the challenge coordinator must keep the offscreen attempt non-blocking for visible surfaces and must never leave both a hidden attempt and a sheet open.
