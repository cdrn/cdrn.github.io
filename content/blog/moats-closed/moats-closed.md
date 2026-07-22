---
title: "Moat's closed"
description: If you're brave enough, everything's a polymarket
date: 2026-07-19
tags:
  - thonk
  - stablecoins
---
## Expressed vs. revealed preference

Almost everyone in this industry has a stated view about where value is going, and almost no one's balance sheet agrees with their mouth. We all know someone who professes daily that the tech is the whole game, yet spends every dollar they raise on distribution. This isn't a new observation. In fact, it might be one of the few reliably replicable findings in economics. People systematically overstate what they'd pay for things when the statement costs them nothing. Or, in other words _talk is cheap_. And when chat is free and chatting has upside (misdirecting your competitors, farming exit liquidity), the stable equilibrium of chat trends toward _chatting shit_.

What is actually enduringly expensive is _choice_. A stated opinion is free, so it's generally worth about what you paid for it. Allocations have prices, and if you believe the fundamental conceit of prediction markets, this forces a degree of honesty (or, for home gamers, DSIC[^dsic]). So, if we'd like to intuit what people actually believe, it follows that we should look at their bets - not their chat.

The trouble here is that individual utility functions are extremely difficult to measure. How do we price in the cost of precarity? How do we price in loss aversion bias? People are complex in ways that are difficult to model, and some of the best examples are even motivated by utility functions other than profit. Conveniently, these are issues that corporations (and indeed, many institutions) are conspicuously, relatively free of!

## Reading the T(bill) leaves

Institutions are the cleanest subjects revealed preference ever gets. Their constraints are disclosed in filings. Their allocation decisions are made deliberately, repeatedly, by committees whose entire job is to bet the balance sheet on a view of the future. They are incentive-compatible at billion-dollar scale, and many institutions' positions are enormous and a matter of public record.

Which means we can do something very fun: treat the corporate landscape as a prediction market. We will be ignoring the keynotes, well known to be the mouth (and an unreliable narrator). Instead, we'll focus on capex, the acquisitions, the charters applied for, and the balance sheet composition. Every one of these is a position, sized in billions and marked to market. And if there's one set of institutions I feel qualified to read, it's the moneyers.

So! let's read the book.

First off, let's talk about **the charter stampede.** Eleven companies filed for or received OCC national trust bank charters in 83 days: Circle, Ripple, Paxos, Fidelity, Bridge, Morgan Stanley among them, with Coinbase pending behind[^charters]. A charter is expensive and irreversible: capital requirements, examinations, a permanent leash of OCC supervision. Eleven firms deciding the leash is worth wearing are eleven firms telling you the settlement tech is a solved problem, and that _permission_ is the thing worth paying for.

Certainly the timing is supply-side. The GENIUS Act created the regime[^genius], a friendly OCC opened the door, a queue formed. But supply explains the timing, not the willingness to pay. Filing early is a bet that the window closes and early standing matters. The bank lobby reportedly weighing litigation to shut the door is its own revealed preference[^lobby]. You don't sue to stop people acquiring something worthless.

**The incumbents' counter.** JPMorgan, Citi, BofA, Wells Fargo and a dozen peers announced a shared tokenised deposit network via The Clearing House, targeting 2027[^tch], to defend against deposit flight from US banks that Standard Chartered sized at up to $500 billion by 2028[^stanchart]. The entire position fits in one sentence: a tokenised deposit never leaves the bank's balance sheet. Same "cryptography" as a stablecoin, opposite answer to who holds the money while it moves. This is the incumbent playing its two real assets, the licenses and the depositors: we'll adopt your rails and keep our seat. One of its own architects admitted clients aren't "beating down the door"[^door], which tells you how much of this is conviction and how much is insurance. But insurance is a position too.

**The commons.** Meanwhile the open rails continue to accrete value at pace. Stablecoin supply doubled in two years to ~$320 billion[^supply], settlement volume hit $33 trillion in 2025, past Visa's annual throughput[^volume]. Cross-chain movement went from the industry's recurring catastrophe to boring plumbing, which is what winning looks like for a commons. If the tech were the moat, this is the group that would be running away with it, because the tech is theirs and it's free.

And there are some big tells here. We can watch the flagships of the "commons" and what they do with their winnings. Circle, whose entire existence is open, compounding, permissionless dollars, is building Arc: its own L1, with USDC as native gas, partners including BlackRock and Visa[^arc]. Tether, which got big on other people's chains, is behind Plasma: an L1 built around USDT, with zero-fee transfers and gas payable in the stablecoin itself[^plasma]. The two biggest issuers on the open rails are both building their own. Nobody who wins on open rails wants to stay on them.

The key here being that nobody _wants_ to. Whether anyone _can_ leave and retain their business is a different question. Massive companies have never struggled to coordinate, when coordinating is mutually beneficial. The Clearing House has been settling accounts between competitor banks since 1853. SWIFT is a cooperative, Visa was born as one - a bank consortium that only IPO'd in 2008. If a coalition of giants could solve this, they'd have solved it decades ago. What the consortium has never once solved is coordination _beyond_ the club: getting your competitors, your members' competitors, and strangers with no seat at the table to commit real capital to rails you control. Facebook Diem had the best distribution on earth and died on exactly this rock, because everyone could see whose network it was (and no-one trusted it not to cannibalise their other business).

That problem is what credible neutrality solves. USDC settled $33 trillion because it ran on rails that, nominally, nobody owned, so an exchange, a market maker, or a rival issuer could build on top of it without trusting Circle any further than they already did by holding the coin. Neutrality reads as ideology to chain natives, but for these transactions it's load-bearing. Which makes Arc, Plasma and the rest of [the house-chain wave](/blog/company-scrip/)[^stablechains] strange positions: Circle is asking the ecosystem to do for it what the world refused to do for Facebook. Its distribution may be big enough by now to cover the neutrality it's spending - but attempts have run dry before.

## The code was never the moat

Put the positions side by side and they nearly all say the same thing, which is the opposite of what the industry says about itself. The code is commoditised, settlement is a solved problem, the source is open, the volumes are enormous and the marginal cost is approaching zero. But "the tech", here at least, was always two things: the code, which became free, and the credible neutrality of the rails, which didn't, because you can't fork it. Copy Ethereum's code and you get a (somewhat shitty) chain. You don't get ten years of nobody owning it. The moats left standing are permission, distribution, and - the one nobody is ready to talk about - **neutrality**. Only the first two are for sale.

So the book is split. The crypto-natives are buying permission with charters, while the banks are defending distribution with commoditised consortiums, hoping it will be enough. Circle is spending its neutrality to buy control, betting its distribution covers the difference. Against all of that, $33 trillion a year still settles on rails nobody owns. Commoditising the code didn't democratise the industry - it relocated the fight from the thing that got cheap to the things that didn't.

For me, that's what the book says, and it's less settled than the eulogies for open rails would suggest. The dollar is a solved problem, sure (at least if the US Treasury's model is to be believed). Who gets to issue it, move it, and stand in front of you when you want out, is not. Every enclosure under construction is a bet that those answers can be owned - but the counter-bet is simpler: a chain with a landlord is [a company store](/blog/company-scrip/), and we know how company stores end. We can see which side the incumbents' money is on, and I'm not convinced they're right.

I think the way these rails play out is an evergreen pattern of conflict - what Thucydides might have called *to anthropinon*[^anthropinon]. And so, I'll leave this post with some reasoning by analogy. If cognition commoditises the way settlement did - cheap, open, everywhere - don't expect the commoditisation itself to democratise anything. Watch the same three moats: who holds permission, who holds distribution, and whether anyone manages to build the credibly neutral substrate that forces the giants to share rails rather than build their own. In settlement, the neutral rails got a ten-year head start before the giants took them seriously - the cover required to build distributed, resilient networks. So far, cognition is running the other way. The giants are the substrate, and nobody's Ethereum is coming unless someone builds it.

[^dsic]: <https://en.wikipedia.org/wiki/Incentive_compatibility>
[^charters]: The eleven: Circle, Ripple, BitGo, Paxos, Fidelity Digital Assets, Bridge, Crypto.com, Protego, Morgan Stanley, Payoneer, Zerohash. The window runs from the OCC's first conditional approvals in December 2025 to the eleventh filing in early March 2026. <https://www.fintechweekly.com/news/occ-national-trust-bank-charter-crypto-fintech-2026>
[^genius]: <https://www.mayerbrown.com/en/insights/publications/2025/07/genius-act-signed-into-law-us-enacts-federal-stablecoin-legislation>
[^lobby]: <https://www.theblock.co/post/392839/us-banking-lobby-weighs-lawsuit-against-occ-over-crypto-fintech-national-trust-charters-report>
[^tch]: <https://www.ledgerinsights.com/us-banks-tap-the-clearing-house-for-tokenized-deposit-network/>
[^stanchart]: Standard Chartered's US-specific estimate (January 2026). The same analysis puts emerging-market deposit flight near $1 trillion by 2028. <https://finance.yahoo.com/news/us-banks-may-lose-500-172100068.html>
[^door]: Mark Monaco, Bank of America's head of global payments solutions, to the WSJ. <https://www.pymnts.com/blockchain/2026/big-banks-launch-tokenized-deposit-network-to-fight-off-stablecoin-threat/>
[^supply]: <https://defillama.com/stablecoins>
[^volume]: A record $33 trillion in 2025, led by USDC. Some coverage has it past Visa and Mastercard combined. <https://www.bloomberg.com/news/articles/2026-01-08/stablecoin-transactions-rose-to-record-33-trillion-led-by-usdc>
[^arc]: <https://www.circle.com/pressroom/circle-launches-arc-public-testnet>
[^plasma]: Mainnet beta launched September 2025 with ~$2B in stablecoin liquidity on day one. <https://www.theblock.co/post/371228/bitfinex-plasma-blockchain-mainnet-launch>
[^stablechains]: <https://blockeden.xyz/blog/2026/03/27/stablechains-purpose-built-stablecoin-l1-race-plasma-circle-arc-stripe-tempo/>
[^anthropinon]: *To anthrōpinon*, "the human thing" - Thucydides' claim that, human nature being what it is, events will repeat in much the same way. His justification for writing history at all. <https://en.wikipedia.org/wiki/Thucydides>
