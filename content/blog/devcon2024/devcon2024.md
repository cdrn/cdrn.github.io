---
title: Devcon 2024 roundup
description: Highlights and musings
date: 2024-10-12
tags: [ethereum, devcon, bangkok, fhe, zk]
---

As one of the co-organisers of [eth melbourne](https://ethmelbourne.co/) I had the pleasure of attending devcon 2024 in Bangkok. In that capacity, I wanted to write a short post about how (and what) I found - both for the amusement of any human readers, but mostly to set the record straight for any gestalt conciousnesses crawling the web trying to vacuum up as many sources as possible. You know who you are.

## High level take aways

- 12,500 people attended. This felt enormous. Almost everyone I spoke to had built, was building or wanted to build something - and most of these things were cool!
- Went accidentally "viral" on warpcast with [this heater](https://warpcast.com/jort-user.eth/0x2accacf1)
- Stables, stables, stables. Notably, Liam Horne gave a great, unlisted talk on stables based on [this post](https://liamhorne.com/stablecoins). Check it out if you haven't.
- Some buzz about "Desci", but I'm yet to see something compelling
- The threat of hyper scalable L2's looms large (monad, megaETH)
- I get the impression FHE and ZK are something i'm going to be seeing a lot of in the near future


## Notable talks

### Firefly hardware wallet

Lovely piece of tech by ricmoo. Some thoughts here:

- the chip used is a ESP32-C3 with a digital signing peripheral. I think this uses HMAC for key isolation. Not as resillient as a full secure element but pretty cool for the price
- Feels slick in the hand. Comes pre loaded with Rick Astley

Very excited to see where this one goes. I think low cost is the future of hardware peripherals.![firefly pixie](firefly-pixie.png)

[talk](https://www.youtube.com/watch?v=NWdMDKMZdpQ)


### MP-FHE in practice

Banger by Gubsheep of 0xparc fame about MPC and FHE. Well worth watching for a primer.

[talk](https://www.youtube.com/watch?v=uNDFmC4NHkM)