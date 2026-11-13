---
'zerion-wallet': patch
---

Internal: the pre-sign warning card, the "unverified" notice and the simulation-warning helpers moved from `SwapForm2` to `src/ui/components/PreSignWarning`, so the Send form and the unknown-receiver dialog no longer import from the Swap page.
