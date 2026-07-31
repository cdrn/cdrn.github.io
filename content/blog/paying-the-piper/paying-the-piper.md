---
title: Paying the piper
description: unter allerlei Ausflüchten
date: 2026-07-31
tags:
  - thonk
  - stablecoins
---
## Grading my own book


In March 2025 I made [a post](/blog/whatsgoingonstables/) making some bold predictions about stablecoins. The cool thing about bold predictions is that they are _falsifiable_. In this post, we're going to find out exactly what type of oracle I am - hellenic information broker or natural gas enjoyer. Keep reading to find out!

![this is where i post from](oracle.png)
## Position 1: the yield race

**The call:** issuers would be forced to compete on yield, racing the money/t-bill spread toward zero.

**The grade:** miss in mechanism, hit in pressure. 0.5 points.

For this one, straight up, it got banned: the GENIUS Act prohibits issuers from paying interest to holders. I still _think_ I priced the economics right, but I certainly priced the legislature's willingness to simply prohibit the endgame wrong. That said, the pressure didn't dissipate entirely. The prohibition was written narrowly - issuer-paid yield banned, affiliate-paid yield unaddressed - and the market did exactly what the pressure predicted: by late 2025 Coinbase was paying roughly 4% and Kraken roughly 5% in rewards on USDC[^rewards], with the Fed and the ABA warning the migration could squeeze over a trillion dollars out of bank lending capacity[^lending].

So now Congress is chasing the yield hop by hop: the OCC's February 2026 proposed rulemaking[^occnprm] includes a rebuttable presumption that coordinated issuer-affiliate yield arrangements are prohibited - language that captures the Coinbase-Circle structure as it operates today - and a May deal would use the CLARITY Act to prohibit rewards that are "economically or functionally equivalent" to bank interest[^clarity].

On this one I am reserving the right to revisit. I think this hypothesis is strong in the limit - but will have to go through many rounds of the regulatory arms race to end up in the place predicted by the post. Still! Not my worst take.

## Position 2: orderflow is king

**The call:** distribution decides; stablecoins that have a reason to be, will be.

**The grade:** Pretty clean win, and the market conceded it in the design of its newest product. 1 point.

The consortium stablecoin Open USD is some of the best evidence for this one.  Considering that it is a Visa/Mastercard/Coinbase vehicle - and its model shares reserve earnings with distribution partners, it slots perfectly into the thesis. The implication here is that: The risk free rate gets handed more or less wholesale to the person who owns the distribution/orderflow[^openusd]. 

Ding!

PYUSD is the cautionary half of the same grade: ~680% growth to a ~$4.2B peak, driven by the YouTube creator-payout integration, Visa Direct remittances and a 4.5% rewards program - then a roughly 31% supply contraction once the incentive programs tapered[^pyusd]. Rented distribution, not owned. The coins with a reason to exist kept existing.

Probably my cleanest call, and obvious to bridge war veterans, but maybe not to everyone!

## Position 3: the vampire attack

**The call:** an aggressive issuer accepts rival stables, burns them through the redemption contract, mints its own on top.

**The grade:** miss - nothing at scale materialised. 0 points. Concentration actually tightened: USDT around 59% and USDC around 24% of a roughly $316B market[^share].

But there's a reportable question inside the miss: the defence the post predicted - contractual mint/burn limits with designated arbitrageurs - is now standard practice. So either the deterrent worked, which is a partial hit dressed as a miss, or the attack economics never cleared. Those are different post-mortems and I don't know which one is true.

Worth mentioning, this has likely been ablated by the above point about consortium revenue sharing. It's easier to join 'em than to beat 'em for now. We may live to see the vampire return however after the consortiums settle. Miss.

## Position 4: the CDP renaissance

**The call:** CDP and LST-backed stables get their moment "after the institutions do battle."

**The grade:** open position resolving early, in my favour - and ahead of my own sequencing. 0.75 points, provisionally. The battle isn't over and they're already eating share: USDe at roughly $4.4B, the largest crypto-collateralised synthetic dollar after Sky's USDS (itself grown north of $9B)[^usds], sUSDe printing ~9.4% trailing APY in the spring - nearer 7% by June - with about 70% of supply staked[^usde].

The fresh observation hiding in the grade: the regulated lane banned yield, and savings demand went where the ban can't follow. The GENIUS yield prohibition is functioning as a subsidy to Ethena[^ethenaban]. This continues as volumes grow in my opinion - potentially confounded if walled garden venues ever take flight.

## Position 5: the flow-control tranche

**The call:** a younger tranche, this one from [December's post on the speed of law](/blog/speed-of-law-vs-blocks/): enforcement shifts from asset control to flow control - validator pressure, frontend takedowns, wallet delisting, travel rules reaching into DeFi.

**The grade so far:** aging very well. 0.75 points, provisionally - it's only seven months old. FATF's Seventh Targeted Update (July 2026)[^fatf] flags offshore VASPs, stablecoins and unhosted wallets for tighter supervision, and supervisors are now using functional on-chain and off-chain indicators - multisig control, fee redirection, frontend management - to identify who controls a protocol[^fatfdefi]. Enforcement is concentrating on exactly the layer the post named: web apps, RPC providers, hosted frontends, with geofencing and policy-gating becoming default features. MiCA has already forced exchanges to delist USDT in parts of the EU[^mica].

One softener to keep the grade (somewhat) honest: only about 40% of jurisdictions with Travel Rule laws have taken any supervisory or enforcement action[^travelrule]. The intent has shifted faster than the capacity - but it's early days.

## The net book

Tallying the card: **yield race** 0.5, **orderflow** 1, **vampire attack** 0, **CDP renaissance** 0.75, **flow control** 0.75. Call it 3 out of 5, with two positions still open and both drifting in my favour. A reasonable book!

Worth mentioning - for many of these positions, it's still early days, but we'll take it! I am particularly interested to see if the vampire attack and CDP renaissance theses play out in the limit, as both have implications for (and are moved by!) the emergent consortium meta. 

I'll continue watching these, and try to add some more outlandish claims to the book this year. But for now, consider the piper paid. Until next time!


[^rewards]: The banks call it a loophole; Coinbase's position is that the law says what it says. <https://www.coindesk.com/policy/2026/03/19/coinbase-faces-a-multibillion-dollar-threat-from-d-c-but-a-rewards-loophole-could-protect-its-stablecoin-revenue>
[^lending]: The Fed/ABA estimate runs to $1.26 trillion in lost lending capacity. <https://www.coingecko.com/learn/banks-vs-stablecoins>
[^occnprm]: NPRM of February 25, 2026; the presumption treats coordinated issuer-affiliate yield as prohibited unless proven unconnected to holding the coin. <https://www.gibsondunn.com/occ-proposes-comprehensive-stablecoin-regulatory-framework-to-implement-the-genius-act/>
[^clarity]: The Tillis-Alsobrooks compromise: no rewards for merely holding, activity-linked rewards allowed. The ABA reportedly sent 8,000 letters. <https://www.coindesk.com/policy/2026/05/01/clarity-act-text-lets-crypto-firms-offer-stablecoin-rewards-while-shielding-bank-yield>
[^openusd]: 140-odd launch partners; reserve earnings flow to partner businesses net of a management fee, with free unlimited mint/redeem. <https://www.theblock.co/post/406736/visa-stripe-coinbase-join-open-usd-stablecoin-shares-reserve-revenue>
[^pyusd]: Peaked at ~$4.2B in March 2026, closed Q2 near $2.7B - the first meaningful contraction since launch. <https://stablecoininsider.org/paypals-pyusd-q2-2026-report-supply-adoption-and-key-metrics/>
[^share]: As of June 2026. Live figures: <https://defillama.com/stablecoins>
[^usds]: <https://messari.io/project/sky-dollar>
[^usde]: <https://eco.com/support/en/articles/15254002-ethena-usde-and-susde-2026-delta-neutral-yield>
[^ethenaban]: The subsidy reading is mine; the mechanics - yield products structured outside the GENIUS perimeter - are laid out here. <https://cryptobriefing.com/genius-act-yield-stablecoin-rules/>
[^fatf]: <https://www.fatf-gafi.org/en/publications/Fatfrecommendations/targeted-updated-virtualassets-vasps-2026.html>
[^fatfdefi]: The companion DeFi report - control indicators include multisig custody, fee redirection and frontend management. <https://www.fatf-gafi.org/en/publications/Virtualassets/targeted-report-decentralised-finance-2026.html>
[^mica]: <https://www.theblock.co/post/344182/binance-delist-tether-other-non-mica-compliant-stablecoins>
[^travelrule]: Per Notabene's read of the update: 91 of 109 surveyed jurisdictions have Travel Rule legislation in force, but roughly 60% of those hadn't yet issued a single supervisory finding or directive. <https://notabene.id/post/fatfs-seventh-targeted-update-on-virtual-assets>
