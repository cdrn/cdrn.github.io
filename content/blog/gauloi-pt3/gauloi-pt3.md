---
title: "Gauloi Part 3: disputes"
description: Cross-chain dispute resolution, collusion resistance, and the path from committee attestation to storage proofs
date: 2026-03-19
tags: [thonk, stablecoins, settlement]
---

## The problem

[Part 1](/blog/gauloi/) covered what Gauloi is. [Part 2](/blog/gauloi-pt2/) covered how the escrow state machine works. This post is about the hardest part: what happens when someone lies.

The setup: a maker claims they filled an intent on chain B. They submit a transaction hash to the escrow on chain A. The escrow needs to decide whether that fill actually happened. It can't check chain B directly. Someone has to tell it, and that someone might be lying.

This is a cross-chain oracle problem. Every bridge has it. The question is who you trust and what happens when that trust breaks.

## Cross chain oracles in the wild

[Across](https://across.to/) uses UMA's Data Verification Mechanism[^uma-dvm]. When a dispute is raised, it escalates to the full set of UMA tokenholders, who vote in a commit-reveal Schelling point game over 48 hours. Voters who get it wrong or don't show up lose 0.1% of their staked UMA. Voters on the correct side earn the slashed tokens pro-rata.

This works. The security budget is backed by UMA's market cap, the attestor set (tokenholders) is economically independent from the relayers, and the slashing mechanism forces participation. But it introduces a hard dependency on UMA infrastructure, a governance token, and a 48-96 hour resolution time. The governance token part is the bit I wanted to avoid. Token voting is a rug pull factory and the last thing I want on a settlement layer is a speculative asset backing its security model.

LayerZero's lzRead[^lzread] lets you read state from chain B on chain A via their Decentralized Verifier Network. Cleaner than running your own attestor set, but it's still a trust assumption on LayerZero's infra. For a protocol positioning itself as neutral settlement infrastructure, depending on someone else's oracle feels wrong.

Storage proofs. If chain A has chain B's state root (which it does for L2-L1 pairs - Arbitrum posts state roots to Ethereum, OP stack does the same), you can submit a merkle proof that a specific ERC20 transfer happened on chain B and verify it against the state root on-chain. No attestors, no oracles, just maths. But it only works for chain pairs with shared state roots, verification is gas-heavy, and each chain pair needs its own adapter. Different chains, different proof formats, different failure modes. Hard to reason about uniformly.

## What I built first

I wanted one mechanism that works the same way on every chain pair, doesn't depend on external infrastructure, and doesn't need a governance token. One failure mode I can reason about formally. That means an attestor council.

The first implementation was simple. Staked makers attest to whether a fill was valid. Someone submits signatures to `resolveDispute()`, the contract checks the signers are active staked makers, and if enough signatures are collected, the dispute resolves. `requiredSignatures` was set to 1 for v0.1.

This had three problems.

No attestor accountability. The contract recovered signer addresses and checked they were active makers, but didn't record who attested or which way they voted. A maker who signed `fillValid = true` for a fraudulent fill faced zero on-chain consequences. Costless collusion.

First-past-the-post resolution. `resolveDispute()` takes a `fillValid` boolean and signatures all attesting to that outcome. The first call that meets the threshold wins. After that, `disp.resolved = true` and no further submissions are accepted. If a colluding maker submits before an honest one, fraud succeeds. It's a race, not a consensus.

The attestor set is the set of potential colluders. Unlike Across where disputes escalate to UMA tokenholders (economically independent), Gauloi's attestors are the same staked makers who do fills. A maker committing fraud can pre-arrange with another maker to attest in their favour. The attestor has nothing to lose.

### The concrete attack

With `requiredSignatures = 1`:

1. Maker A submits a fraudulent fill (never sent tokens on chain B)
2. An honest maker disputes
3. Maker B (colluding with A) calls `resolveDispute(intentId, true, [B_signature])`
4. Dispute resolves as "fill valid". Maker A keeps the escrowed funds
5. Maker B faces no penalty
6. They split the proceeds

The cost of this attack is zero. The reward is the fill amount. That's obviously broken.

## Fixing it

The same idea that secures fill detection - the single honest challenger model[^optimism-fp] - can be applied to resolution itself. Optimism assumes state roots are valid unless someone proves otherwise. One honest watcher is enough. Apply the same logic to dispute outcomes.

### Resolution challenge window

`resolveDispute()` no longer produces a final outcome. It proposes one. A 24-hour challenge window opens after resolution, during which attestor identities and stake weights are recorded on-chain. Anyone who thinks the resolution was wrong can challenge it.

When challenged, round-1 attestors are excluded from the second round and face slashing if the resolution is overturned. That's the fix for costless collusion - attestors now risk their stake when they sign.

### Stake-weighted voting with quorum

Votes are weighted by staked capital, not headcount. This prevents sybil attacks: running 50,000 small-stake maker addresses costs the same total capital as one large stake, with no voting advantage.

The threshold can't be majority of total staked capital. If one entity stakes 40% of the system and refuses to attest, honest attestors can never reach majority. Every dispute expires, defaults to fill-valid, fraud goes unchallenged. So the threshold is majority of participating stake, subject to a quorum.

Quorum is 30% of eligible stake (total stake minus the disputed maker and the challenger, who are conflicted). If 30% of eligible stake participates, the vote is valid and the majority of participating stake determines the outcome.

This handles both attacks. A whale holding 40% of stake can't block quorum by sitting out unless they hold over 70%. A handful of colluders can't win by being the only ones who show up because they still need to represent 30% of all staked capital for the vote to count.

If quorum isn't met, the dispute stays open and the protocol halts new intake. A settlement protocol that can't resolve disputes shouldn't be settling.

### The slash curve

A flat slash multiplier doesn't work across all fill sizes. At 3x, a fraudulent $50k fill costs the maker $150k. Fine. But 3x on a $50 fill is $150, and the attestor reward (25% of slash) is $37.50 split across multiple attestors. Nobody's checking an RPC endpoint and signing an attestation for $8.

You could raise the multiplier, but then honest makers face disproportionate risk on small fills. You could set a floor (minimum $500 slash), but that creates a cliff - makers stop taking fills just below it because the risk is discontinuous.

So the multiplier is a curve, inversely proportional to fill amount:

```
multiplier = min(base + k / fillAmount, maxMultiplier)
slashAmount = min(fillAmount * multiplier, makerStake)
```

With `base = 2`, `k = 650` (in USDC terms), `max = 15`:

| Fill size | Multiplier | Slash | Attestor pool (25%) |
|-----------|-----------|-------|-------------------|
| $50 | 15x | $750 | $187 |
| $500 | 3.3x | $1,650 | $412 |
| $5,000 | 2.13x | $10,650 | $2,662 |
| $50,000 | 2.01x | $100,650 | $25,162 |

It's smooth, with no cliff and no fill size where the risk profile suddenly changes. Attestor rewards are meaningful at every scale and fraud is -EV everywhere.

## The collusion maths

When does fraud actually pay? Define:
- `N` = total staked makers
- `S` = stake per maker (assuming uniform for simplicity)
- `F` = fill amount being stolen
- `C` = total colluding makers (including the fraudulent maker)
- `T` = signature threshold (fraction of participating stake)
- `Q` = quorum (fraction of eligible stake)

Fraud needs to survive both rounds. Win round 1, then either avoid a challenge entirely (unlikely if anyone honest is watching) or win round 2 as well.

Round 1 requires `C1` colluding attestors such that `C1 * S >= Q * eligible_stake` (meet quorum) and `C1` represents a majority of participating stake.

Round 2 excludes round-1 attestors. The eligible pool shrinks to `N - 1 - C1` (minus the fraudulent maker and round-1 attestors). Round 2 requires `C2` additional colluders from this reduced pool meeting the same quorum and majority requirements.

Total colluders needed: `C_total = 1 + C1 + C2`.

With `N = 10`, `T = 0.5`, `Q = 0.3`:

Round 1 eligible = 9 (minus fraudulent maker). Quorum = `ceil(0.3 * 9)` = 3 makers' worth of stake. Majority of participants wins.

If 3 colluders attest in round 1, they meet quorum and win (3 of 3 participating). Round 2 eligible = 10 - 1 - 3 = 6. Quorum = `ceil(0.3 * 6)` = 2. Need 2 more colluders.

`C_total = 1 + 3 + 2 = 6 out of 10` (60% must collude).

Compare to single-round majority: 5 out of 10 (50%). The double challenge window pushes it from 50% to 60%.

With non-uniform stakes where large honest makers dominate, the threshold rises further. And every round-1 colluder risks their stake if the resolution is challenged and overturned.

Individual EV for a colluder:

```
EV = P(success) * F/C_total - P(failure) * slashAmount
```

The slash curve makes `slashAmount` large relative to `F` at every fill size. For a $50 fill with 15x slash:

```
EV = P(success) * 50/6 - P(failure) * 750
   = P(success) * 8.33 - P(failure) * 750
```

For this to be +EV, `P(success)` needs to exceed 0.989. Under the single honest challenger assumption, one honest participant watching the network makes that probability very low.

Larger fills are worse for the attacker. $50k fill, 2x slash:

```
EV = P(success) * 50000/6 - P(failure) * 100000
   = P(success) * 8333 - P(failure) * 100000
```

`P(success)` needs to exceed 0.923. With 4 honest makers out of 10, good luck.

Play with the numbers:

<div class="collusion-sim">
<style>
.collusion-sim {
  margin: 2em 0;
  font-family: inherit;
}
.collusion-sim .sim-title {
  font-size: 0.85em;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-color-muted);
  margin-bottom: 1.5em;
}
.collusion-sim .sim-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25em;
  margin-bottom: 1.5em;
}
.collusion-sim .sim-control {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
}
.collusion-sim .sim-control label {
  font-size: 0.78em;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.collusion-sim .sim-control .sim-val {
  font-size: 1em;
  font-weight: 600;
  font-family: "Courier New", Courier, monospace;
  font-variant-numeric: tabular-nums;
}
.collusion-sim input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: var(--text-color-muted);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  opacity: 0.5;
}
.collusion-sim input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-color);
  cursor: pointer;
}
.collusion-sim input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-color);
  cursor: pointer;
  border: none;
}
.collusion-sim .sim-verdict {
  text-align: center;
  padding: 1em;
  margin-bottom: 1.5em;
  font-weight: 600;
  font-size: 0.95em;
  border: 1px solid var(--text-color);
}
.collusion-sim .sim-verdict.safe { border-color: #4aff7a; color: #2a9e4a; }
.collusion-sim .sim-verdict.danger { border-color: #ff4a4a; color: #cc3333; }
.collusion-sim .sim-verdict.marginal { border-color: #cc9900; color: #cc9900; }
[data-theme="dark"] .collusion-sim .sim-verdict.safe { color: #4aff7a; }
[data-theme="dark"] .collusion-sim .sim-verdict.danger { color: #ff4a4a; }
[data-theme="dark"] .collusion-sim .sim-verdict.marginal { color: #ffd94a; }
.collusion-sim .sim-section {
  border: 1px solid var(--text-color);
  padding: 1.25em;
  margin-bottom: 1.5em;
}
.collusion-sim .sim-section-title {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-muted);
  margin-bottom: 0.75em;
  font-weight: 600;
}
.collusion-sim .sim-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.4em 0;
  border-bottom: 1px solid var(--text-color-muted);
  opacity: 0.8;
}
.collusion-sim .sim-row:last-child { border-bottom: none; }
.collusion-sim .sim-row-label { font-size: 0.82em; color: var(--text-color-muted); }
.collusion-sim .sim-row-value {
  font-size: 0.9em;
  font-weight: 600;
  font-family: "Courier New", Courier, monospace;
  font-variant-numeric: tabular-nums;
}
.collusion-sim .sim-positive { color: #2a9e4a; }
.collusion-sim .sim-negative { color: #cc3333; }
[data-theme="dark"] .collusion-sim .sim-positive { color: #4aff7a; }
[data-theme="dark"] .collusion-sim .sim-negative { color: #ff4a4a; }
.collusion-sim .sim-bar-container {
  display: flex;
  height: 20px;
  overflow: hidden;
  margin: 0.5em 0;
  border: 1px solid var(--text-color);
}
.collusion-sim .sim-bar-c {
  background: #cc3333;
  opacity: 0.7;
  transition: width 0.2s ease;
}
.collusion-sim .sim-bar-h {
  background: #2a9e4a;
  opacity: 0.7;
  transition: width 0.2s ease;
}
[data-theme="dark"] .collusion-sim .sim-bar-c { background: #ff4a4a; }
[data-theme="dark"] .collusion-sim .sim-bar-h { background: #4aff7a; }
.collusion-sim .sim-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72em;
  color: var(--text-color-muted);
}
.collusion-sim .sim-round {
  margin-bottom: 0.75em;
  padding-bottom: 0.75em;
  border-bottom: 1px solid var(--text-color-muted);
  opacity: 0.8;
}
.collusion-sim .sim-round:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.collusion-sim .sim-round-header { font-size: 0.85em; font-weight: 600; margin-bottom: 0.25em; }
.collusion-sim .sim-round-detail { font-size: 0.78em; color: var(--text-color-muted); line-height: 1.6; }
.collusion-sim .sim-ev-box {
  border-left: 3px solid var(--text-color);
  padding: 0.75em;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.82em;
  line-height: 1.8;
  margin-top: 0.5em;
  overflow-x: auto;
}
.collusion-sim .sim-note {
  font-size: 0.75em;
  color: var(--text-color-muted);
  line-height: 1.5;
  font-style: italic;
}
@media (max-width: 600px) {
  .collusion-sim .sim-controls { grid-template-columns: 1fr; }
}
</style>

<div class="sim-controls">
  <div class="sim-control">
    <label>Makers (N)</label>
    <span class="sim-val" id="v-makers">10</span>
    <input type="range" id="sim-makers" min="4" max="30" value="10" step="1">
  </div>
  <div class="sim-control">
    <label>Stake per maker</label>
    <span class="sim-val" id="v-stake">$100,000</span>
    <input type="range" id="sim-stake" min="100000" max="1000000" value="100000" step="50000">
  </div>
  <div class="sim-control">
    <label>Fill amount</label>
    <span class="sim-val" id="v-fill">$5,000</span>
    <input type="range" id="sim-fill" min="10" max="100000" value="5000" step="10">
  </div>
  <div class="sim-control">
    <label>Quorum</label>
    <span class="sim-val" id="v-quorum">30%</span>
    <input type="range" id="sim-quorum" min="10" max="70" value="30" step="5">
  </div>
  <div class="sim-control">
    <label>P(honest challenger exists)</label>
    <span class="sim-val" id="v-prob">0.95</span>
    <input type="range" id="sim-prob" min="0" max="100" value="95" step="1">
  </div>
  <div class="sim-control">
    <label>Colluders (incl. fraudulent maker)</label>
    <span class="sim-val" id="v-colluders">4 (40%)</span>
    <input type="range" id="sim-colluders" min="2" max="30" value="4" step="1">
  </div>
</div>

<div class="sim-verdict safe" id="sim-verdict"></div>

<div class="sim-section">
  <div class="sim-section-title">Stake distribution</div>
  <div class="sim-bar-container">
    <div class="sim-bar-c" id="sim-bar-c"></div>
    <div class="sim-bar-h" id="sim-bar-h"></div>
  </div>
  <div class="sim-bar-labels">
    <span id="sim-lbl-c">Colluders: 60%</span>
    <span id="sim-lbl-h">Honest: 40%</span>
  </div>
</div>

<div class="sim-section" id="sim-results"></div>

<div class="sim-section" id="sim-rounds"></div>

<div class="sim-section">
  <div class="sim-section-title">Individual colluder EV</div>
  <div class="sim-ev-box" id="sim-ev"></div>
</div>

<p class="sim-note">
  Assumes uniform stakes. Slash curve: multiplier = min(2 + 650/fillAmount, 15) where fill amounts are in USDC (contracts use 650e6 to account for 6-decimal precision).
  Quorum = % of eligible stake. Double challenge window requires colluders in both rounds.
</p>

<script>
(function() {
  var el = function(id) { return document.getElementById(id); };

  function slashMult(fill) {
    return Math.min(2 + 650 / fill, 15);
  }

  function fmt(n) {
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
    return '$' + n.toFixed(0);
  }

  function fmtS(n) {
    var p = n >= 0 ? '+' : '-';
    if (Math.abs(n) >= 1e6) return p + '$' + (Math.abs(n) / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return p + '$' + (Math.abs(n) / 1e3).toFixed(1) + 'k';
    return p + '$' + Math.abs(n).toFixed(0);
  }

  function update() {
    var N = +el('sim-makers').value;
    var S = +el('sim-stake').value;
    var F = +el('sim-fill').value;
    var Q = +el('sim-quorum').value / 100;
    var pH = +el('sim-prob').value / 100;
    var C = +el('sim-colluders').value;

    if (C > N) { C = N; el('sim-colluders').value = C; }

    el('v-makers').textContent = N;
    el('v-stake').textContent = fmt(S);
    el('v-fill').textContent = fmt(F);
    el('v-quorum').textContent = (Q * 100) + '%';
    el('v-prob').textContent = pH.toFixed(2);
    el('v-colluders').textContent = C + ' (' + (C / N * 100).toFixed(0) + '%)';

    var mult = slashMult(F);
    var slash = Math.min(F * mult, S);

    // Round 1: optimal strategy — send minimum to meet quorum
    var r1Elig = N - 1;
    var r1Quorum = Math.ceil(Q * r1Elig);
    var r1Avail = C - 1; // colluders minus the fraudulent maker
    var r1Win = r1Avail >= r1Quorum;
    var r1Used = r1Win ? r1Quorum : r1Avail; // send minimum needed

    // Round 2: use remaining colluders
    var r2Elig = N - 1 - r1Used;
    var r2Quorum = r2Elig > 0 ? Math.ceil(Q * r2Elig) : 0;
    var r2Avail = C - 1 - r1Used;
    var r2Win = r2Avail >= r2Quorum && r2Elig > 0;

    var canBoth = r1Win && r2Win;
    var pR1 = r1Win ? 1 : 0;
    var pR2 = r2Win ? 1 : 0;
    var pSuccess = pR1 * ((1 - pH) + pH * pR2);
    var pFail = 1 - pSuccess;

    var reward = F / C;
    var ev = pSuccess * reward - pFail * slash;
    var pBreak = slash / (reward + slash);

    // Bar
    var cPct = (C / N * 100);
    el('sim-bar-c').style.width = cPct + '%';
    el('sim-bar-h').style.width = (100 - cPct) + '%';
    el('sim-lbl-c').textContent = 'Colluders: ' + C + '/' + N + ' (' + cPct.toFixed(0) + '%)';
    el('sim-lbl-h').textContent = 'Honest: ' + (N - C) + '/' + N + ' (' + (100 - cPct).toFixed(0) + '%)';

    // Verdict
    var v = el('sim-verdict');
    if (!r1Win) {
      v.className = 'sim-verdict safe';
      v.textContent = 'Not enough colluders to meet quorum in round 1. Need ' + r1Quorum + ' attestors, have ' + r1Avail + '.';
    } else if (ev < -100) {
      v.className = 'sim-verdict safe';
      v.textContent = 'Fraud is deeply -EV. Each colluder expects ' + fmtS(ev) + '.';
    } else if (ev < 0) {
      v.className = 'sim-verdict marginal';
      v.textContent = 'Fraud is -EV but marginal. Each colluder expects ' + fmtS(ev) + '.';
    } else if (ev === 0) {
      v.className = 'sim-verdict marginal';
      v.textContent = 'Break-even. Not worth the coordination risk.';
    } else {
      v.className = 'sim-verdict danger';
      v.textContent = 'Fraud is +EV! Each colluder expects ' + fmtS(ev) + '.';
    }

    // Results
    var rows = [
      ['Slash multiplier', mult.toFixed(2) + 'x', ''],
      ['Slash amount', fmt(slash), ''],
      ['Reward per colluder', fmt(reward), ''],
      ['P(success)', pSuccess.toFixed(4), ''],
      ['P(success) needed for +EV', pBreak.toFixed(4), ''],
      ['Individual EV', fmtS(ev), ev >= 0 ? 'sim-negative' : 'sim-positive']
    ];
    el('sim-results').innerHTML = rows.map(function(r) {
      return '<div class="sim-row"><span class="sim-row-label">' + r[0] +
        '</span><span class="sim-row-value ' + r[2] + '">' + r[1] + '</span></div>';
    }).join('');

    // Rounds
    el('sim-rounds').innerHTML =
      '<div class="sim-section-title">Double challenge window</div>' +
      '<div class="sim-round"><div class="sim-round-header">Round 1</div><div class="sim-round-detail">' +
      'Eligible pool: ' + r1Elig + ' makers<br>' +
      'Quorum: ' + r1Quorum + ' makers\' stake needed (' + (Q * 100).toFixed(0) + '% of ' + r1Elig + ')<br>' +
      'Colluder attestors available: ' + r1Avail + '<br>' +
      (r1Win
        ? '<span class="sim-negative">Colluders meet quorum and win (' + r1Used + ' of ' + r1Used + ' participating)</span>'
        : '<span class="sim-positive">Colluders cannot meet quorum</span>') +
      '</div></div>' +
      '<div class="sim-round"><div class="sim-round-header">Round 2 (if challenged)</div><div class="sim-round-detail">' +
      'Eligible pool: ' + r2Elig + ' makers (excludes fraudulent maker + round 1 attestors)<br>' +
      'Quorum: ' + r2Quorum + ' makers\' stake needed<br>' +
      'Colluder attestors available: ' + Math.max(0, r2Avail) + '<br>' +
      (r2Elig <= 0
        ? '<span class="sim-positive">No eligible pool remaining</span>'
        : r2Win
          ? '<span class="sim-negative">Colluders can win round 2</span>'
          : '<span class="sim-positive">Colluders cannot meet quorum in round 2</span>') +
      '</div></div>' +
      '<div class="sim-round"><div class="sim-round-header">Combined</div><div class="sim-round-detail">' +
      'Total colluders needed: ' + C + ' of ' + N + ' (' + (C / N * 100).toFixed(0) + '%)<br>' +
      (canBoth
        ? '<span class="sim-negative">Colluders can win both rounds \u2014 honest challengers cannot stop fraud at this collusion level. P(success) = 1.</span>'
        : r1Win
          ? '<span class="sim-positive">Colluders win round 1 but cannot win round 2 \u2014 an honest challenger (' + (pH * 100).toFixed(0) + '% likely) stops fraud</span>'
          : '<span class="sim-positive">Cannot survive both rounds with ' + C + ' colluders</span>') +
      '</div></div>';

    // EV formula
    el('sim-ev').innerHTML =
      'EV = P(success) \u00d7 (' + fmt(F) + ' / ' + C + ') \u2212 P(failure) \u00d7 ' + fmt(slash) + '<br>' +
      '\u00a0\u00a0 = ' + pSuccess.toFixed(4) + ' \u00d7 ' + fmt(reward) + ' \u2212 ' + pFail.toFixed(4) + ' \u00d7 ' + fmt(slash) + '<br>' +
      '\u00a0\u00a0 = ' + fmtS(pSuccess * reward) + ' \u2212 ' + fmt(pFail * slash) + '<br>' +
      '\u00a0\u00a0 = <strong class="' + (ev >= 0 ? 'sim-negative' : 'sim-positive') + '">' + fmtS(ev) + '</strong> per colluder';
  }

  var sliders = document.querySelectorAll('.collusion-sim input[type="range"]');
  for (var i = 0; i < sliders.length; i++) {
    sliders[i].addEventListener('input', update);
  }
  update();
})();
</script>
</div>

## Disbursement

There are two cases for disbursement: disbursing when fraud is caught (and a fill is invalid), and disbursing for a false challenge (the fill was valid).

Fraud caught (fill was invalid): the challenger's bond is returned in full. From the slashed amount, 25% goes to the challenger, 25% to correct attestors (pro-rata by stake weight), 50% to treasury. Taker's escrowed funds are refunded. The challenger gets the biggest individual cut because they posted a bond before knowing whether they'd win. Without that upside, nobody bothers to challenge.

Frivolous challenge (fill was valid): the challenger loses their bond. 50% to the maker as compensation for having their capital locked, 25% to attestors, 25% to treasury. Maker's stake is untouched. The maker gets the biggest cut because they were the one harmed, their capital was locked for days over a bogus dispute. Attestors still get paid because the work is the same regardless of outcome.

## What the committee is actually for

Staked makers attesting to fills are humans doing what a Merkle proof could do. "Did X USDC arrive at address Y on chain Z?" is a deterministic fact about blockchain state. A machine can verify it. The committee exists because cross-chain verification infrastructure wasn't mature enough at design time.

If makers are known entities, which compliance-at-the-maker-level implies, the dispute mechanism is overkill for fraud prevention. A regulated OTC desk won't fake a fill hash. Their license is worth more than anything they could steal. A multisig would be fine. If makers are fully permissionless and anonymous, the mechanism isn't strong enough. Sybil attacks break headcount quorums, stake-weighted voting is capturable by anyone willing to post capital, and no amount of mechanism design fixes capital concentration in a capital-weighted system.

Gauloi sits in the middle. The dispute mechanism isn't preventing fraud by known makers; reputation and legal liability do that. It catches operational errors (maker bot submits wrong fill hash), covers maker exits (previously reputable maker goes rogue, the mechanism protects during the window between "trusted" and "known bad"), and builds the trust ladder for progressive decentralisation before you need it rather than after.

## Holes

Disputed fills are slow. 48 hours for resolution plus 24 for the challenge window is 72 hours worst case, longer on quorum failure. These windows are tuneable, but shorter windows give colluders less time to be caught and honest attestors less time to respond. Longer windows lock more maker capital. Undisputed fills are fast, so the cost falls on the edge case, but it's still days of locked capital when it happens.

The quorum failure mode needs work. If quorum can't be met, the protocol halts new intake. Right response from a safety perspective, but the unpause mechanism is `onlyOwner` for now, which is centralised and contradicts the whole positioning. v0.1 compromise.

Attestors are unpaid during normal operation. Their rewards come from slashed stakes and lost bonds, so if disputes are rare (which is the goal), they rarely earn anything. UMA pays staking rewards to tokenholders regardless of dispute activity. We don't. The bet is that makers are already watching the network for their fill operations and attestation is one RPC call plus a signature, near zero marginal cost. If that turns out to be wrong, slashing for non-participation is a known mechanism we can bolt on later.

Finally, and this is arguably the biggest hole, staking does too many jobs. A staked maker is meant to provide sybil resistance, capacity cap, voting power, and be a fraud deterrent. These goals may not always be congruent. In the current design, being staked proves you have capital, but doesn't necessarily prove independence of incentive. In this way, the protocol's operation is still dependent on a critical mass of (weighted) honest capital.

## The committee is scaffolding

Arbitrum posts state assertions to L1 via RollupCore. After the challenge period (~7 days, shrinking with BOLD[^bold]), the assertion is confirmed and canonical. It commits to all L2 blocks, receipts, and event logs. A proof that a USDC transfer happened is a chain of Merkle inclusions from event log up to confirmed assertion on L1. There's no new oracle here; you're reading data the rollup already publishes for its own security. The OP stack works the same way with a different proof format. Each chain pair gets its own verifier behind an `IProofVerifier` interface.

Gauloi would still settle optimistically. Proofs only come into play on dispute, and at that point the maker waits for the assertion to hit L1 and submits.

The migration: right now, makers are the attestors. Known participants, social trust, owner admin. Before mainnet, the protocol needs emergency exits, a timelock admin, and graceful shutdown. After that, `settleWithProof(order, proof)` on the escrow verifies a storage proof that the fill happened and skips the dispute window entirely. That gives three resolution paths tried in order: proof (trustless), optimistic (no dispute), and committee (fallback). As proof coverage expands per chain pair, the committee handles fewer disputes. Each pair migrates independently, and eventually the committee only exists for exotic chains without proof infrastructure.

The whale problem, the sybil problem, staking doing too many jobs; all of these can be obviated by Merkle inclusion once cross-chain proof infrastructure catches up. Or I build my own. But for now, this is a good enough, consistent enough solution to keep makers honest.

[gauloi-v2 on github](https://github.com/cdrn/gauloi-v2)

[^uma-dvm]: <https://medium.com/uma-project/umas-data-verification-mechanism-3c5342759eb8>
[^lzread]: <https://docs.layerzero.network/v2/developers/evm/lzread/overview>
[^optimism-fp]: <https://docs.optimism.io/stack/fault-proofs/fp-security>
[^bold]: <https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction>
