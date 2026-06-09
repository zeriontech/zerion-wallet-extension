# Swap Form Spec — Defaults, Asset Selection & Network Behavior

## Purpose

This spec defines what the Swap form shows by default and how it changes when the user selects assets, networks, flips the form, or switches wallets.

This is an outcome spec. It describes expected form states and user-visible behavior, not internal implementation.

The Swap form has two sides:

```text
Pay with — the asset the user spends
Receive  — the asset the user gets
```

Each side always has a concrete **pair**:

```text
asset + network
```

Examples:

```text
USDT on Ethereum
USDT on Base
ETH on Ethereum
ETH on Base
```

USDT on Ethereum and USDT on Base are different pairs.

## Core concepts

### Pair

A **pair** means:

```text
asset + network
```

The same asset on two different networks is not the same **pair**.

Example:

```text
USDC on Ethereum ≠ USDC on Polygon
ETH on Ethereum ≠ ETH on Base
```

---

### Pay with

**Pay with** is the asset the user spends.

By default, **Pay with** comes from the user’s wallet balances.

When the user opens the Pay-with asset picker, the default filter is:

```text
All networks
```

This is only a picker filter. It does not mean **Pay with** has no network.

The selected Pay-with pair is always concrete.

Example:

```text
Selected Pay with pair:
USDT on Ethereum

Pay-with picker default filter:
All networks

On the collapsed form, the user sees:

USDT + Ethereum network icon
```

The user does not see **All networks** on the collapsed form.

---

### Receive

**Receive** is the asset the user gets.

When **Receive** is not explicitly provided by an entry point or selected by the user, it is selected from the **Popular** list for the current Receive network.

**Receive** can be a token the user already holds. User balances do not affect the **Receive** default.

The only automatic restriction is:

**Receive** cannot be the exact same pair as **Pay with**.

Example:

```text
Pay with = USDT on Ethereum

Popular on Ethereum:
1. WETH
2. USDC
3. USDT

Receive = WETH on Ethereum
```

Example where the user already holds the Receive token:

```text
User balances:
- USDT on Ethereum = $500
- WETH on Ethereum = $100

Pay with = USDT on Ethereum

Popular on Ethereum:
1. WETH
2. USDC

Receive = WETH on Ethereum
```

This is correct.

The user’s WETH balance is shown in the UI as informational balance, but it does not remove WETH from **Receive**.

When the user explicitly selects a **Receive** asset (via picker), the form remembers this. Late **Popular** responses do not overwrite a user-selected **Receive**.

---

### Popular

**Popular** is an ordered backend-provided list of assets for a specific network.

**Popular** is:

```text
network-specific
wallet-independent
used for Receive defaults
not hardcoded locally
```

**Popular** does not depend on which wallet is currently active.

Example:

```text
Popular on Ethereum:
1. WETH
2. USDC
3. USDT

Popular on Base:
1. USDC
2. ETH
3. USDT
```

These lists may differ.

If **Popular** for a network is not available yet, **Receive** may be empty until **Popular** is available.

Do not invent a **Receive** fallback like:

```text
USDC, USDT, native asset
```

**Receive** should come from **Popular** unless **Receive** was explicitly set by an entry point or by the user.

---

### Same-pair rule

The exact same pair cannot be selected on both sides.

This means:

```text
Pay with = USDT on Ethereum
Receive  = USDT on Ethereum
```

is not allowed.

But this is allowed:

```text
Pay with = USDT on Ethereum
Receive  = USDT on Base
```

because those are different pairs.

In asset pickers, the exact pair already selected on the opposite side is hidden from the list.

Product outcome:

The user cannot manually select the exact same asset on the exact same network on both sides.

---

## Pay-with picker behavior

### Default filter

When the user opens the Pay-with picker, the default selected filter is:

```text
All
```

This is the same aggregate “all networks” scope as in **Pay with** (Core concepts), where the filter is named **All networks**. The picker UI may show the short label **All**.

In **All**, the user sees spendable assets from all networks where they have balances.

Example:

```text
User balances:
- USDT on Ethereum = $8,000
- ETH on Ethereum = $63
- ETH on Base = $53
- BNB on BNB Chain = $44
- WBTC on Arbitrum = $23

Pay-with picker opens with:
All selected

List shows:
- USDT on Ethereum
- ETH on Ethereum
- ETH on Base
- BNB on BNB Chain
- WBTC on Arbitrum
```

This matches the intended UX: even if the selected Pay-with pair is on Ethereum, opening the Pay-with picker shows assets across all networks by default.

### Network filters in Pay-with picker

The Pay-with picker shows specific network filters only for networks where the user has spendable balance.

Example:

```text
User has balances on:
- Ethereum
- Polygon
- BNB Chain
- Base

Pay-with picker filters:
- All
- Ethereum
- Polygon
- BNB Chain
- Base
```

Networks where the user has no spendable balance should not appear as Pay-with network filters.

Selecting a network filter only filters the list. It does not change the form until the user selects an asset.

### Empty wallet in Pay-with picker

If the user has no balances at all:

```text
Pay with defaults to ETH on Ethereum
Pay-with picker opens with All selected
```

Recommended UX:

```text
Show the selected fallback pair:
ETH on Ethereum

Show balance:
0 ETH
```

Do not show balance-based network filters, because the user has no networks with spendable balance.

The form may show an insufficient-balance state once the user enters an amount.

This is an empty-wallet exception. It does not mean empty networks should normally be available in the Pay-with picker.

---

## Receive picker behavior

The Receive picker can show all networks supported for receiving through cross-chain swap.

This list is not limited by the user’s balances.

Example:

```text
Receive network filters may include:
- Ethereum
- Polygon
- Base
- BNB Chain
- Optimism
- Arbitrum
- Solana
```

The exact list should be whatever the product supports for Receive / cross-chain swap.

When the user chooses a Receive network, the Receive asset is selected from **Popular** on that network, unless the user chooses a specific asset.

The exact Pay-with pair is hidden from the **Receive** picker list.

Example:

```text
Pay with = USDT on Ethereum

Receive picker on Ethereum:
USDT on Ethereum is hidden
WETH on Ethereum is available
USDC on Ethereum is available

But:

USDT on Base is available
```

because it is a different pair.

---

## Network link state

The form has a network link state:

```text
Linked
Independent
```

This is a form-session state. It is not just a comparison of current networks.

### Linked

In **Linked** state, **Receive** follows Pay-with network changes.

If the user changes **Pay with** to an asset on another network, **Receive** moves to that same network and selects a **Receive** asset from **Popular** on the new network.

Example:

```text
Before:
Pay with = USDT on Ethereum
Receive  = WETH on Ethereum
State    = Linked

User selects Pay with:
USDC on Polygon

Popular on Polygon:
1. USDC
2. WETH
3. USDT

After:
Pay with = USDC on Polygon
Receive  = WETH on Polygon
State    = Linked
```

Why:

- **Receive** moved to Polygon because the form is **Linked**.
- **Receive** picked the first **Popular** item on Polygon that is not the Pay-with pair.
- USDC on Polygon was skipped because it is already **Pay with**.

---

### Independent

In **Independent** state, Pay-with and **Receive** networks live separately.

Pay-with changes do not move **Receive**.

**Receive** changes do not move **Pay with**.

Example:

```text
Before:
Pay with = ETH on Ethereum
Receive  = USDT on Base
State    = Independent

User selects Pay with:
USDC on Polygon

After:
Pay with = USDC on Polygon
Receive  = USDT on Base
State    = Independent
```

---

### When the form becomes Independent

The form becomes **Independent** when the user manually changes the **Receive** network.

Example:

```text
Before:
Pay with = ETH on Ethereum
Receive  = USDT on Ethereum
State    = Linked

User changes Receive network to Base.

Popular on Base:
1. USDC
2. USDT

After:
Pay with = ETH on Ethereum
Receive  = USDC on Base
State    = Independent
```

The form can also start as **Independent** if the entry point initializes **Pay with** and **Receive** on different networks.

Example:

```text
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent
```

---

### Independent is sticky

Once the form is **Independent**, it stays **Independent** until the form is reset, reopened, or the wallet is switched.

It does not automatically become **Linked** again just because the two networks happen to match.

Example:

```text
Step 1:
Pay with = ETH on Ethereum
Receive  = USDT on Ethereum
State    = Linked

Step 2:
User changes Receive network to Base.

Result:
Pay with = ETH on Ethereum
Receive  = USDC on Base
State    = Independent

Step 3:
User changes Receive network back to Ethereum.

Result:
Pay with = ETH on Ethereum
Receive  = first Popular asset on Ethereum that is not the Pay-with pair
State    = Independent

Step 4:
User changes Pay with to USDC on Polygon.

Result:
Pay with = USDC on Polygon
Receive  = still on Ethereum
State    = Independent
```

The form only becomes **Linked** again after reset, reopen, or wallet switch if the newly initialized state is same-network.

---

## Swap form is a singleton

The Swap form is a single screen. Any entry point — direct open, asset page Trade / Buy, deeplink, copy trade, external intent — updates the same form rather than stacking a new one.

If the user navigates away from the form and returns through a new entry point, the existing form re-initializes from that new entry point. Pickers and intermediate screens between the user and the form are closed.

Example:

```text
Step 1:
User is on the Swap form.
Pay with = USDT on Ethereum
Receive  = ETH on Ethereum

Step 2:
User taps the Pay-with picker.
Pay-with picker opens.

Step 3:
In the picker list, the user taps the info icon on Wrapped BTC.
Asset Details for WBTC opens.

Step 4:
On Asset Details, the user taps Trade (or Buy).

Result:
Pay-with picker is closed.
Asset Details is closed.
The same Swap form is now re-initialized from Entry point 2 (asset page) with WBTC.

If the user holds WBTC:
Pay with = WBTC on Ethereum
Receive  = first Popular asset on Ethereum, not the Pay-with pair
State    = Linked

If the user does not hold WBTC:
Receive  = WBTC on Ethereum
Pay with = chosen by the Entry point 2 Case B priority
State    = Linked or Independent depending on networks
```

"Re-initialize from entry point" works the same way as in Action 5 (Wallet switch):

```text
Discard derived state:
- Pay-with selection
- Receive selection
- Linked / Independent state
- manual Receive selection state
- entered amount / quote state

Then apply the new entry point's rules.
```

Back navigation:

After re-initialization, Back from the Swap form should go to the screen the user was on before the new entry point started (e.g. Asset Details if they came from there, or Home if they came from main navigation), not to the previous Swap form state.

The previous Swap form state is not preserved. If the user wanted to keep the previous swap, they would have pressed Back instead of Trade.

Trending Tokens on the Swap screen work by the same singleton principle: tapping a Trending token updates the current form, it does not open a new form.

The label of the button on Asset Details (Trade vs Buy) does not change the placement rule. Placement of the asset (Pay with vs Receive) is decided by Entry point 2 Case A / Case B based on whether the user holds the asset.

---

## Entry point 1 — Open Swap directly

This is when the user opens Swap from the main app navigation.

### Default behavior

- Select **Pay with** from the user’s highest-value position across all networks.
- Set **Receive** network to the selected Pay-with network.
- Select **Receive** from **Popular** on that network.
- Open in **Linked** state.
- Pay-with picker filter defaults to **All**.

**Example: normal wallet**

```text
User balances:
- USDT on Ethereum = $8,000
- ETH on Ethereum = $63
- ETH on Base = $53
- BNB on BNB Chain = $44
- WBTC on Arbitrum = $23

Popular on Ethereum:
1. ETH
2. USDC
3. WETH

Result:
Pay with = USDT on Ethereum
Receive  = ETH on Ethereum
State    = Linked

Collapsed form:
Pay with shows USDT + Ethereum icon
Receive shows ETH + Ethereum icon

Pay-with picker:
opens with All selected
shows user assets from all networks
```

**Example: first Popular item equals Pay with**

```text
User balances:
- USDT on Ethereum = $500

Popular on Ethereum:
1. USDT
2. WETH
3. USDC

Result:
Pay with = USDT on Ethereum
Receive  = WETH on Ethereum
State    = Linked

Why:
USDT on Ethereum is already Pay with.
Receive takes the next Popular item.
```

**Example: user already holds the first Popular item**

```text
User balances:
- USDT on Ethereum = $500
- WETH on Ethereum = $100

Popular on Ethereum:
1. WETH
2. USDC
3. USDT

Result:
Pay with = USDT on Ethereum
Receive  = WETH on Ethereum
State    = Linked
```

This is correct.

The fact that the user already holds WETH does not remove WETH from **Receive**.

**Example: empty wallet**

```text
User balances:
none

Popular on Ethereum:
1. USDC
2. USDT

Result:
Pay with = ETH on Ethereum
Receive  = USDC on Ethereum
State    = Linked

Pay-with picker:
Filter = All
Selected fallback = ETH on Ethereum
Balance = 0 ETH
No balance-based network filters
```

**Example: Popular not loaded**

```text
User balances:
none

Popular on Ethereum:
not loaded yet

Result:
Pay with = ETH on Ethereum
Receive  = empty
State    = Linked
```

When **Popular** becomes available:

```text
Popular on Ethereum:
1. USDC
2. USDT

Updated result:
Pay with = ETH on Ethereum
Receive  = USDC on Ethereum
State    = Linked
```

If **Popular** never becomes available:

- **Receive** stays empty.
- Swap cannot be quoted normally.

---

## Entry point 2 — Open Swap from an asset page

This is when the user taps Trade / Swap on a specific asset page.

The asset page provides a concrete pair:

```text
asset + network
```

Example:

```text
PEPE on Ethereum
DAI on Polygon
```

### Case A — User holds the asset

If the user holds the asset from the asset page, put that pair in **Pay with**.

Then select **Receive** from **Popular** on the same network.

Open in **Linked** state.

Example:

```text
User taps Trade on:
DAI on Ethereum

User balance:
DAI on Ethereum = $300

Popular on Ethereum:
1. USDC
2. USDT
3. WETH

Result:
Pay with = DAI on Ethereum
Receive  = USDC on Ethereum
State    = Linked

Why:
The user owns DAI, so the natural default is to spend DAI.
```

---

### Case B — User does not hold the asset

If the user does not hold the asset from the asset page, put that pair in **Receive**.

Then choose **Pay with** in this order:

1. Highest-value user position on the same network as **Receive**
2. Highest-value user position on any network
3. Native asset on the **Receive** network, if the user has no balances at all

All candidates must form a different pair than **Receive**.

### Example B1 — user has balance on the same network

```text
User taps Trade on:
PEPE on Ethereum

User balance:
USDT on Ethereum = $500

Result:
Pay with = USDT on Ethereum
Receive  = PEPE on Ethereum
State    = Linked

Why:
The user wants PEPE on Ethereum.
They have spendable funds on Ethereum, so Pay with also stays on Ethereum.
```

### Example B2 — user has no balance on that network, but has balance elsewhere

```text
User taps Trade on:
PEPE on Ethereum

User balance:
USDC on Polygon = $50

Result:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent

Why:
The user wants to receive PEPE on Ethereum,
but their available funds are on Polygon.
The form starts cross-chain.
```

### Example B3 — user has no balances anywhere

```text
User taps Trade on:
PEPE on Ethereum

User balances:
none

Result:
Pay with = ETH on Ethereum
Receive  = PEPE on Ethereum
State    = Linked

Pay with may show:
Balance = 0 ETH
```

The form can show an insufficient-balance state once the user enters an amount.

---

## Entry point 3 — External intent / copy trade / deeplink

External flows may provide one or both sides.

Examples:

```text
copy trade
deeplink
external quote intent
```

If the external flow provides a side explicitly, preserve that side.

### Case A — External flow provides both sides

Use both exact pairs.

Example:

```text
External intent:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum

Result:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent
```

If both sides are on the same network:

```text
External intent:
Pay with = USDC on Ethereum
Receive  = PEPE on Ethereum

Result:
Pay with = USDC on Ethereum
Receive  = PEPE on Ethereum
State    = Linked
```

Do not reselect **Pay with** just because the user has low or zero balance. Show the normal insufficient-balance state if needed.

---

### Case B — External flow provides only Pay with

Use the provided Pay-with pair.

Select **Receive** from **Popular** on the same network.

Open in **Linked** state.

Example:

```text
External intent:
Pay with = USDC on Polygon

Popular on Polygon:
1. WETH
2. USDT
3. USDC

Result:
Pay with = USDC on Polygon
Receive  = WETH on Polygon
State    = Linked
```

---

### Case C — External flow provides only Receive

Use the provided **Receive** pair.

Then choose **Pay with** in this order:

1. Highest-value user position on the same network as **Receive**
2. Highest-value user position on any network
3. Native asset on the **Receive** network, if the user has no balances at all

All candidates must form a different pair than **Receive**.

Example:

```text
External intent:
Receive = PEPE on Ethereum

User balance:
USDC on Polygon = $50

Result:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent
```

---

## User actions inside the form

### Action 1 — User selects a Pay-with asset

When the user selects a Pay-with asset, **Pay with** becomes that exact pair.

The Pay-with picker may start from **All**, so the selected asset may be on any network where the user has balance.

### In Linked state

**Receive** follows the selected Pay-with network.

**Receive** asset is selected from **Popular** on the new network.

Example:

```text
Before:
Pay with = USDT on Ethereum
Receive  = ETH on Ethereum
State    = Linked

User opens Pay-with picker:
Filter = All

User selects:
USDC on Polygon

Popular on Polygon:
1. USDC
2. WETH
3. USDT

After:
Pay with = USDC on Polygon
Receive  = WETH on Polygon
State    = Linked

Why:
The form is Linked, so Receive moves to Polygon.
USDC on Polygon is already Pay with, so Receive takes WETH.
```

---

### In Independent state

**Receive** does not move.

Example:

```text
Before:
Pay with = ETH on Ethereum
Receive  = USDT on Base
State    = Independent

User opens Pay-with picker:
Filter = All

User selects:
USDC on Polygon

After:
Pay with = USDC on Polygon
Receive  = USDT on Base
State    = Independent
```

---

### Action 2 — User changes Receive network

When the user changes **Receive** network:

```text
Receive network changes
Receive asset is selected from Popular on the new network
Pay with does not change
State becomes Independent
```

Example:

```text
Before:
Pay with = ETH on Ethereum
Receive  = USDT on Ethereum
State    = Linked

User changes Receive network to:
Base

Popular on Base:
1. USDC
2. USDT
3. ETH

After:
Pay with = ETH on Ethereum
Receive  = USDC on Base
State    = Independent
```

Important:

Do not preserve the old **Receive** asset by symbol.

This is wrong as a general rule:

```text
Old Receive = USDT on Ethereum
New Receive must be USDT on Base
```

Correct rule:

New **Receive** is selected from **Popular** on Base.

- If **Popular** on Base starts with USDC, **Receive** becomes USDC on Base.
- If **Popular** on Base starts with USDT, **Receive** becomes USDT on Base.

---

### Action 3 — User selects a Receive asset

When the user selects a specific **Receive** asset, **Receive** becomes that exact pair.

If the selected pair is on a different network, the form becomes **Independent** (same end state as Action 2 followed by an asset pick).

**Pay with** does not change.

Example:

```text
Before:
Pay with = ETH on Ethereum
Receive  = USDC on Base
State    = Independent

User selects Receive:
USDT on Base

After:
Pay with = ETH on Ethereum
Receive  = USDT on Base
State    = Independent
```

The exact Pay-with pair is hidden from the **Receive** picker list.

---

### Action 4 — User taps Flip

Flip swaps the two exact pairs.

```text
Before:
Pay with = A on Network 1
Receive  = B on Network 2

After:
Pay with = B on Network 2
Receive  = A on Network 1
```

Flip does not require the user to have balance in the new Pay-with asset.

If the user does not have enough balance in the new Pay-with asset, keep the flipped pair and show the normal insufficient-balance state.

### Flip example: same network

```text
Before:
Pay with = USDT on Ethereum
Receive  = PEPE on Ethereum
State    = Linked

User taps Flip.

After:
Pay with = PEPE on Ethereum
Receive  = USDT on Ethereum
State    = Linked
```

If the user has no PEPE balance:

- **Pay with** still becomes PEPE on Ethereum.
- The form shows insufficient balance when needed.
- Flip is not disabled.

### Flip example: cross-chain

```text
Before:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent

User taps Flip.

After:
Pay with = PEPE on Ethereum
Receive  = USDC on Polygon
State    = Independent
```

The form stays **Independent**.

---

### Flip and network state

Flip preserves the current network state.

```text
Linked before flip      → Linked after flip
Independent before flip → Independent after flip
```

Flip does not re-run **Popular** selection.

It swaps the selected pairs exactly.

---

### Action 5 — User switches wallet

When the active wallet changes, reset the form.

"Reset" means: discard derived state, then re-initialize from the remembered entry point. The entry point itself is preserved across wallet switches.

Discard the current form state:

```text
Pay-with selection
Receive selection
Linked / Independent state
manual Receive selection state
entered amount / quote state
```

Then reinitialize the form from the current entry point using the new wallet.

**Popular** itself does not depend on wallet, so cached **Popular** data can still be used if it is valid for the current **Receive** network.

**Wallet switch example: direct Swap**

```text
Before:
User opened Swap directly.
Wallet A is active.

Wallet A balances:
- USDT on Ethereum = $500

Current form:
Pay with = USDT on Ethereum
Receive  = WETH on Ethereum
State    = Linked

User switches to Wallet B.

Wallet B balances:
- USDC on Polygon = $200

After wallet switch:
Pay with = USDC on Polygon
Receive  = first Popular asset on Polygon, except USDC on Polygon
State    = Linked
```

**Wallet switch example: asset page**

```text
User opened Trade on:
PEPE on Ethereum

Wallet A balance:
USDC on Polygon = $50

Current form:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum
State    = Independent

User switches to Wallet B.

Wallet B balance:
USDT on Ethereum = $500

After wallet switch:
Pay with = USDT on Ethereum
Receive  = PEPE on Ethereum
State    = Linked

Why:
The entry point is still PEPE on Ethereum.
But the new wallet has spendable funds on Ethereum,
so the form reinitializes as same-network.
```

**Wallet switch example: external intent**

```text
External intent:
Pay with = USDC on Polygon
Receive  = PEPE on Ethereum

On wallet switch:
Keep the same external intent.
Recompute balances and validation for the new wallet.
State remains Independent because the external pairs are on different networks.

If the new wallet does not have USDC on Polygon, keep the pair and show insufficient balance when needed.
```

---

## Popular loading behavior

**Popular** is per network and wallet-independent.

The product requirement is:

When the form needs an automatic **Receive** default, **Popular** for that **Receive** network should be available or loaded.

Developers can choose whether this comes from cache, account data, or a separate backend request.

Outcome rules:

- Use **Popular** for the current **Receive** network.
- Do not use **Popular** from another network.
- Do not replace a user-selected **Receive** asset with a late **Popular** response.
- Do not replace an explicit **Receive** asset from an asset page, deeplink, copy-trade, or external intent.
- If **Receive** was empty only because **Popular** was not available yet, fill **Receive** when **Popular** becomes available.
- If **Receive** was automatically selected from old cached **Popular** and fresher **Popular** arrives for the same network, it may update only if the user has not selected **Receive** manually.

### Popular example: empty until loaded

```text
Initial:
Pay with = ETH on Ethereum
Receive network = Ethereum
Popular on Ethereum is not available
Receive = empty

Later:
Popular on Ethereum = [USDC, USDT]

After:
Receive = USDC on Ethereum
```

### Popular example: stale network response

```text
Initial:
Receive network = Ethereum
Popular for Ethereum is loading

User changes Receive network to Base.

Current:
Receive network = Base
State = Independent

Later:
Popular for Ethereum returns.

Result:
Do not apply it.
Receive stays on Base.
```

### Popular example: explicit Receive should not be overwritten

```text
User opens Trade on:
PEPE on Ethereum

Initial result:
Receive = PEPE on Ethereum

Later:
Popular on Ethereum returns:
1. USDC
2. USDT

Result:
Receive stays PEPE on Ethereum

Why:
PEPE was explicitly provided by the entry point.
Popular should not overwrite it.
```

---

## Highest-value position

When the spec says “highest-value position”, it means the user position with the highest USD value.

Example:

```text
User balances:
- USDT on Ethereum = $500
- WBTC on Ethereum = $200
- USDC on Polygon = $100

Highest-value position:
USDT on Ethereum
```

If USD value is unavailable for some assets, use backend/account ordering as the fallback.

The spec does not require the app to invent a local valuation order.

---

## Summary rules

### Direct Swap open

```text
Pay with = highest-value user position across all networks
Pay-with picker default filter = All
Receive network = Pay-with network
Receive = first Popular asset on that network, except the Pay-with pair
State = Linked
```

If user has no balances:

```text
Pay with = ETH on Ethereum
Receive = first Popular asset on Ethereum, if available
State = Linked
```

### Asset page open

If user holds the asset:

```text
Pay with = asset page pair
Receive = first Popular asset on the same network, except Pay with
State = Linked
```

If the user does not hold the asset:

```text
Receive = asset page pair
```

**Pay with** priority:

1. Highest-value position on **Receive** network
2. Highest-value position on any network
3. Native asset on **Receive** network if wallet is empty

State:

- **Linked** if **Pay with** and **Receive** are on the same network
- **Independent** if they are on different networks

### External intent

If both sides are provided:

- Use both exact pairs.
- State = **Linked** if same network, **Independent** if different networks.

If only **Pay with** is provided:

- Use **Pay with**.
- **Receive** = first **Popular** asset on the same network, except **Pay with**.
- State = **Linked**.

If only **Receive** is provided:

- Use **Receive**.
- Choose **Pay with** using the same priority as asset-page **Receive** case.
- State = **Linked** if same network, **Independent** if different networks.

### Pay-with picker

- Collapsed form shows selected asset + selected network icon.
- Bottom sheet opens with **All** selected.
- **All** shows the user’s spendable assets across all networks.
- Specific network filters show only networks where the user has spendable balance.

### Receive picker

- Shows receive-supported networks.
- Not limited by user balances.
- Default **Receive** comes from **Popular**.
- Exact Pay-with pair is not selectable.

### Linked state

- Pay-with network changes move **Receive** to the same network.
- **Receive** asset is selected from **Popular** on the new network.

### Independent state

- Pay-with and **Receive** networks live separately.
- Pay-with changes do not move **Receive**.
- **Receive** changes do not move **Pay with**.
- Once **Independent**, stays **Independent** until reset / reopen / wallet switch.

### Flip

- Swaps the two exact pairs.
- Does not require balance in the new Pay-with asset.
- Does not re-run **Popular**.
- Preserves **Linked** / **Independent** state.
- Shows insufficient balance if needed.

### Wallet switch

- Reset the form.
- Reinitialize from the current entry point using the new wallet.
- **Popular** is wallet-independent and can be reused if valid for the current network.

---

## Out of scope

This spec does not define:

```text
quote calculation
amount behavior
slippage
route selection
gas estimation
validation copy
Trending Tokens section
visual styling
```

It only defines:

```text
default Pay-with pair
default Receive pair
asset/network picker behavior
Linked vs Independent network behavior
Flip behavior
wallet-switch reset behavior
```
