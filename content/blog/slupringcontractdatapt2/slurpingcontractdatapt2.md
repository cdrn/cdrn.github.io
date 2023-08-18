---
title: Indexing ethereum contract data pt 2.
description: How to index ethereum contract data at scale + tips and tricks
date: 2023-08-18
tags: ethereum, thegraph, forge, contract data, mempool, storage
---
I recently gave a talk at [eth melbourne](https://ethmelbourne.co/) in which i gave some tips and tricks for indexing eth contract data, as well as a brief overview of exactly _what_ contract data is on ethereum and a quick dive into the EVM. This is part two of a two part blog post - you can find the first part [here](https://cdrn.github.io/blog/slurpingcontractdatapt1/). In this part, I want to cover some of your best options for getting into the yummy stuff (contract data) in both scalable and unscalable ways.

## Interrogating the ethereum state tree
In our last post, we talked a little bit about how contract data is stored in a "patricia merkle" tree called the ethereum state tree. In order to demystify this a little, I want to get into the nitty gritty of manually grabbing items off of this trie so you can see how both accessible it is and how we can build up our own state database over time
{% image "./worldstatetrie.png", "A great explanation of how the ethereum state tree works [credit here](https://ethereum.stackexchange.com/questions/6415/eli5-how-does-a-merkle-patricia-trie-tree-work)" %}
