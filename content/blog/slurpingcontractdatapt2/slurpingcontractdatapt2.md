---
title: Eth contract data pt 2. Storage tree, cast and RPC
description: Let's investigate a command line tool to help us understand the storage tree
date: 2023-08-28
draft: true
tags: ethereum, thegraph, forge, contract data, mempool, storage
---
I recently gave a talk at [eth melbourne](https://ethmelbourne.co/) in which i gave some tips and tricks for indexing eth contract data, as well as a brief overview of exactly _what_ contract data is on ethereum and a quick dive into the EVM. This is part two of a two part blog post - you can find the first part [here](https://cdrn.github.io/blog/slurpingcontractdatapt1/). In this part, I want to cover some of your best options for getting into the yummy stuff (contract data) in both scalable and unscalable ways.

## What is the storage tree
In our last post, we talked a little bit about how contract data is stored in a "patricia merkle" tree called the ethereum storage tree. In order to demystify this a little, I want to get into the nitty gritty of manually grabbing items off of this trie so you can see how both accessible it is and how we can build up our own state database over time


{% image "./worldstatetrie.png", "A great explanation of how the ethereum state tree works [credit here](https://ethereum.stackexchange.com/questions/6415/eli5-how-does-a-merkle-patricia-trie-tree-work)", ["300px", "600px"], "(max-width: 991px) 193px, 278px" %}


Ethereum in it's current implementation (as of 2023) actually utilises [3 patricia merkle trees](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#tries-in-ethereum) which have the following useful properties:
1. Their lookup and retrieval time is O(k) where k is key length -- in Ethereum always 20 bytes.
2. Leaf nodes are cryptographically verifiable by only needing to store the state of the path to the root node (the state root) - this means clients do not need the entire state of the tree to verify whether a piece of data is legitimate or not.
For this reason, storage in eth is more or less treated as a hashmap which is especially good news for us if we are interested in mass retrieval - we can be sure it will be relatively fast and we will will also be able to parallelize it (should we so choose)

The storage tree is just the Patricia Merkle Tree that stores all of the "storage" data from the execution of Eth smart contracts. If a contract requires between block, between call memory storage, this is the data structure it lives in

## Interrogating the storage/state tree

For first time ethereum users, the best way to get a handle on the structure and operation of contract data on the chain is using foundry's [`cast` tool](https://github.com/foundry-rs/foundry/tree/master/crates/cast). Cast provides a lot of convenience and hides some of the ugliest parts of interacting with ethereum's [underlying RPC methods](https://ethereum.org/en/developers/docs/apis/json-rpc/) which will become obvious later in this post.

Foundry is easy to install by [following these docs](https://book.getfoundry.sh/getting-started/installation) which I've paraphrased below for convenience. In your terminal, run:

```bash
curl -L https://foundry.paradigm.xyz | bash
```
Once foundry is installed simply run 
```bash
foundryup
```
and you should have access to the `cast` command in your command line. You can type in `cast` to see the subcommands available to you. This also comes with `forge`, `anvil`, and `chisel`.

For now, let's try inspecting the state of a live smart contract to hopefully demystify the inner workings of the eth chain. 

