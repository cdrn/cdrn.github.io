---
title: Gauloi v2
preview: /img/placeholder.png
tech: Solidity, Foundry, EIP-712, Next.js, TypeScript
tags: projects
links:
  - text: GitHub
    url: https://github.com/cdrn/gauloi-v2
  - text: App
    url: https://gauloi-v2-app.vercel.app
  - text: Blog post
    url: /blog/gauloi/
---

A spiritual successor to the original Gauloi. Intent-based cross-chain stablecoin settlement — takers sign EIP-712 orders off-chain (zero gas), makers fill on the destination chain and prove delivery to unlock escrowed funds. Disputes use M/N attestation from the staked maker set, same security model as optimistic rollups. Makers handle their own compliance and compete on spread via off-chain RFQ. Deployed to Sepolia and Arbitrum Sepolia testnets.
