---
title: "The bridge is not the product"
description: Or why value accrues to orderflow
date: 2025-11-15
tags: [thonk, crypto, bridges, orderflow]
draft: true
---

Cross-chain bridges are infrastructure, not products. The real value doesn't accrue to the bridge protocol itself—it flows to whoever controls the orderflow that crosses it.

This might seem obvious in retrospect, but the bridge-as-product narrative dominated the last cycle. Billions poured into bridge protocols with the assumption that being the pipe between chains was inherently valuable. The thinking went: more chains means more fragmentation means more bridge volume means value accrual to bridge tokens.

But that's not how it played out.

## Bridges are commoditized infrastructure

A bridge protocol is just a mechanism for verifying state across chains. Whether it's using multisigs, optimistic verification, or ZK proofs, the core function is the same: enable assets to move from chain A to chain B with some security guarantee.

The problem is that this is infrastructure that trends toward commoditization. There's no moat in being a bridge. Any sufficiently motivated team can build one, and many did. The barrier to entry isn't the technical challenge of cross-chain messaging—it's bootstrapping liquidity and trust. But even that advantage is temporary.

When you build a bridge, you're building a highway. Highways are valuable to society, but the highway operator isn't usually capturing most of the value. The value accrues to the businesses built on top of the connectivity the highway enables.

## Orderflow is the product

The valuable thing isn't the bridge. It's the orderflow that uses it.

Orderflow is the raw material of any exchange system. It's the stream of user intent—people wanting to swap A for B, move assets from X to Y. Whoever controls this orderflow controls the value.

This is why aggregators and routers became more valuable than individual DEXs. This is why payment processors extract more value than payment rails. And this is why cross-chain aggregators and intent-based systems are more interesting than bridge protocols.

If you control the orderflow, you can:
- Route it to wherever gives you the best economics
- Auction it to solvers and market makers
- Extract MEV from it
- Build moats around it through UX and integrations

The bridge operator? They just process whatever volume comes their way and compete on fees with every other bridge.

## Where this breaks down

There are edge cases where bridge protocols can capture value:
- **Native bridges for new chains**: If you're launching a new L2, your canonical bridge is effectively part of your chain's infrastructure stack. Value accrues to the chain, not the bridge specifically.
- **Vertically integrated systems**: If you own the bridge, the router, and the user acquisition channels, you can capture more of the stack. But at that point, you're not really a bridge protocol—you're a cross-chain application.
- **Extremely differentiated security models**: If your bridge offers meaningfully better security than alternatives and users care enough to pay a premium for it, there's potential value capture. But this is rare and erodes over time as others copy your approach.

## The lesson

If you're building in the cross-chain space, don't build a bridge and hope volume shows up. Build something that controls orderflow and use bridges as infrastructure.

The bridge is not the product. The orderflow is.
