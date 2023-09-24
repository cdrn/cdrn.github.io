---
title: Eth contract data pt 3. How to run your own graph node
description: Let's investigate a command line tool to help us understand the storage tree
date: 2023-09-05
tags: [ethereum, thegraph, forge, contract data, mempool, storage]
---
This is the third and final part unwinding the contract talk i gave at [eth melbourne](https://ethmelbourne.co/).You can find the first part [here](https://cdrn.github.io/blog/slurpingcontractdatapt1/) and the second part [here](https://cdrn.github.io/blog/slurpingcontractdatapt2/) In this part, I want to talk a bit about your options when trying to index contract data at any kind of scale.

## Getting the data at scale

In the previous two posts, we talked a bit about how storage works in ethereum - how the underlying data structures function, how you can write to storage in your contract and your best bet for querying data from the chain. In this post, I want to talk a little more about getting the data at scale. Specifically, i want to talk about my favourite approach to this: stealing Yaniv's code.

## Setting up your own Graph node

[TheGraph](https://thegraph.com/) is a protocol that aims to be a decentralised indexer of blockchains. Whether it is decentralised or not is a moot point to us - it's nature neccessitates it being open source. This means that we have access to the source code. Even better - TheGraph protocol makes it easy for us to write our own ETLs.

To cut a long story short, you can trivially run your own graph indexer by pulling down the codebase from [here](https://github.com/graphprotocol/graph-node). Simply `docker-compose up` in the `docker` directory. You can grab an example ETL from [here](https://github.com/cdrn/example-subgraph-eth-melb) and just follow the instructions in the docs to deploy your ETL.

If you're making an ETL for a custom set of contracts, you'll need to grab and compile the ABIs by looking at the contracts tab discussed in an earlier post from Etherescan, or your block explorer of choice. If these are your contracts, you should be able to dump the ABIs into your subgraph repo and go!

Once you are up and running and you've run the correct commands to deploy your ETL to you graph node, it will go ahead and start indexing all of the relevant blocks to construct the entire history of the contracts you have supplied to it! You can interrogate them either by a graphql dashboard exposed on localhost, or, my favourite, simply connect to the local postgres instance you are running and run your queries. Neat!

## Cryo

Of course, as usual, paradigm has released their own tool to more or less obviate the need for any of this. Were I looking to handroll my own version of this, I might take a look at [cryo](https://github.com/paradigmxyz/cryo) which allows you to quickly and easily extract blockchain data to parquet.

## Parting remarks

Indexing contract data is, at this point, old news. As someone who has done it more than a few times, I'd say: Try to use a prerolled solution like TheGraph or Cryo. Failing that - it's easy to have a look at these projects for a liberal dose of inpsiration. These problems have been solved before and it will greatly expedite your efforts.

Feel free to check out the [slide deck](https://drive.google.com/file/d/16ZzEvUlselU3xdTWhfhJU8rvaB7umlRW/view) if you're still curious. Hope it helps!