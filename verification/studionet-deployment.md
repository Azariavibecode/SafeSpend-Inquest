# StudioNet deployment

- Network: GenLayer StudioNet (`61999` / `0xf22f`)
- Contract: `0xC9C416776A42676Ecd8b462465705c0834081678`
- Explorer: https://explorer-studio.genlayer.com/address/0xC9C416776A42676Ecd8b462465705c0834081678
- Source release: `243bd05d69ba94ebb79e9379ab0b52d889f973ae`
- Deployment role: deployer only; no contract owner/admin business authority exists.

## Superseded

This deployment is superseded before E2E completion. Runtime inspection found that the outer Ethereum transaction calls `Safe.execTransaction`, so the receipt target—not the executor sender—must match the registered Safe. Source release `23fa182` checked the wrong receipt side and correctly failed closed, but could not accept any real Safe execution. Do not submit this address as the final deployment.

Live lifecycle transaction hashes and authoritative pre/post readbacks will be appended after the two secondary-wallet run. An address alone proves deployment identity, not successful product behavior.
