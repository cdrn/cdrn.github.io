---
title: "A tick shaped honeypot"
description: A Uniswap V3 honeypot that leaves the ERC20 contract completely untouched.
date: 2026-05-18
tags: [thonk, mev]
---

## The setup

Felt like dipping my toes back into MEV this weekend. I don't have the connections with block builders to tackle the greats, so I spun up some infra to watch contract deploys across eth, arb, base, to get a feel for the current meta.

Ended up looking at arbitrageur and sniper bots, trying to imitate their strategies on Base. Centralised sequencer and volume seemed ideal. Ran the scanner for about 36 hours.

No fat 5bip arbs. Which makes sense.

What I did find was honeypots. Hundreds of them. And not your grandpa's salmonella honeypots either.

## A trap so deranged

There exists a trap so deranged, so unhinged I hesitate to even post about it. But I will. Because I'm brave. And the best part is it leaves the `_transfer` function completely unmodified.

The trick is in Uniswap V3's tick-based liquidity.

We set up a V3 pool whose current tick is at `n`. We provide liquidity at `[n+200, upper_bound]`, single-sided, all token, zero WETH. The current tick is below our range, so the position holds 100% token by definition.

A buy (victim) moves the tick up. It fast-forwards through the empty 200-tick gap (no liquidity, no cost), enters our range, and starts trading against our tokens. WETH accumulates in the pool. Buyer walks away with tokens, thinking they got in early.

A sell moves the tick down. There is no initialised tick below the current one. The swap has nothing to trade against and reverts. Tokens are now unsellable on this pool. No liquidity at the current tick.

We own the LP NFT. When we want out, we call `decreaseLiquidity` + `collect` on the position manager. We get our remaining tokens back plus all the WETH buyers paid in. On-chain it looks like a normal LP exit.

## Why this works

Bots that make money run real sims. Bots that don't read selectors and assume V2 mechanics fall for it. The honeypots, I believe, are priced for the second group.

## Receipts

If you want to inspect one yourself:

- Pool: [0xA3c1...c4Bf](https://basescan.org/address/0xA3c1ee252A9A6A999fE79Bc3E75D71FFF586c4Bf)
- Operator: [0x9150...9804](https://basescan.org/address/0x91508018F75F93AF3C8C7C501757f1Db57f19804)
- Mint tx: [0x31cc55cb...](https://basescan.org/tx/0x31cc55cbceab450f)
- NPM holding the LP NFT: [0x03a5...34f1](https://basescan.org/address/0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1)

Stay safe out there. Sim your doompas. Don't get caught.
