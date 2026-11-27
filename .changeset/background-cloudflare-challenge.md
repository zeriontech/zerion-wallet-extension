---
'zerion-wallet': patch
---

Handle Cloudflare managed challenges in the background service worker. A background ZPI call that receives `cf-mitigated: challenge` now asks the user to solve Turnstile in the open extension UI, or in a new Security check page when no UI is open. The clearance cookie is mirrored into a DNR rule so worker requests carry it. Ships behind `FEATURE_BACKGROUND_CLOUDFLARE_CHALLENGE`, on by default; set it to `off` to disable.
