---
'zerion-wallet': patch
---

Try solving a background Cloudflare challenge silently in an offscreen document before showing the Turnstile sheet or Security check page. If the hidden attempt cannot finish, the visible flow is used instead.
