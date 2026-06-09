---
title: "Company scrip, company store"
description: "Same coin, same issuer, different chain, different price."
date: 2026-06-08
tags: [thonk, stablecoins, orderflow]
---

## The art of the peg

Though the history of crypto is short, we've already seen multiple stablecoin depegs. The first question is always "what happened to the reserves?" - and this is by and large the most prolific failure mode we have seen to date. UST's death spiral in May 2022[^ust], USDT wobbling to 95 cents in the contagion that followed[^usdt], USDC sliding to 87 cents over the SVB collapse weekend[^usdc]. All lost their peg because the market stopped trusting the backing. When someone says "the stablecoin depegged", this is what they mean. The issuer drifted - the reserves are blown, or were never there, and the illusion of redeemability is shattered. The coin is now worth less than a dollar because the issuer is worth less than a dollar.


![if you know what this is, DM me](image.png)
_An early form of UST_


Given the proliferation of stablecoin issuers, the growth of alternative venues and the need for interoperability, I would like to posit a second type of stablecoin failure mode - which is less about the coin and more about the chain. In this scenario, the issuer is fine. The reserves are fine. The peg is fine. But your USD stablecoin on chain X is worth less than your USD stablecoin on chain Y. You may already be familiar with this phenomenon as the basis between USDC on Arbitrum and USDC on mainnet, or the arb between USDT on Tron and USDT on ethereum. Many play the game of bips here and successfully leverage it into millions of profit. But for the average user, it's a trap! You thought you were holding a stablecoin, but you were really holding company scrip(!). The chain is the company store, and the company store sets the prices.

## What controls venue drift

There are a few factors that influence on chain venue drift in stablecoins. A wise man once told me that price is a factor of risk and time - you'll see both listed below in what _I believe_ is the order of importance:

**Exit infrastructure.** The big one. Does the chain have native CCTP, a canonical bridge, or only third-party bridges? The distinction that matters isn't canonical versus third-party, but more burn-and-mint versus lock-and-mint. A token burned on the source and natively minted on the destination is the issuer's own liability on both ends — no wrapper, no locked collateral — so the cross-chain basis is bounded by the cost of burning and minting your way out. A token that arrived by locking collateral in a bridge contract is a claim on that collateral, custodied by the bridge; closing its discount means trusting the bridge, so when the bridge is in doubt the basis has no floor. 

It's also worth noting that the compliance burden of operating exit infrastructure tends to be higher in practice than operating the token itself. The token is, traditionally, an ERC-20 (or equivalent) with a couple of blunt admin levers - Circle reaches for `blacklist()` rarely, and it's surgical and upstream, since a blacklisted address can't even burn. The exit is where the continuous machinery lives: every burn depends on Circle's centralised attestation service, the CCTP contracts carry their own denylist, and a finalised burn is never a guaranteed mint. The bridge is the choke point - not a token they have to freeze, but a permissioned rail they have to run.

**Redemption queue capacity per chain.** Extending the above, issuers ration throughput. CCTP's Fast Transfer Allowance (As an example - it is a great bridge, and therefore easy to use!) is a per-chain escrow cap - when it's drawn down, fast transfers fall back to standard finality and you wait. And finality itself differs per chain: an Ethereum burn settles on a different clock than a Solana one. When the fast lane is full or the source chain is slow, the basis opens up while you wait.

**Withdrawal delays.** L2 fast bridges versus optimistic 7-day exits. Time is a basis. The longer you're trapped, the wider the spread someone will demand to take you out early. This is the reason why CCTP is so powerful - it gives you the option to exit immediately at par, rather than waiting for the market to offer you a price. But if CCTP isn't available, your time in the company store is a function of the exit infrastructure, and the basis is a function of that time.

**Censorship and sequencer monopoly.** Centralised sequencers (i.e, in the case of an L2) can in principle ration access to exit transactions. They mostly haven't, but the option is sitting there. A chain that can throttle your exit is charging you, even when it doesn't. The ceiling on this is L1 force-inclusion: on most rollups you can eventually push a transaction through the L1 escape hatch if the sequencer stalls you, so censorship is bounded to a delay rather than an outright block. But a delay is still a basis - a chain that can make you wait to leave sets a floor under the spread on its coin.

**Maker inventory.** When everyone wants out of chain X at the same time, makers run out of capital on the other side. The basis blows out until inventory rebalances. The depth of the spread is a function of the depth of the maker book. In many ways, this is downstream of all the other factors. The more exit friction, the more venue drift, the more inventory risk for makers, the wider the spread.

Here's a toy model to illustrate some of the above. Two chains, the same exit demand, the same maker inventory on both sides. The only differences: Chain A has a native CCTP lane, Chain B doesn't, and Chain B's bridge is slower. (CCTP here stands in for any deep-liquidity 1:1 bridge primitive: the concept is "fast, par-clearing native exit," CCTP is just the most recognisable instance.) Crank the demand slider and watch the basis diverge.

<div class="venue-sim">
<style>
.venue-sim {
  margin: 2em 0;
  font-family: inherit;
}
.venue-sim .vs-section {
  margin-bottom: 1.5em;
}
.venue-sim .vs-section-title {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-muted);
  margin-bottom: 0.75em;
  font-weight: 600;
}
.venue-sim .vs-control {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  margin: 0.5em 0;
}
.venue-sim .vs-control label {
  font-size: 0.82em;
  color: var(--text-color-muted);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1em;
}
.venue-sim .vs-control label span {
  font-family: "Courier New", Courier, monospace;
  font-variant-numeric: tabular-nums;
  color: var(--text-color);
  font-weight: 600;
}
.venue-sim input[type="range"] {
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
.venue-sim input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-color);
  cursor: pointer;
}
.venue-sim input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-color);
  cursor: pointer;
  border: none;
}
.venue-sim .vs-chains {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  margin-bottom: 1.5em;
}
.venue-sim .vs-chain {
  border: 1px solid var(--text-color);
  padding: 1em;
}
.venue-sim .vs-chain-name {
  font-size: 0.78em;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.5em;
}
.venue-sim .vs-basis-display {
  font-size: 1.8em;
  font-weight: 600;
  font-family: "Courier New", Courier, monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-bottom: 0.4em;
}
.venue-sim .vs-verdict {
  font-size: 0.78em;
  font-weight: 600;
  padding: 0.2em 0.55em;
  border: 1px solid currentColor;
  display: inline-block;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.venue-sim .vs-verdict-healthy { color: #2a9e4a; }
.venue-sim .vs-verdict-stressed { color: #cc9900; }
.venue-sim .vs-verdict-blow-out { color: #cc3333; }
.venue-sim .vs-verdict-no-quote { color: #cc3333; }
[data-theme="dark"] .venue-sim .vs-verdict-healthy { color: #4aff7a; }
[data-theme="dark"] .venue-sim .vs-verdict-stressed { color: #ffd94a; }
[data-theme="dark"] .venue-sim .vs-verdict-blow-out { color: #ff4a4a; }
[data-theme="dark"] .venue-sim .vs-verdict-no-quote { color: #ff4a4a; }
.venue-sim .vs-bars {
  margin-bottom: 0.75em;
}
.venue-sim .vs-bar-label {
  font-size: 0.7em;
  color: var(--text-color-muted);
  margin-top: 0.5em;
  margin-bottom: 0.2em;
  display: flex;
  justify-content: space-between;
}
.venue-sim .vs-bar-track {
  height: 8px;
  border: 1px solid var(--text-color-muted);
  position: relative;
  overflow: hidden;
}
.venue-sim .vs-bar-fill {
  height: 100%;
  background: var(--text-color-muted);
  opacity: 0.6;
  transition: width 0.15s ease;
}
.venue-sim .vs-bar-fill.vs-bar-hot {
  background: #cc3333;
  opacity: 0.75;
}
[data-theme="dark"] .venue-sim .vs-bar-fill.vs-bar-hot { background: #ff4a4a; }
.venue-sim .vs-config {
  margin-top: 1em;
}
.venue-sim .vs-config summary {
  cursor: pointer;
  color: var(--text-color-muted);
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 0.25em 0;
}
.venue-sim svg.vs-chart {
  width: 100%;
  height: auto;
  display: block;
}
.venue-sim .vs-chart-axis line {
  stroke: var(--text-color-muted);
  stroke-width: 1;
}
.venue-sim .vs-chart-label {
  font-size: 9px;
  fill: var(--text-color-muted);
  font-family: "Courier New", Courier, monospace;
}
.venue-sim .vs-chart-line {
  stroke-width: 2;
  fill: none;
}
.venue-sim .vs-chart-line-a { stroke: #2a9e4a; }
.venue-sim .vs-chart-line-b { stroke: #cc3333; }
[data-theme="dark"] .venue-sim .vs-chart-line-a { stroke: #4aff7a; }
[data-theme="dark"] .venue-sim .vs-chart-line-b { stroke: #ff4a4a; }
.venue-sim .vs-chart-current {
  stroke: var(--text-color);
  stroke-width: 1;
  stroke-dasharray: 3,3;
  opacity: 0.6;
}
.venue-sim .vs-chart-noquote {
  stroke-width: 1;
  stroke-dasharray: 2,4;
  opacity: 0.4;
}
.venue-sim .vs-chart-noquote-a { stroke: #2a9e4a; }
.venue-sim .vs-chart-noquote-b { stroke: #cc3333; }
[data-theme="dark"] .venue-sim .vs-chart-noquote-a { stroke: #4aff7a; }
[data-theme="dark"] .venue-sim .vs-chart-noquote-b { stroke: #ff4a4a; }
.venue-sim .vs-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25em;
  font-size: 0.72em;
  color: var(--text-color-muted);
  margin-top: 0.5em;
}
.venue-sim .vs-chart-legend span::before {
  content: "■ ";
  margin-right: 0.2em;
}
.venue-sim .vs-chart-legend .vs-leg-a::before { color: #2a9e4a; }
.venue-sim .vs-chart-legend .vs-leg-b::before { color: #cc3333; }
[data-theme="dark"] .venue-sim .vs-chart-legend .vs-leg-a::before { color: #4aff7a; }
[data-theme="dark"] .venue-sim .vs-chart-legend .vs-leg-b::before { color: #ff4a4a; }
.venue-sim .vs-chart-legend .vs-leg-cur::before {
  content: "┊ ";
  color: var(--text-color);
}
.venue-sim .vs-note {
  font-size: 0.72em;
  color: var(--text-color-muted);
  line-height: 1.5;
  font-style: italic;
  margin-top: 1em;
}
@media (max-width: 600px) {
  .venue-sim .vs-chains { grid-template-columns: 1fr; }
}
</style>

<div class="vs-section">
  <div class="vs-section-title">Exit demand (shared)</div>
  <div class="vs-control">
    <label>Hourly demand to exit <span id="vs-v-demand">$100k/hr</span></label>
    <input type="range" id="vs-demand" min="10000" max="2000000" value="100000" step="10000">
  </div>
</div>

<div class="vs-chains">
  <div class="vs-chain">
    <div class="vs-chain-name">Chain A — has CCTP</div>
    <div class="vs-basis-display" id="vs-a-basis">— bps</div>
    <div class="vs-verdict vs-verdict-healthy" id="vs-a-verdict">Healthy</div>
    <div class="vs-bars">
      <div class="vs-bar-label"><span>Native lane (CCTP)</span><span id="vs-a-native-pct">0%</span></div>
      <div class="vs-bar-track"><div class="vs-bar-fill" id="vs-a-native-bar"></div></div>
      <div class="vs-bar-label"><span>Maker book</span><span id="vs-a-maker-pct">0%</span></div>
      <div class="vs-bar-track"><div class="vs-bar-fill" id="vs-a-maker-bar"></div></div>
    </div>
    <details class="vs-config">
      <summary>Chain A config</summary>
      <div class="vs-control">
        <label>CCTP cap <span id="vs-a-v-cctp">$1.0M/hr</span></label>
        <input type="range" id="vs-a-cctp" min="0" max="2000000" value="1000000" step="50000">
      </div>
      <div class="vs-control">
        <label>Maker inventory <span id="vs-a-v-inv">$500k</span></label>
        <input type="range" id="vs-a-inv" min="0" max="2000000" value="500000" step="50000">
      </div>
      <div class="vs-control">
        <label>Bridge cycle <span id="vs-a-v-cycle">1.0 hr</span></label>
        <input type="range" id="vs-a-cycle" min="0.5" max="6" value="1" step="0.5">
      </div>
    </details>
  </div>

  <div class="vs-chain">
    <div class="vs-chain-name">Chain B — no CCTP, slow bridge</div>
    <div class="vs-basis-display" id="vs-b-basis">— bps</div>
    <div class="vs-verdict vs-verdict-healthy" id="vs-b-verdict">Healthy</div>
    <div class="vs-bars">
      <div class="vs-bar-label"><span>Native lane (none)</span><span id="vs-b-native-pct">0%</span></div>
      <div class="vs-bar-track"><div class="vs-bar-fill" id="vs-b-native-bar"></div></div>
      <div class="vs-bar-label"><span>Maker book</span><span id="vs-b-maker-pct">0%</span></div>
      <div class="vs-bar-track"><div class="vs-bar-fill" id="vs-b-maker-bar"></div></div>
    </div>
    <details class="vs-config">
      <summary>Chain B config</summary>
      <div class="vs-control">
        <label>CCTP cap <span id="vs-b-v-cctp">$0/hr</span></label>
        <input type="range" id="vs-b-cctp" min="0" max="2000000" value="0" step="50000">
      </div>
      <div class="vs-control">
        <label>Maker inventory <span id="vs-b-v-inv">$500k</span></label>
        <input type="range" id="vs-b-inv" min="0" max="2000000" value="500000" step="50000">
      </div>
      <div class="vs-control">
        <label>Bridge cycle <span id="vs-b-v-cycle">1.5 hr</span></label>
        <input type="range" id="vs-b-cycle" min="0.5" max="6" value="1.5" step="0.5">
      </div>
    </details>
  </div>
</div>

<div class="vs-section">
  <div class="vs-section-title">Basis curve vs demand</div>
  <svg class="vs-chart" id="vs-chart" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid meet"></svg>
  <div class="vs-chart-legend">
    <span class="vs-leg-a">Chain A</span>
    <span class="vs-leg-b">Chain B</span>
    <span class="vs-leg-cur">Current demand</span>
  </div>
</div>

<p class="vs-note">
  Toy model. Basis = risk floor + native-lane congestion (cubic in utilization) + maker spread once you spill over (a base premium that scales with the bridge cycle, plus a convex penalty as the maker book saturates). No quote when spillover demand exceeds what makers can serve given inventory and cycle. Curves clip at 500 bps; "no quote" appears as a vertical dashed line where the curve drops off. Real markets are messier (multiple makers with discrete books, inventory rebalancing across many chains, MEV, depeg risk priced in) but the shape is the lesson: flat, then convex, with a cliff.
</p>

<script>
(function() {
  var el = function(id) { return document.getElementById(id); };

  function basis(demand, p) {
    var nativeServed = Math.min(demand, p.cctp);
    var nativeUtil = p.cctp > 0 ? nativeServed / p.cctp : 0;
    var spillover = demand - nativeServed;
    var makerThroughput = p.inv / Math.max(0.5, p.cycle);

    if (spillover > makerThroughput) {
      return {
        basis: null,
        regime: 'no-quote',
        nativeUtil: Math.min(1, nativeUtil),
        makerUtil: makerThroughput > 0 ? Math.min(1.5, spillover / makerThroughput) : 1.5
      };
    }

    var makerUtil = makerThroughput > 0 ? spillover / makerThroughput : 0;
    // Below the cap, the native lane is the cheapest route and the basis prices its congestion (cubic in utilisation).
    // Once we spill over, the marginal trade clears at the maker rate, so the basis is set by the maker spread alone
    // (max-of-routes, not sum). Avoids double-counting the native queue cost when the market is already clearing on makers.
    var nativeCongestion = spillover > 0 ? 0 : 30 * Math.pow(nativeUtil, 3);
    // Maker spread: base premium grows with bridge cycle (time-cost makers price in),
    // plus convex penalty as their book saturates.
    var makerPenalty = spillover > 0 ? p.cycle * 10 + 400 * makerUtil * makerUtil : 0;
    var totalBps = p.risk + nativeCongestion + makerPenalty;

    var regime;
    if (totalBps < 20) regime = 'healthy';
    else if (totalBps < 100) regime = 'stressed';
    else regime = 'blow-out';

    return { basis: totalBps, regime: regime, nativeUtil: nativeUtil, makerUtil: makerUtil };
  }

  function fmtMoney(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + n;
  }

  function paramsFor(prefix, defaultRisk) {
    return {
      cctp: +el('vs-' + prefix + '-cctp').value,
      inv: +el('vs-' + prefix + '-inv').value,
      cycle: +el('vs-' + prefix + '-cycle').value,
      risk: defaultRisk
    };
  }

  var verdictLabel = {
    'healthy': 'Healthy',
    'stressed': 'Stressed',
    'blow-out': 'Blow-out',
    'no-quote': 'No quote'
  };

  function updateChain(prefix, p, demand) {
    var r = basis(demand, p);
    var basisEl = el('vs-' + prefix + '-basis');
    var verdictEl = el('vs-' + prefix + '-verdict');

    if (r.regime === 'no-quote') {
      basisEl.textContent = 'no quote';
    } else {
      basisEl.textContent = Math.round(r.basis) + ' bps';
    }
    verdictEl.textContent = verdictLabel[r.regime];
    verdictEl.className = 'vs-verdict vs-verdict-' + r.regime;

    var nativeBar = el('vs-' + prefix + '-native-bar');
    var nativePct = Math.min(100, r.nativeUtil * 100);
    nativeBar.style.width = nativePct + '%';
    nativeBar.className = 'vs-bar-fill' + (r.nativeUtil >= 0.95 ? ' vs-bar-hot' : '');
    el('vs-' + prefix + '-native-pct').textContent = Math.round(nativePct) + '%';

    var makerBar = el('vs-' + prefix + '-maker-bar');
    var makerPct = Math.min(100, r.makerUtil * 100);
    makerBar.style.width = makerPct + '%';
    makerBar.className = 'vs-bar-fill' + (r.makerUtil >= 0.95 ? ' vs-bar-hot' : '');
    el('vs-' + prefix + '-maker-pct').textContent = r.makerUtil > 1 ? '>100%' : Math.round(makerPct) + '%';
  }

  function drawChart(demand) {
    var svg = el('vs-chart');
    var width = 600, height = 220;
    var padLeft = 45, padBottom = 30, padTop = 10, padRight = 10;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;
    var maxDemand = +el('vs-demand').max;
    var maxBasis = 500;

    function x(d) { return padLeft + (d / maxDemand) * plotW; }
    function y(b) { return padTop + plotH - Math.min(b, maxBasis) / maxBasis * plotH; }

    function buildPath(p) {
      var pts = [];
      var noQuoteX = null;
      for (var i = 0; i <= 100; i++) {
        var d = (i / 100) * maxDemand;
        var r = basis(d, p);
        if (r.basis === null) {
          noQuoteX = x(d);
          break;
        }
        pts.push([x(d).toFixed(1), y(r.basis).toFixed(1)]);
      }
      var path = pts.map(function(pt, i) {
        return (i === 0 ? 'M' : 'L') + pt[0] + ' ' + pt[1];
      }).join(' ');
      return { path: path, noQuoteX: noQuoteX };
    }

    var pA = paramsFor('a', 5);
    var pB = paramsFor('b', 15);
    var lineA = buildPath(pA);
    var lineB = buildPath(pB);
    var currentX = x(demand);

    svg.innerHTML =
      '<g class="vs-chart-axis">' +
        '<line x1="' + padLeft + '" y1="' + padTop + '" x2="' + padLeft + '" y2="' + (height - padBottom) + '" />' +
        '<line x1="' + padLeft + '" y1="' + (height - padBottom) + '" x2="' + (width - padRight) + '" y2="' + (height - padBottom) + '" />' +
        '<text x="' + (padLeft - 5) + '" y="' + (padTop + 4) + '" class="vs-chart-label" text-anchor="end">500+ bps</text>' +
        '<text x="' + (padLeft - 5) + '" y="' + (padTop + plotH / 2) + '" class="vs-chart-label" text-anchor="end">250 bps</text>' +
        '<text x="' + (padLeft - 5) + '" y="' + (height - padBottom + 3) + '" class="vs-chart-label" text-anchor="end">0</text>' +
        '<text x="' + (width - padRight) + '" y="' + (height - padBottom + 15) + '" class="vs-chart-label" text-anchor="end">' + fmtMoney(maxDemand) + '/hr →</text>' +
        '<text x="' + padLeft + '" y="' + (height - padBottom + 15) + '" class="vs-chart-label" text-anchor="start">$0</text>' +
      '</g>' +
      (lineA.path ? '<path d="' + lineA.path + '" class="vs-chart-line vs-chart-line-a" />' : '') +
      (lineB.path ? '<path d="' + lineB.path + '" class="vs-chart-line vs-chart-line-b" />' : '') +
      (lineA.noQuoteX !== null ? '<line x1="' + lineA.noQuoteX + '" y1="' + padTop + '" x2="' + lineA.noQuoteX + '" y2="' + (height - padBottom) + '" class="vs-chart-noquote vs-chart-noquote-a" />' : '') +
      (lineB.noQuoteX !== null ? '<line x1="' + lineB.noQuoteX + '" y1="' + padTop + '" x2="' + lineB.noQuoteX + '" y2="' + (height - padBottom) + '" class="vs-chart-noquote vs-chart-noquote-b" />' : '') +
      '<line x1="' + currentX + '" y1="' + padTop + '" x2="' + currentX + '" y2="' + (height - padBottom) + '" class="vs-chart-current" />';
  }

  function update() {
    var demand = +el('vs-demand').value;
    el('vs-v-demand').textContent = fmtMoney(demand) + '/hr';
    el('vs-a-v-cctp').textContent = fmtMoney(+el('vs-a-cctp').value) + '/hr';
    el('vs-a-v-inv').textContent = fmtMoney(+el('vs-a-inv').value);
    el('vs-a-v-cycle').textContent = (+el('vs-a-cycle').value).toFixed(1) + ' hr';
    el('vs-b-v-cctp').textContent = fmtMoney(+el('vs-b-cctp').value) + '/hr';
    el('vs-b-v-inv').textContent = fmtMoney(+el('vs-b-inv').value);
    el('vs-b-v-cycle').textContent = (+el('vs-b-cycle').value).toFixed(1) + ' hr';

    updateChain('a', paramsFor('a', 5), demand);
    updateChain('b', paramsFor('b', 15), demand);
    drawChart(demand);
  }

  var sliders = document.querySelectorAll('.venue-sim input[type="range"]');
  for (var i = 0; i < sliders.length; i++) {
    sliders[i].addEventListener('input', update);
  }
  update();
})();
</script>
</div>

## Likely outcomes

Two paths:

**More extractive.** Every issuer launches their own chain. That's already happening (Plasma, Stable, Codex, Tempo, Arc). And now every payment rail launches their own stablecoin. Stripe spent $1.1B on Bridge in 2024. Mastercard bought BVNK earlier this year. Coinbase already runs a white-label stablecoin service and a chain. The reported Stripe-Visa-Mastercard stablecoin platform - with Coinbase said to be weighing whether to join[^consortium] - is the union of those positions. Payment rails, merchant acceptance, custody, and a chain, all under one stable.

The product here isn't a USDC or even USDT competitor - a business which originally profited from regulatory arbitrage. It's a competitor to the entire issuer-only stablecoin model. Compete on yield? They won't bother. Their value proposition is *distribution*: the stable clears at par across every merchant terminal and checkout in the western world. That's the company-store model in pure form. You take the scrip because there's nowhere else to spend.

And the basis design is intentional, not accidental. A consortium that owns the rails _can guarantee_ 1:1 inside its ecosystem and shape the friction at the edges. CCTP-style escape hatches are not on the roadmap. The venue drift is the moat.

**Less extractive.** Neutral settlement infrastructure that compresses the basis. Makers who can move clean stablecoins between chains cheaply, screen counterparties, and quote the basis as their spread. The basis becomes the price of exit, paid to whoever does the work cheapest. Not a chain. Not an issuer. A market. The basis here doesn't vanish - it's still a tax — but in an open market it's competed down toward the cost of doing the work and paid to liquidity providers, not rentiers. A spread anyone can undercut rewards better exit infrastructure and more efficient markets; a moat rewards owning the captive audience. Same toll, opposite incentive.

Regulators won't bring this. Most regulatory action widens venue drift, not narrows it. Every freeze opens a new basis on tainted addresses. Every "must be issued by a state-chartered entity" rule creates a new venue. The fix has to come from market structure.

## Closing

The historical scrip didn't die because workers refused it. It died because somebody built the infrastructure that made it pointless to issue.

The on-chain version isn't dying. It's consolidating. The biggest rails and acquirers are forming a guild[^guild] - the biggest exchange circling - to issue scrip backed by the largest captive merchant network ever assembled. The company store has subsidiaries now.

What kills it is the same thing that killed it last time: convertibility. Not the legal kind (that ship sailed). The market kind. Settlement infrastructure that prices the venue basis honestly and lets you exit at fair value, no matter which chain you took the job on.

Until then, the chain is the company store, and the company store sets the prices.

[^ust]: TerraUSD collapsed from its dollar peg toward zero in May 2022 as its algorithmic LUNA backstop hyperinflated under a redemption run. <https://www.chainalysis.com/blog/how-terrausd-collapsed/>
[^usdt]: Tether fell to roughly $0.95 on 12 May 2022 amid the Terra-driven panic and renewed doubts over reserve quality, recovering after processing billions in redemptions. <https://www.coindesk.com/markets/2022/07/26/tether-finds-stable-dollar-peg-after-terras-collapse>
[^usdc]: Circle disclosed that $3.3B of USDC's ~$40B in reserves was stranded at the failed Silicon Valley Bank; USDC fell to about $0.87 on 11 March 2023 before recovering once the FDIC backstopped deposits. <https://www.cnbc.com/2023/03/11/stablecoin-usdc-breaks-dollar-peg-after-firm-reveals-it-has-3point3-billion-in-svb-exposure.html>
[^consortium]: <https://www.coindesk.com/business/2026/06/03/payment-giants-stripe-visa-mastercard-said-to-be-among-backers-of-soon-to-debut-stablecoin-platform>
[^guild]: The reported consortium (Stripe, Visa, Mastercard confirmed; Coinbase said to be weighing participation): <https://www.coindesk.com/business/2026/06/03/payment-giants-stripe-visa-mastercard-said-to-be-among-backers-of-soon-to-debut-stablecoin-platform>. On the card networks' own stablecoin pushes, see Mastercard's on-chain settlement expansion (<https://www.coindesk.com/markets/2026/06/03/mastercard-expands-on-chain-settlement-in-bet-on-stablecoins-and-always-on-finance>) and Visa's stablecoin settlement network (<https://www.coindesk.com/business/2026/04/29/visa-expands-stablecoin-settlement-network-as-volume-hits-usd7-billion-run-rate>).