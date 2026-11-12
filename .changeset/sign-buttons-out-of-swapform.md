---
'zerion-wallet': patch
---

Internal: the hold-to-sign buttons (`RegularSignButton`, `DangerSignButton`, `HoldableButton`, `ReadonlySignButton`) moved from `SwapForm2` to `src/ui/components/HoldToSignButton`; Send and Perps no longer import them from the Swap page.
