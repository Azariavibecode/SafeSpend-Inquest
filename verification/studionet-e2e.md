# StudioNet E2E record

- Contract: [`0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2`](https://explorer-studio.genlayer.com/address/0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2)
- Run date: 2026-10-07 UTC
- Chain: StudioNet, chain ID 61999
- Business actors: secondary wallets `0x67A1A08Fc4cf7D05c859d0d3D8398a3A30B1677e` and `0x7C87B10a3d43F3b3551414401F8b26B9F662bAB5`
- Safe evidence object: `0xEc834bD1F492a8Bd5aa71023550C44D4fB14632A`
- Expected results were committed in policy fixtures before the live run at commit `ce687604bf8972d8e8ef8fdb286b26f56a16772e`.

## Results

| Case | Expected | Readback | Settlement | Result |
|---|---|---|---|---|
| Compliant policy | `COMPLIANT` | `COMPLIANT / PURPOSE_ALLOWED` | Sponsor claimed; incident/policy terminal | Pass after one consensus disagreement/retry |
| Forbids USDC target | `BREACH` | `BREACH / ACTION_FORBIDDEN` | Reporter claimed; incident/policy terminal | Pass after two consensus disagreements/retries |
| Ambiguous policy | `INCONCLUSIVE` | `INCONCLUSIVE / POLICY_AMBIGUOUS` | Sponsor and reporter each claimed their own bond | Pass after one consensus disagreement/retry |

All 3 policies and incidents ended `CLOSED` / `SETTLED`. Final counters: 3 policies, 3 incidents, 3 assessments, 3 settlements; total liability is `0`.

The consensus disagreements remained `EVIDENCE_FROZEN`; no verdict, recipient, or payout was written by those transactions. Each case later reached `MAJORITY_AGREE` on a subsequent permissionless assessment. The number of retries is included in the JSON record and must not be omitted from reviewer evidence.

Adversarial checks included same-wallet role separation, duplicate Safe transaction replay, wrong settlement claimant, and double settlement claim. Each rejected path preserved relevant counters/liability or terminal incident readback. The final double-claim transaction is [`0x759a4fbe456c68853d293a78dd4c90d6125500be092b846b7ee249d1310b4579`](https://explorer-studio.genlayer.com/transactions/0x759a4fbe456c68853d293a78dd4c90d6125500be092b846b7ee249d1310b4579); pre/post incident and counter values were identical.

## Live evidence scope

The three policy files are synthetic sponsor declarations and prove protocol branches only. Runtime facts came from the Safe Transaction Service and Ethereum Blockscout. One exercised Safe transaction was:

- Safe transaction: [`0x412389dabbc92c5ae61d7869b96522c105e1e841893764ddd922f73c9e99e9dc`](https://safe-transaction-mainnet.safe.global/api/v1/multisig-transactions/0x412389dabbc92c5ae61d7869b96522c105e1e841893764ddd922f73c9e99e9dc/)
- Mapped runtime transaction: [`0x5babd1f0753cb63575ffc168b473f24af8d64aa2503c0e970a9e1cc7bf4d71e2`](https://eth.blockscout.com/tx/0x5babd1f0753cb63575ffc168b473f24af8d64aa2503c0e970a9e1cc7bf4d71e2)

The complete transaction hashes, expected outcomes, policy digests, all retry outcomes and final readbacks are in [studionet-e2e.json](studionet-e2e.json). These results demonstrate StudioNet behavior with public Ethereum evidence; they do not claim an official DAO adopted the synthetic policies or production security certification.
