---
name: solidity-security
description: >
  Audits a Solidity / EVM smart contract project for the vulnerability classes that appear most
  frequently in competitive audit contests: reentrancy, access-control gaps, oracle manipulation,
  precision loss, unchecked external calls, flash-loan attack surface, front-running, signature
  replay, proxy storage collisions, and dangerous token integrations. Self-contained — runs on the
  source code you already have, no external services. Activates when the user mentions a smart
  contract, Solidity, DeFi, EVM, audit, Foundry, Hardhat, reentrancy, or asks "is my contract safe?".
user-invokable: true
metadata:
  category: solidity-security
  version: "1.0.0"
---

# Solidity Security

Smart contracts have an unusual threat model: they hold real money, they are immutable once deployed,
and every line of code is public. The bugs that drain funds are not exotic — a 2023 study of
competitive audit contests showed the same ten vulnerability classes accounting for over 80 % of all
paid findings. This skill walks through those ten classes in order of how often they appear.

**Scope:** EVM-compatible Solidity. Rust/Vyper contracts share some patterns but have a different
checklist.

Freedom: **low** — run every check that applies to your contract type. Skip only what is
architecturally impossible (e.g. SOL-09 when there is no proxy).

## Rules

| ID | Check | If it fails |
|---|---|---|
| SOL-01 | Reentrancy: CEI pattern + guard on all external-call functions | P1 |
| SOL-02 | Access control: privileged functions behind onlyOwner/onlyRole; no tx.origin auth | P1 |
| SOL-03 | Oracle integrity: no spot DEX price as sole truth; flash-loan-resistant source used | P1 |
| SOL-04 | Arithmetic precision: division never before multiplication; unchecked blocks justified | P2 |
| SOL-05 | Return values: all low-level call() returns checked; SafeERC20 for token transfers | P1 |
| SOL-06 | Flash-loan surface: protocol invariants hold within a single transaction | P1 |
| SOL-07 | MEV / front-running: slippage bounds on all swaps; commit-reveal for order-sensitive ops | P2 |
| SOL-08 | Signature replay: EIP-712 + per-user nonce + chainId + deadline on every signed message | P1 |
| SOL-09 | Proxy safety: EIP-1967 storage slots; initialize() access-controlled; impl not left live | P1 |
| SOL-10 | Token integration: fee-on-transfer, rebase, pause, and blacklist tokens handled explicitly | P2 |

## When to Use This Skill

- User is about to deploy a smart contract or submit it to an audit.
- User mentions reentrancy, access control, Solidity, DeFi, EVM, Foundry, Hardhat, or OpenZeppelin.
- User asks "is my contract safe?" or "what should I check before auditing?"
- An automated audit found zero issues — this checklist catches what static analysis misses.

## The 15-minute starter (do this today, full checklist after)

Three checks that catch the majority of critical findings:

1. **Search for external calls** — grep for `.call(`, `.delegatecall(`, `transfer(`, `send(`. For
   every hit: does state change happen *after* the call? If not, that's SOL-01.
2. **List every function that moves money or changes ownership** — does each one have an explicit
   access modifier (`onlyOwner`, `onlyRole`, `require(msg.sender == ...)`)?  Missing one is SOL-02.
3. **Find every price read** — grep for `.getReserves`, `.slot0`, `.observe`, `.latestAnswer`. Is
   the source a spot DEX reserve? That is flash-loan-manipulable (SOL-03).

Even catching one of the three saves the contract.

## Checklist (full — in order)

### Reentrancy (SOL-01)

The pattern: a function sends ETH or calls an external contract *before* updating its own state.
The attacker's receive() or fallback() re-enters the same function while the state still shows
the old balance.

- [ ] Every function that calls an external contract or sends ETH follows
      **Checks → Effects → Interactions** (CEI): all `require` checks first, all state writes
      second, the external call last.
- [ ] `ReentrancyGuard` (or equivalent mutex) on every public/external function that includes an
      external call.
- [ ] **Cross-function and cross-contract reentrancy checked separately** — the guard on function A
      does not protect function B if B reads shared storage that A mutates after its external call.
- [ ] ERC-721/ERC-1155 `safeTransfer` callbacks checked — `onERC721Received` triggers between
      the transfer and any post-transfer state update.

### Access control (SOL-02)

- [ ] Every privileged function (`withdraw`, `pause`, `setFee`, `upgradeTo`, ownership transfer)
      has an explicit access modifier.
- [ ] No function uses `tx.origin` for authorization — it is bypassed by any contract in the call
      chain; use `msg.sender` instead.
- [ ] Role assignments are logged (emit events on `grantRole` / `revokeRole`).
- [ ] Ownership renouncement or transfer path verified — confirm `renounceOwnership()` cannot
      permanently lock funds.

### Oracle integrity (SOL-03)

Spot prices from AMM reserves (`getReserves`, `slot0`) can be moved in a single transaction with a
flash loan and snapped back after — the contract sees a manipulated price for its entire execution.

- [ ] No read of `getReserves` or `slot0` used as a live price without a TWAP window.
- [ ] Chainlink feeds used where available; staleness check on `latestRoundData` (`updatedAt` vs
      block.timestamp within an acceptable window).
- [ ] TWAP window long enough that manipulation cost exceeds potential profit (generally ≥ 30 min
      for large TVL; check against the specific AMM's liquidity depth).
- [ ] Fallback behavior on oracle failure is safe (revert or use a last-known-good price with a
      bounded age — never silently use 0 or a stale value).

### Arithmetic precision (SOL-04)

Solidity 0.8+ reverts on overflow/underflow by default, but precision loss and rounding errors are
still possible — and they compound.

- [ ] **Multiply before dividing.** `(a * b) / c` not `(a / c) * b` — integer division truncates
      and the truncation error multiplies.
- [ ] Every `unchecked` block has a comment explaining why overflow is impossible at that point.
- [ ] Decimal mismatches between tokens identified (USDC = 6 decimals, WETH = 18). Scale before
      comparison.
- [ ] Rounding direction is intentional: protocol fees round up (protocol earns); user withdrawals
      round down (protocol stays solvent).

### Return values (SOL-05)

A low-level `.call()` in Solidity never reverts on failure — it returns `(bool success, bytes data)`.
Ignoring `success` means failed transfers are silently swallowed.

- [ ] Every `.call(...)` return value assigned and checked — `(bool ok, ) = addr.call(...); require(ok)`.
- [ ] `SafeERC20.safeTransfer` / `safeTransferFrom` used instead of raw `IERC20.transfer` (some
      tokens return false instead of reverting on failure; `SafeERC20` reverts for you).
- [ ] No assumption that `.send()` or `.transfer()` will always succeed on the recipient side.

### Flash-loan surface (SOL-06)

Flash loans let an attacker borrow any amount of a token for a single transaction at zero cost
(as long as they return it by the end). Any state-dependent logic based on token balances or prices
is in scope.

- [ ] Identify every invariant the protocol must hold (solvency, accounting, ownership). Check that
      each holds at the *end* of any single transaction, not just at the start.
- [ ] No function trusts `token.balanceOf(address(this))` as a deposit record — an attacker can
      inflate it without a proper deposit; track deposits with an internal variable.
- [ ] Callback functions (e.g. `uniswapV2Call`, `onFlashLoan`) verify the caller is the expected
      pool address and that the initiator is the contract itself.

### MEV / front-running (SOL-07)

Transactions sit in the public mempool before they are mined. Attackers (or MEV bots) can see them
and insert their own transactions before or around yours.

- [ ] Every swap or price-sensitive function takes an explicit `minAmountOut` or `maxAmountIn`
      parameter and reverts if it is not met — no open-ended slippage.
- [ ] Deadline parameter on time-sensitive operations (a transaction delayed by hours should revert,
      not execute at a stale price).
- [ ] Commit-reveal scheme or private mempool (e.g. Flashbots) for operations where order matters
      (auctions, lotteries, NFT mints with on-chain randomness).

### Signature replay (SOL-08)

A valid signed message reused in a different context — different chain, different contract, or the
same user's second transaction — is signature replay.

- [ ] All permit-style or meta-transaction signatures use **EIP-712 structured data** (not raw hash).
- [ ] Domain separator includes `chainId` and `address(this)` — prevents cross-chain and
      cross-contract replay.
- [ ] Per-address nonce incremented and checked before processing any signature.
- [ ] Expiry / deadline field in the signed struct; reject signatures past it.

### Proxy safety (SOL-09)

Upgradeable proxies store the implementation address in a storage slot. If that slot collides with a
variable in the implementation, an upgrade can corrupt state silently.

- [ ] Proxy uses **EIP-1967 storage slots** (`0x360894a13ba1a3210667c828492db98dca3e2076936...`
      for the implementation, `0xb53127684a568b3173ae13b9f8a6016e243e63b6...` for the admin).
- [ ] `initialize()` (the proxy-compatible constructor) is protected — can only be called once,
      ideally inside the deployment transaction.
- [ ] Implementation contract itself cannot be called directly by an attacker (self-destruct risk
      for UUPS before EIP-6780; check if `_disableInitializers()` is called in the impl constructor).
- [ ] No selfdestruct in the implementation of a UUPS proxy (it would destroy the logic for all
      proxies pointing to it).

### Token integration (SOL-10)

ERC-20 is a standard, but not all tokens follow it the same way.

- [ ] **Fee-on-transfer tokens** (e.g. USDT in some modes, many DeFi tokens): if the protocol
      accepts arbitrary ERC-20s, record the balance *before* and *after* transfer and use the
      delta, not the input amount.
- [ ] **Rebase tokens** (e.g. stETH, aTokens): balances change autonomously. Never assume
      `balanceOf` equals what was deposited.
- [ ] **Pausable / blacklistable tokens** (e.g. USDC, USDT): a transfer can silently fail or revert
      if the recipient is blacklisted. Ensure the protocol does not get permanently locked waiting
      for a transfer that will never succeed.
- [ ] **ERC-777 callback hooks**: a token implementing ERC-777 triggers a hook on the sender before
      the state update — functionally equivalent to reentrancy. Treat as SOL-01 applies.

## Fix playbook

```solidity
// SOL-01 — CEI pattern + guard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function withdraw(uint256 amount) external nonReentrant {
        // Checks
        require(balances[msg.sender] >= amount, "insufficient");
        // Effects
        balances[msg.sender] -= amount;
        // Interactions (last)
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }
}
```

```solidity
// SOL-03 — Chainlink with staleness check
(, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();
require(block.timestamp - updatedAt <= 1 hours, "stale oracle");
require(price > 0, "invalid price");
```

```solidity
// SOL-05 — SafeERC20
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;

token.safeTransfer(recipient, amount);       // reverts on false-return tokens
token.safeTransferFrom(from, to, amount);
```

```solidity
// SOL-08 — EIP-712 with nonce + deadline
bytes32 public DOMAIN_SEPARATOR;
mapping(address => uint256) public nonces;

bytes32 constant PERMIT_TYPEHASH = keccak256(
    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
);

function permit(address owner, address spender, uint256 value,
                uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
    require(block.timestamp <= deadline, "expired");
    bytes32 digest = keccak256(abi.encodePacked(
        "\x19\x01", DOMAIN_SEPARATOR,
        keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
    ));
    address signer = ecrecover(digest, v, r, s);
    require(signer == owner, "invalid signature");
    _approve(owner, spender, value);
}
```

```solidity
// SOL-10 — fee-on-transfer safe deposit
function deposit(IERC20 token, uint256 amount) external {
    uint256 before = token.balanceOf(address(this));
    token.safeTransferFrom(msg.sender, address(this), amount);
    uint256 received = token.balanceOf(address(this)) - before; // actual amount
    balances[msg.sender] += received;                           // not `amount`
}
```

## Examples

**A Solidity vulnerability that static analysis often misses (SOL-01 cross-function):**

```solidity
// VULNERABLE — guard on withdraw does not protect claim
contract Rewards is ReentrancyGuard {
    mapping(address => uint256) pending;

    function withdraw() external nonReentrant {
        uint256 amt = pending[msg.sender];
        pending[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok);
    }

    function claim() external {  // no guard — attacker re-enters here during withdraw's call
        pending[msg.sender] += computeReward();
    }
}
```

Fix: add `nonReentrant` to `claim()` as well, or reset `pending` before the external call in
`withdraw()` and after the external call re-add nothing.

## Do / Don't

| Do | Don't |
|---|---|
| Follow CEI in every function that touches external contracts | Write state changes after `.call()` |
| Use `onlyOwner` / `onlyRole` on every admin function | Rely on `tx.origin` for authentication |
| Use a TWAP or Chainlink feed for prices | Read spot AMM reserves as live price |
| Multiply before dividing | Divide first and then scale up |
| Use `SafeERC20.safeTransfer` | Call `token.transfer()` and ignore the return value |
| Add `minAmountOut` + deadline to every swap | Leave slippage open-ended |
| Use EIP-712 + nonce + chainId in every signature | Hash raw data without domain separator |
| Use EIP-1967 slots in upgradeable contracts | Let implementation variables collide with proxy slots |
| Record balance delta for deposits (fee-on-transfer safe) | Trust the `amount` parameter as what was received |
| Write Foundry fuzz tests for arithmetic and invariants | Rely on human review for precision-loss bugs |

---

<sub>(c) 2026 hossein-webdev - https://github.com/hossein-webdev/vibe-check - Licensed CC BY-NC-SA 4.0: attribution required, non-commercial, share-alike.</sub>
