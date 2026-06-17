---
title: Planesong
byline: Server-driven browser-based multiplayer RPG experiment.
preview: /img/planesong.jpg
tech: Three.js, WebSockets, Node
tags: projects
links:
  - text: Play
    url: https://planesong.net
---

An experiment in building a real-time multiplayer RPG that runs in a browser tab, no engine and no download. The Three.js client renders the world and sends inputs; an authoritative Node server owns the state. Movement, combat, loot, mobs and the economy are simulated server-side and broadcast over WebSockets, so every player sees the same shared world and the server reconciles everyone rather than trusting any one client.

The game on top of that: three classes with loadouts and trainers, NPCs with a dialogue and intent engine, quests, and a persistent character restored from the realm when you reconnect. Solo-built.
