# Architecture

## Proof obligation

For policy epoch `P` and Safe transaction object `S`, establish whether the **successfully executed Ethereum transaction** mapped by `S` is clearly authorized, clearly forbidden, or not resolvable under the exact policy bytes committed by `P`.

### Falsifiers

- Policy blob, tree, repository or commit does not match the commitment.
- Safe transaction belongs to a different Safe.
- Safe transaction is not executed or lacks a mapped Ethereum hash.
- Blockscout does not report the mapped hash successful.
- Runtime receipt target is not the registered Safe. The outer sender is an executor EOA/relayer and is not treated as the Safe identity.
- Policy is ambiguous about a consequential recipient, action or value.

Any deterministic binding failure stops before semantic adjudication. Source unavailability is `RUNTIME_UNVERIFIED` or `SOURCE_UNVERIFIED`, never `BREACH`.

## Consensus boundary

`strict_eq` is used only for deterministic acquisition snapshots. Semantic assessment uses `prompt_comparative`; consequential `verdict` and `reason_code` must agree exactly, while prose is excluded from state.

## Anti-clone properties

- Two-source runtime reconciliation, not a repository-only artifact review.
- Equal two-sided bond and outcome-directed settlement, not a compiled permit.
- Evidence freeze creates an immutable incident snapshot before judgment.
- No deployer admin or privileged tester role.
- Forensic split-pane interface rather than the prior stepper/card workflow.

## Known boundary

The sponsor's wallet declares a policy for a Safe but this release does not prove the wallet is an owner of that Safe. Therefore the product says **sponsor-declared policy**, not official DAO policy. A future official-authority claim requires Safe-owner signature verification bound to policy digest and version.

