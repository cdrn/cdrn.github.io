---
title: "The bridge is not the product"
description: Or why value accrues to orderflow
date: 2025-12-30
tags: [thonk, crypto, bridges, orderflow]
---

## 1. Bridges are Commoditised Infrastructure

Cross-chain bridges are infrastructure, not products. The real value, and moat, has little to do with the bridge protocol itself. The utility of the bridge is entirely downstream of the orderflow that crosses it.

This might seem obvious in retrospect, but the bridge-as-product narrative dominated the last cycle. Billions poured into bridge protocols with the assumption that being the pipe between chains was inherently valuable. More chains means more fragmentation means more bridge volume means value accrual to bridge tokens.

That's not how it played out.

A bridge protocol is just a mechanism for verifying state across chains. Whether it's using multisigs, optimistic verification, or ZK proofs, the core function is the same: enable assets to move from chain A to chain B with some security guarantee.

This trends toward commoditisation. There is no moat in being a bridge. Any sufficiently motivated team can build one, and many did. The barrier to entry isn't (and wasn't) the technical challenge of cross-chain messaging - it's bootstrapping liquidity and trust. But even that advantage is temporary.

When you build a bridge, you're building infrastructure. The bridge operator collects tolls, but the real value accrues to the businesses on either side that couldn't exist without the connection.

## 2. So, Who is the Product?

The valuable thing isn't the bridge. It's the orderflow that uses it.

Orderflow is the raw material of any exchange system. It's the stream of user intent - people wanting to swap A for B, move assets from X to Y. Whoever controls this orderflow controls the value.

This pattern plays out everywhere. In TradFi, Robinhood doesn't execute trades - Citadel does. But Robinhood owns the user relationship and sells the order flow via payment for order flow (PFOF), capturing margin while Citadel spends billions on execution infrastructure to stay competitive. The orderflow owner has the structurally easier business.

The same dynamic exists in crypto. MetaMask Swap routes to DEXs but extracts 0.875% for controlling the user relationship. The DEXs provide liquidity, MetaMask captures the margin. LiFi and Jumper aggregate bridges without operating any, capturing users while bridges compete for volume underneath. 1inch built a $700M+(!) business routing through Uniswap's liquidity pools.

The pattern is consistent: if you control the orderflow, you can route it to whatever venue offers the best economics, auction it to solvers and market makers, extract MEV, and build moats through UX and integrations. And as the distinction between venue and maker collapses, with intent-based systems and JIT liquidity, the solver IS the market maker IS the execution venue, the bridge becomes just one more implementation detail underneath.

So what does the modern bridge operator do? They process whatever volume arrives and compete on fees with every other bridge. Switching costs are near zero. Aggregators route around you the moment someone's cheaper. The spread is controlled by market makers anyway. You're toll infrastructure on someone else's highway.

## 3. Advancing Beyond the Toll Booth

So if orderflow is the product, how do you capture it?

The answer is intent-based architecture. The user expresses intent, not instructions. They don't say "swap on Uniswap, bridge via Hop, exit on Arbitrum" they say "I want USDC on Base for my ETH." The system figures out the path, which means the system controls routing.

Taker broadcasts what they want, makers compete to fill it. The protocol coordinates quotes and settles fills. Makers compete on the fill, not the venue, the taker doesn't pick a DEX or a bridge, they pick a price. Everything underneath is abstracted into the maker's problem. The bridge becomes a detail, just another implementation choice.

This is already happening. CoWSwap, 1inch Fusion, UniswapX. All are moving toward intent-based models where solvers bid on orderflow and route it through whatever infra is cheapest. The bridge is abstracted away. Nobody cares which bridge their swap touched.

The winning position isn't "best bridge." It's "the place where orderflow shows up and makers compete to fill it." The settlement layer is necessary but commoditised. The coordination layer is the moat.

## 4. Compliant Orderflow is Premium Orderflow

Here's the turn most people are missing: not all orderflow is equal.

A maker who knows the counterparty address before quoting can price risk. OFAC-listed wallet? No quote. Fresh address with no history? Wider spread. Known institutional wallet with clean provenance? Tight spread, happy to fill.

This is impossible on an AMM. The pool doesn't know who's swapping. But intent-based systems expose the counterparty at quote time. Makers can screen. Compliance happens at the quote layer, not the protocol layer.

Why does this matter? The compliance-pilled segment of the market is growing. Institutions, OTC desks, people who can't touch THORChain because their compliance team would have an aneurysm. Right now they're stuck with CEXs for cross-chain. They'd rather not be. After all, the CEX is a toll booth with a highway attached.

Screened orderflow is worth more than unscreened orderflow. A maker willing to fill a clean address will quote tighter than a maker pricing in "this might be Lazarus" risk. The spread difference is the compliance premium, and it flows to whoever can offer the screening.

## 5. Where This Goes

The bridge wars are over and everybody lost. The value leaked to aggregators, solvers, and whoever owned the user relationship. The next cycle is about intent-based systems fighting over orderflow capture.

The interesting question is whether compliance becomes a differentiator. Most of DeFi is racing toward maximum permissionlessness. But there's a segment, maybe small now, probably growing, that wants cross-chain without the compliance risk. As more institutions come on-chain and regulatory pressure increases, the premium for screened orderflow only grows.

From my view, building for that segment means: intent-based architecture, makers who screen counterparties, compliance priced into the spread not blocked at the gate. The bridge underneath is just plumbing.

The bridge is not the product. The orderflow is. And compliant orderflow might be the premium product.
