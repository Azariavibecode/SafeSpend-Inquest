# Release checklist

- [ ] Contract source hash recorded before deployment.
- [ ] Deployer wallet used only for deployment.
- [ ] Policy sponsor and reporter are distinct secondary wallets.
- [ ] Repository commit is public and full-SHA pinned.
- [ ] Policy SHA-256 recomputed from exact raw bytes.
- [ ] Safe tx exists at the fixed authority endpoint.
- [ ] Mapped Ethereum transaction exists and succeeds at Blockscout.
- [ ] Happy, breach and inconclusive branches executed live where controllable.
- [ ] Wrong Safe, wrong digest and duplicate Safe tx are rejected with pre/post state equality.
- [ ] Settlement/refund is claimed by the correct wallet and balance/state read back.
- [ ] UI waits for `FINALIZED` and refreshes contract state without manual reload.
- [ ] Account and chain changes invalidate stale role assumptions.
- [ ] Contract address and transaction hashes link to Explorer.
- [ ] Limitations distinguish synthetic fixtures, testnet enforcement and production claims.

