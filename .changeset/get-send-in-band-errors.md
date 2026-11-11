---
'zerion-wallet': minor
---

Send form: show the in-band get-send/v1 error (e.g. "This token can't be transferred") as a banner, render the network fee for error responses that carry one, and show a "Top up your wallet" button when the backend hints it — with the deposit form pre-filled with the missing asset when known. Amounts above the held balance are no longer sent to the backend and disable the button with "Insufficient balance". Responses from a previous token, amount or recipient are no longer shown, simulated or signed.
