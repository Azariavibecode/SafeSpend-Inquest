# StudioNet deployment

- Network: GenLayer StudioNet (`61999` / `0xf22f`)
- Contract: `0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2`
- Explorer: https://explorer-studio.genlayer.com/address/0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2
- Source release: `0ce6a39` with policy fixtures committed at `ce687604bf8972d8e8ef8fdb286b26f56a16772e`
- Deployment role: deployer only; no contract owner/admin business authority exists.

## Superseded deployment

`0xC9C416776A42676Ecd8b462465705c0834081678` checked the outer Ethereum receipt sender against the Safe. Since `Safe.execTransaction` is called by an executor EOA, the correct identity binding is the receipt target. This old address correctly failed closed for real Safe execution and must not be submitted.

## E2E

The current deployment completed three semantic outcomes and all corresponding settlement/refund flows using two secondary wallets. See [studionet-e2e.md](studionet-e2e.md) and the machine-readable [transaction record](studionet-e2e.json).

Live lifecycle transaction hashes and authoritative pre/post readbacks will be appended after the two secondary-wallet run. An address alone proves deployment identity, not successful product behavior.
