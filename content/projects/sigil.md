---
title: Sigil
byline: Claude can sign, but never see. MCP for managing crypto keys.
preview: /img/placeholder.png
tech: TypeScript, MCP, XChaCha20-Poly1305, Argon2id
tags: projects
links:
  - text: GitHub
    url: https://github.com/cdrn/sigil
  - text: npm
    url: https://www.npmjs.com/package/sigild
---

A local signing tool and Claude Code MCP integration. Claude (or any LLM agent) can request signatures for Ethereum transactions, EIP-191 personal messages, or EIP-712 typed data, but never sees the key material, only opaque handles like `eth:executor`. Keys are encrypted at rest with XChaCha20-Poly1305 + Argon2id, held in process memory only after explicit unlock from a separate terminal, and zeroized on shutdown. A policy engine bounds what each key can sign (chain ID, destination allowlist, per-tx value cap, function-selector allowlist).

Born out of wanting to delegate on-chain work to agentic tooling without handing them my keys.
