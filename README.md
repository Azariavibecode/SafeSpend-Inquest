# SafeSpend Inquest

SafeSpend Inquest is a GenLayer dApp for bonded review of an **executed Ethereum Safe transaction** against an immutable, sponsor-declared treasury policy.

The contract does not treat a repository document as runtime truth. It binds three separate authorities:

1. GitHub commit/tree/blob APIs prove the exact policy bytes registered by the sponsor.
2. Safe Transaction Service proves the Safe transaction object and its execution mapping.
3. Blockscout proves the mapped Ethereum transaction reached successful runtime execution.

GenLayer validators then decide only the remaining semantic question: whether the bound transaction is compliant, a material breach, or inconclusive. The bounded verdict selects a deterministic bond recipient; it never chooses an arbitrary payment.

## Product thesis

Turn a sponsor-declared treasury policy and independently observed Safe execution into a bounded, economically consequential review without pretending that policy authorship proves runtime behavior.

## Roles

- **Deployer:** deploys only. The contract has no owner/admin business override.
- **Policy sponsor:** registers a Safe, immutable policy source and positive GEN bond.
- **Reporter:** a different wallet opens an incident with an equal bond.
- **Reviewer:** may use any wallet and any valid supported Safe transaction; no allowlist exists.

## Lifecycle

```text
DRAFT policy --authenticate exact GitHub bytes--> ACTIVE
ACTIVE + different reporter + equal bond --> IN_REVIEW policy + OPEN incident
OPEN --Safe object + successful Blockscout receipt--> EVIDENCE_FROZEN
EVIDENCE_FROZEN --comparative validator consensus--> ASSESSMENT_FINAL
COMPLIANT/BREACH --winner claim--> SETTLED
INCONCLUSIVE --each party claims own bond--> REFUNDING --> SETTLED
```

Each policy bond backs exactly one incident. Opening it moves the policy to `IN_REVIEW`; final settlement closes it, preventing the same sponsor bond from underwriting multiple claims.

## Consequences

| Verdict | Recipient | Amount |
|---|---|---:|
| `BREACH` | reporter | sponsor bond + reporter bond |
| `COMPLIANT` | sponsor | sponsor bond + reporter bond |
| `INCONCLUSIVE` | each original party | its own bond |

Outgoing transfers are emitted on finalized execution. A failed finalized call rolls back the state transition; it must not become a false `SETTLED` readback.

## Source scope

| Source | Proves | Does not prove |
|---|---|---|
| GitHub commit/tree/blob/raw | exact registered policy bytes at a full commit | Safe ownership, official DAO authority, runtime execution |
| Safe Transaction Service | exact multisig transaction object and execution mapping | successful Ethereum receipt by itself |
| Blockscout transaction API | exact mapped Ethereum transaction and success status | semantic compliance with policy |
| GenLayer consensus | semantic relation between the bound policy and transaction | missing provenance, missing execution or arbitrary payout |

This first release supports Ethereum mainnet Safe Transaction Service plus Ethereum Blockscout. Multi-chain support requires separate chain-specific authority adapters and tests.

## Local verification

```bash
python -m pytest
cd frontend
npm install
npm run build
```

## Deployment

Current StudioNet deployment:

- Contract: [`0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2`](https://explorer-studio.genlayer.com/address/0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2)
- Source release: repository commit `0ce6a39` plus the pinned E2E fixtures at `ce687604bf8972d8e8ef8fdb286b26f56a16772e`
- Status: three live semantic branches and settlement paths verified; see [E2E record](verification/studionet-e2e.md).

Superseded deployment: `0xC9C416776A42676Ecd8b462465705c0834081678` used the wrong Ethereum receipt side for Safe runtime binding and is not the submission address.

The current address is the frontend default. A reviewer may replace it in the visible contract bar; the UI persists that explicit selection locally and links it to Explorer.

## Reviewer quick path

1. Connect a StudioNet wallet and register a policy with a positive bond.
2. Authenticate the exact commit-pinned policy bytes.
3. Switch to a second wallet.
4. Open an incident for the registered Safe using an actual Safe transaction hash and an equal bond.
5. Freeze evidence. Confirm both Safe and Blockscout observations were required.
6. Assess the incident and wait for `FINALIZED`.
7. Switch to the selected recipient and claim settlement, or let both parties claim split refunds for `INCONCLUSIVE`.
8. Confirm every UI status against contract readback and the linked Explorer transaction.

See [docs/TEST_RESOURCE_MANIFEST.md](docs/TEST_RESOURCE_MANIFEST.md) and [verification/RELEASE_CHECKLIST.md](verification/RELEASE_CHECKLIST.md) before making evidence claims.

The live two-wallet E2E record for the current deployment is [here](verification/studionet-e2e.md), with machine-readable transaction/readback data in [studionet-e2e.json](verification/studionet-e2e.json).

