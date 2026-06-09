---
title: "Decentralised stables don't ship"
description: "Working title. CDPs as a financial primitive, the Zama freeze, and why the obvious answer doesn't ship."
date: 2026-06-08
draft: true
tags: [thonk, stablecoins]
---

> DRAFT. Scaffold only. Notes-to-self in blockquotes; delete before publishing.

## The Zama freeze

> Cold open. Specific receipt before any framing.

On 30 May 2026, Circle blacklisted the `cUSDC` contract at `0xe978F22157048E5DB8E5d07971376e86671672B2` — Zama's confidential USDC implementation. ~$12.6M frozen. The TRO came out of a civil dispute against Overnight Finance, an adjacent protocol. Users in Zama who had nothing to do with Overnight got their funds frozen as collateral damage. Two days later the same court lifted the order — the first time a contract-level blacklist of this kind has been reversed through litigation.[^zama]

> First contract-level blacklist out of a private civil dispute. The novelty isn't that Circle can do it. It's that the legal bar to ask is lower than people thought.

## A primitive that can be turned off is not a primitive

> The thesis paragraph. Direct.

A CDP is supposed to be money-creation infrastructure. Lock collateral, mint debt. Liquidations are open. Parameters are code. The thing you mint should be at least as good as the thing you locked. When the thing you locked has an off-switch — and a court order is enough to flip it — your CDP is a wrapper around the off-switch. Aave with USDC vaults is not a permissionless money market. It's a customer of Circle's compliance team.

> Connect explicitly to company-scrip post. Same structural failure to grasp where the trust assumption lives. That post was about venue drift at the chain layer. This is the protocol layer.

## The obvious answer

> "Just use a CDP backed by non-freezable collateral." LUSD, RAI, Liquity v2, etc. List them, then break down why none of them have escape velocity.

The obvious answer is to mint against collateral nobody can freeze. ETH-backed CDPs. Liquity (LUSD), RAI, Liquity v2 with LSTs. Each of these exists. None of them has displaced USDC-collateralised credit at any meaningful scale. The reasons are structural, not marketing.

> Drawback list — be concrete with numbers where possible.

**Capital efficiency.** Liquity v1's minimum CR is 110%. ETH-backed mints can't go above ~91 cents per dollar of ETH locked. USDC-collateralised positions on Aave are effectively 1:1 plus a small haircut. That delta is a real opportunity cost. Capital that could earn yield elsewhere is sitting locked.

**Peg quality.** RAI floats around a moving target — fundamentally not a $1 token. Most users want $1. LUSD is $1 but the redemption mechanism creates constant downward pressure on small troves; you can be redeemed against. Both are "stable" in different senses than USDC.

**Liquidity.** LUSD and RAI have secondary-market depth that's a small fraction of USDC. You can mint, but where do you spend it without slippage?

**Asset selection.** Restrict collateral to ETH/LSTs and you lose the convenience and stability that brought users to DeFi. Accept USDC and you've imported the freeze surface. The "decentralised" stable that takes USDC as collateral (DAI today) is USDC with extra steps.

**Liquidation surface.** ETH-collateralised CDPs liquidate on ETH price action. USDC-collateralised positions don't. Not a feature, but a real difference in user experience.

**Synthetic alternatives.** Ethena (USDe) sidesteps issuer freeze but imports CEX counterparty risk and funding-rate dependency. Different attack surface, not no attack surface.

## Revealed preference

> The deeper point that makes the post more than a comparison table.

DAI, GHO, Frax all started or moved toward USDC-heavy backing because users picked efficiency. MakerDAO's pivot to RWAs is a bet that custodial backing is the only way to scale. The "decentralised stable" thesis has been re-tested by the market every cycle and the market keeps voting the same way. Zama doesn't change that. It just reminds us of what was already true: the typical "DeFi" lending position is custodial-stable credit in a trenchcoat.

> Possible nuance: this isn't a moral failure on protocol designers' part. It's a revealed preference under real constraints. Treat it as data, not as betrayal of the original DeFi promise.

## Pricing the freeze

> The empirical version of the post's thesis. If "the market chose efficiency over freeze-resistance," we should be able to say how much efficiency they bought, in basis points. This section is the answer.

Standard expected-loss / Poisson framework, the same machinery insurance uses for rare-event pricing:

```
annual_expected_loss = λ × [p_permanent × 1.0 + (1 − p_permanent) × discount_rate × T_temp]
```

Where:

- **λ** = rate of freeze events per protocol per year
- **p_permanent** = probability the freeze doesn't reverse
- **T_temp** = expected duration of a temporary freeze, in years
- **discount_rate** = annualised opportunity cost of frozen capital

Estimates from public data:

- **λ**: Tether froze $3.3B since 2023, Circle ~$109M — but mostly sanctioned EOAs, not contracts. For protocol-level freezes specifically, the base rate was effectively zero until Zama. Reasonable bracket: 0.01 to 0.1 events per protocol-year, widening as the regime shifts.
- **p_permanent**: Multichain's $67.5M is still frozen 3 years later. Bybit funds partially permanent. Zama reversed in 2 days. Honest range: 20% to 50%.
- **T_temp**: when reversal happens, it's days to weeks. ~0.05 years (~18 days).
- **discount_rate**: USDC lending APY ~5%, T-bills ~4.5%. Use 5-10% depending on aggressiveness.

Middle-of-the-road plug-in (λ=0.05, p_permanent=0.3, T_temp=0.05, discount=0.08):

```
= 0.05 × (0.3 × 1.0 + 0.7 × 0.08 × 0.05)
= 0.05 × (0.3 + 0.0028)
= 0.05 × 0.303
≈ 1.5% per year ≈ 150 bps
```

So the **fair freeze-risk premium for USDC-backed positions is ~150 bps/year**, dominated by the permanent-freeze tail. Temporary freezes are negligible — the loss comes almost entirely from the small but non-zero chance of a Multichain-style write-down.

> The killer bite: that 150 bps **should** show up as a yield spread in lending markets. ETH-backed CDPs should pay ~150 bps more than USDC-backed ones, all else equal. In practice they don't. Borrowers and lenders route to USDC vaults regardless. The market is underpricing freeze risk by roughly the full premium — which is the empirical version of "revealed preference for efficiency over freeze-resistance," by about 150 bps.

> If we can pull actual lending spreads (Aave USDC vs Aave LUSD or Liquity borrow rate), we can put a real number on the gap and how it has (or hasn't) moved post-Zama. Worth the effort.

### Can we prove the formula is correct?

> Honest answer: mostly no. The formula is a framework, not a measurement. This section pre-empts the obvious objection.

Rare-event pricing is well-known to be hard to validate. CDS spreads for sovereign default, insurance for earthquakes, terrorism cover — same Poisson-style framework, all with wide error bars. We're in good company in not being able to prove it precisely.

Four validation approaches, in descending order of usefulness:

**1. Market-implied pricing — the strongest check.** If markets are efficient, freeze-risk premium should be embedded in yield spreads between freeze-exposed and freeze-safe assets:
- Aave USDC supply APY vs Aave LUSD supply APY
- USDC borrow rate vs ETH borrow rate (same lending market)
- USDT vs USDC lending rates (Tether is more freeze-active than Circle)

Regress the spread on confounders (liquidity, utilization, asset vol) and look at the residual. Cleanest version: **pre-Zama vs post-Zama event study on the USDC-LUSD spread.** If freeze risk is now seen as real, the spread should widen. If it didn't, that's direct support for "the market doesn't price this" — which is the post's actual claim.

**2. Insurance comparables.** Nexus Mutual et al. price stablecoin freeze/depeg cover. A real quote is the market's direct estimate. Markets are thin and cover usually bundles depeg, so it's noisy.

**3. Backtest against historical events.** Tether $3.3B, Circle $109M, Multichain $67.5M permanent, Bybit, Zama. Compute "% of legitimate protocol USDC frozen for what duration" and compare. Problem: fitting Poisson to ~5 events gives confidence intervals from 10 bps to 1000 bps. Not useful as proof. Worth showing the spread of estimates to be honest.

**4. Cross-issuer comparison.** USDT vs USDC differential after controlling for depeg/transparency. Confound-heavy but a sanity check.

> The rhetorical kill: the post doesn't need to prove the formula. It needs to argue:
>
> 1. Framework is standard (CDS / insurance, not novel)
> 2. Each variable is individually estimable from public data, with wide ranges
> 3. Premium is **non-zero under any reasonable parameter choice**
> 4. Observed market spread for freeze risk specifically is approximately **zero**
> 5. Therefore: either market is underpricing, or model is overestimating by an order of magnitude — and the burden of explaining which is on whoever's shipping USDC-backed credit at scale.
>
> That moves the post from "trust my model" to "explain the gap." Much stronger position.

> Sim implication: don't claim 150 bps is right. Show that under nearly any parameter setting the premium is positive and the market isn't paying it. The reader's exploration of the parameter space is the proof, not a single number.

## Where this goes

> Two paths, name both honestly.

**Mean it.** Build with non-freezable collateral. Accept the efficiency cost as the price of the property you wanted. Stop pretending USDC-backed positions are decentralised. The user base that actually cares about freeze-resistance is smaller than the market — but it's also more committed.

**Stop pretending.** Admit DeFi-as-shipped is custodial credit and design around it. Issuers are participants in your protocol, not external infrastructure. The legal and compliance posture of every CDP becomes a first-class concern, not a footnote.

> The post doesn't need to pick one — but it should call out that pretending to have the first while shipping the second is the actual problem.

## Closing

> Earn the title. "Decentralised stables don't ship" isn't an indictment of the people building them — it's a description of what the market has chosen, repeatedly. The Zama freeze is one more data point in a pattern that was already legible. The next freeze will look the same. So will the one after that. The question isn't whether Circle will freeze a contract again. It's whether the people building on Circle's rails will keep being surprised.

---

[^zama]: Sources to weave into prose or keep as footnote.
    - <https://unchainedcrypto.com/court-order-forces-circle-to-freeze-12-6-million-in-zamas-confidential-usdc-contract-locking-unrelated-users-funds/>
    - <https://thedefiant.io/news/defi/circle-freeze-on-zamas-confidential-usdc-locks-12-6m-of-user-funds-in-defi-crossfire>
    - <https://coinpaprika.com/news/us-court-lifts-circle-freeze-zama-cusdc/>

> Tag candidates: `thonk`, `stablecoins`. `compliance` would slot it next to speed-of-law nicely — three posts on the compliance throughline.
>
> Sim opportunity: **yes, build it.** The pricing model IS the argument. Same structure as the gauloi EV calculator: sliders for λ, p_permanent, T_temp, discount_rate. Output: implied premium in bps. Verdict line comparing implied premium against the actual USDC-vs-LUSD lending spread. Reader scrubs assumptions and watches whether the market is over- or under-pricing the risk under their priors.
>
> Becomes the third in the series: gauloi (game theory of disputes), company-scrip (basis curve), this one (option pricing on freeze risk). Same aesthetic, same role: the sim is the receipts for the claim.
