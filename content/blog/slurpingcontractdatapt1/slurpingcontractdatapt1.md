---
title: Indexing ethereum contract data pt 1.
description: How to index ethereum contract data at scale + tips and tricks
date: 2023-08-03
tags: ethereum, thegraph, forge, contract data, mempool, storage
---
I recently gave a talk at [eth melbourne](https://ethmelbourne.co/) in which i gave some tips and tricks for indexing eth contract data, as well as a brief overview of exactly _what_ contract data is on ethereum and a quick dive into the EVM. In the interest of sharing, I'd like to condense my talk down into a series of blog posts.

### What is contract data?

First of all, if you're not really familiar with what a smart contract is on Ethereum (and in general), there are plenty of resources out there to get up to speed. I won't be covering that in this post, but you can look [here](https://ethereum.org/en/smart-contracts/#:~:text=Smart%20contracts%20are%20the%20fundamental,if%20this%20then%20that%20structure) for a choose your own difficulty explanation. What I want to talk about specifically is what we mean by _contract data_ and talk a little bit about how the EVM handles memory, but more specifically _storage_

### Great, so what is contract storage?
All of the data in Ethereum is held in a global state tree, in the form of a *Patricia Merkle Tree*. We'll talk a little bit more about this later, but for an ethereum smart contract developer it essentially functions as a key value store.

From the perspective of said developer, `storage` is just a data store that can be used to persist state between block/contract calls. Storage is often used judiciously as it becomes very expensive very quickly. In fact, evm.codes indicates that calls to `SSTORE` and `SLOAD` are justifiably [30 times more expensive](https://www.evm.codes/#54?fork=shanghai) than their in memory counterparts. Thus, as of the time of writing, storage is reserved for memory that absolutely must be persisted in ethereum state.

In solidity, calls to storage are obvious and look like the following:
```solidity
uint[] storage _arr,
```

You can find about a million examples of this online, but suffice to say if you are declaring a variable as `storage`, operating on it will be expensive!
### Ethereum state tree
So, we know that our `storage` calls are being persisted somewhere on the blockchain consistently between all clients, but we don't yet know how ethereum handles said state. As alluded to earlier, all of Ethereum's state is bound up in a Patricia Merkle tree which we can dive a little deeper into to further our understanding of the system.

Like all good tree implementations, the Patricia Merkle Tree is about balancing retrieval, insertion and traversal time. As the word _merkle_ implies however, this data structure has a fourth important property _cryptographic verifiability_. Essentially what it boils down to is this: Given a piece of state and a `state root hash`, any node can verify the integrity of that state by computing the chain of hashes along the branch of the patricia merkle tree which connects that transaction all the way back to the state root. Powerfully, this means a couple of things:
1. Clients can be sure that a state such as the balance of their account is authentic without having to hold the entire state of the ethereum blockchain on their local machine (To date over 100GB including merkle proofs).
2. Clients can efficiently enough retrieve and insert new states to the state tree while preserving the above principal. As we recall from our leetcodes, trie insertion time and look up is o(k) (very fast!) where K is the input size  -- in this case, clipped at 20 bytes which is the size of an ethereum address! Pretty genius!

The actual implementation of the state tree is quite inspired, and i'd recommend you look [here](https://blog.ethereum.org/2015/11/15/merkling-in-ethereum) if you're interested in finding out more. For the purposes of this post however, all you need to understand is that in Ethereum it's functioning as a key value store with some very interesting properties, where all the keys are 20 byte ethereum contract addresses, and some of the values are the contract data we're interested in. Neat!

### Part 2 (Coming soon)
In part two we'll discuss your options for stealing all of that yummy free contract data, why you'd want to and how your approach might change depending on what you're building.
