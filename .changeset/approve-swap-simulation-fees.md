---
'zerion-wallet': patch
---

A swap or bridge that needs an approve simulates again: the approve now takes the swap's network fees exactly instead of a rescaled copy that could land 1 wei lower, which the simulation backend rejected. When the simulation is unavailable, a bridge to your own wallet shows the output as a receive on the destination chain, and swap and bridge rows show the provider as the application.
