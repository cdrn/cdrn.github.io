---
title: "On the speed of law versus the speed of blocks"
description: Freeze functions, fast exits, and the limits of on-chain compliance
date: 2025-12-27
tags: [crypto, stablecoins, regulation]
---

# On the speed of law versus the speed of blocks

## 1. A short history of blacklist()

Since the beginning, stablecoins have shipped with [freeze](https://etherscan.io/address/0x43506849d7c04f9138d1a2050bbf3a0c054402dd#code#F15#L71), [blacklist](https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code#L269) functions. And it makes sense - centralised stablecoin issuers, exposed to US treasuries and ostensibly operating a privately issued US dollar need to have some compliance story - and the blacklist gets used. [Tether has frozen $3.3B](https://crypto.news/tether-freezes-30x-more-value-than-circle-as-stablecoin-blacklists-surge/) since 2023, working with 275 law enforcement agencies across 59 jurisdictions. Circle has been surprisingly more conservative - $109M, court orders only. There is a real capability that exists today.

The GENIUS act [codifies](https://www.banking.senate.gov/newsroom/majority/myth-vs-fact-the-genius-act) this: issuers must have "technological capability to comply with any lawful order to freeze funds". What was a nod is now a mandate, but mandating a capability doesn't necessarily make it fast.

## 2. The race to broadcast

A swap on Thorchain settles in under a minute. Uniswap is one block, which is 12 seconds on Ethereum mainnet and soon to be 6. The attacker's workflow is: receive funds, approve, swap, done. The future blacklistee is  holding native BTC or ETH which no blacklist function in the world can touch (That's the point!). Hackers and bad actors are constrained only by how quickly they can dump funds into liquid pools, and whether there are sufficient willing, able or ignorant marketmakers to replenish them. For small denominations, this is almost meaningless and there is sufficient liquidity in pools to cover substantial amounts of the hacked funds in the next block.

The issuer side is a different story. Tether runs a multisig. This means the issuer is forced to play an awkward co-ordination game for every action. One needs multiple signers to coordinate, sign, broadcast for every blacklist action. Amlbot [clocked their average observed latency](https://blog.amlbot.com/tether-freeze-gap-becomes-laundering-loophole-for-criminals-an-analytical-report/) at 44 minutes from freeze decision to on-chain enforcement. During that window, $78mm walked out of addresses that had been publicly flagged. The blacklist transaction was still pending. One can imagine this arms race escalating with faster signing (threshold signatures), improved governance procedures, a contract that makes blacklisting simpler and requires fewer quorum. However, one can also imagine Lazarus bribing a block builder for top of block to get their transfers in before blacklist function calls. Are issuers now required to have sophisticated MEV capabilities? We can move the problem around the plate, but it appears, not solve it.

The law imagines freeze like a bank: point at account, flip a bit, funds stop, but a bank ledger is a single database with atomic writes. on-chain you're broadcasting a tx that has to confirm, and the attacker is broadcasting theirs at the same time. It's a race. and 12 seconds vs 44 minutes isn't a race.

## 3. The scoreboard today

Here's the standing tally

Bybit, February 2025: [Lazarus Group takes $1.5B](https://www.bleepingcomputer.com/news/security/fbi-confirms-lazarus-hackers-were-behind-15b-bybit-crypto-heist/) in ETH and staking derivatives. They don't touch USDC. Within 48 hours, $160M has been converted to native BTC via THORChain. Within 10 days, the entire haul - all $1.4B - has been [swapped and distributed](https://beincrypto.com/lazarus-laundered-bybit-hack-funds-via-thorchain/) across 6,954 wallets. THORChain processes $5.5B in volume during the laundering window. Chainflip handles some of the flow too. A THORChain core developer [resigns in protest](https://cointelegraph.com/news/timeline-bybit-lost-ethereum-north-korea-money-launder). Validators attempt to block the transactions and get overruled by the protocol's governance.

Tether [freezes $181k](https://www.ccn.com/education/crypto/ben-zhou-bybit-1-5-billion-hack-explained/). That's 0.012% of the stolen funds.

The attackers understood the asset model. They never held freezable assets for longer than it took to swap out of them. The blacklist function was irrelevant - not because it didn't work, but because they routed around it entirely.

Multichain, July 2023: An attacker, possibly an insider, [drains $126M](https://www.chainalysis.com/blog/multichain-exploit-july-2023/) from the bridge protocol. Around $65M is USDC and USDT. And then... nothing. No swaps. No bridges. The funds sit in the exploit addresses. Within 24 hours, Circle and Tether freeze $67.5M - over half the total haul. That money is still frozen. A New York bankruptcy court [extended the freeze order](https://www.theblock.co/post/377094/multichain-extends-freeze-stolen-usdc) in October 2025.

Same capability. Wildly different outcomes. The difference isn't the freeze function. It's attacker competence.

Bybit was a state-sponsored operation that understood exactly how to exit freezable rails. Multichain was either an insider who thought they could negotiate, or someone who didn't understand what they were holding. The blacklist caught the second one. It didn't touch the first.

So what is this for? $3.3B frozen sounds impressive until you realise it's mostly people who didn't know they were holding a traceable asset. The Lazarus playbook isn't secret anymore either, it's on-chain for anyone to read. More than that, it has entered the canon in a somewhat mythical status. The next attacker is very unlikely to be unaware, and so unlikely to sit still.

## 4. The building with no walls

`blacklist()` regulates stablecoins. Stablecoins exist in an ecosystem of permissionless swaps, bridges, and liquidity pools. You can lock a door, but it's useless if the building has no walls.

Most credibly decentralised protocols (THORChain) don't have a blacklist function by design - and frankly, definition. It, and other related protocols are decentralised clearinghouses for swapping on chain assets. The protocol doesn't custody funds, doesn't have an issuer, doesn't have a compliance team. It just matches swaps. Chainflip is the same architecture. Garden, similar again (if we take liberties with the underlying settlement mechanism). The fundamental conceit of any non-custodial decentralised exchange is that it exists somewhere closer to "permissionless" than "permissioned" on the gradient, either in actuality, or as regulatory arbitrage, otherwise, why not just be a centralised exchange?

This is very obviously the point of DeFi. Permissionless means permissionless. If it doesn't, then this sets an awkward legal precedent. Lazarus' pragmatic use of existing cross chain rails was not a loophole, but infrastructure operating as it was intended.

The uncomfortable question for anyone building this infrastructure: what happens when regulators figure out that the game isn't asset control, but flow control?

## 5. The impossible position

THORChain validators found out in real time. During the Bybit laundering, three validators voted to halt transactions linked to Lazarus addresses. They were overruled within minutes - the protocol's governance didn't support intervention. A core developer quit publicly. The community split between "we have to do something" and "if we can do something, we're not decentralised." This is the core issue. If your protocol can block transactions on demand, you're a permissioned system with extra steps and you've just volunteered for the same compliance obligations as Coinbase. If you can't, you're the exit route for state-sponsored money laundering, and eventually someone in Washington notices.

The precedent set by Tornado Cash tips the scales toward direct action. OFAC sanctioned the smart contracts directly in 2022. Not an issuer or company, but the code itself. A developer went to prison. The legal theory was novel and contested, but the effect was immediate: touch this infrastructure and you're exposed. It's hard to understate the ripples this sent through the developer community. For years, privacy was solely the domain of the cracked, crazy or both.

It seems very obvious that once the freeze-at-issuer theatre becomes too inconvenient to ignore, attention shifts to the permissionless rails that facilitate the movement. Any cross chain venue with liquidity and no KYC becomes an obvious place to stop the bleeding. Resultantly, anyone building in this space has to pick a position - either permissionless enough to be useful to Lazarus, or permissioned enough to be compliant.

## 6. Where this goes

So is the GENIUS Act freeze mandate useless? Not entirely. It catches static funds, dumb attackers, people who don't understand the asset they're holding. $3.3B frozen is a substantial amount of money, even if it's mostly the bottom of the competence distribution. But as a regime for stopping sophisticated actors - state-sponsored or otherwise - it's mostly theatre. The law mandates a capability that structurally cannot do what is asked of it.

From here the enforcement surface will likely shift. Validator and node operator sanctions, frontend takedowns, pressure on wallets to drop integration with non-compliant venues. The "travel rule for DeFi" discourse is already warming up in FATF working groups. The first attempts are likely to be clumsy (much like the GENIUS act) but substantive. Eventually, they will improve.

Beyond this, "compliant cross-chain" might not be coherent under AMM architecture. The pool doesn't know who's swapping. There's no hook to reject a specific taker. You could bake a blacklist into the contract, but now you've added a centralised dependency, an attack surface, and latency to every swap. It's possible. It's also ugly, and it defeats much of the point.

Intent based systems have the capability to be different. The maker sees the counterparty before filling. They can screen, price the risk, or walk away. The protocol stays neutral. The compliance decision moves to the entity with something to lose and the risk gets priced into the spread rather than blocked at the gate. In this way it might be possible to have both. An explosion of issuer-specific stablecoins is coming. For payments to work, they need to interoperate. The first group to do this correctly (on neutral ground) stands to take the whole pie, but the devil is in the details. The immutable parts must be immutable, and the makers responsible for their own fills. I will expand on this in a later post. For now: freeze catches what sits still. It's a dragnet for the left end of the bell curve. Everything else is in motion.

