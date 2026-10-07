# Test Resource Manifest

Complete this document with exact immutable values **before** live execution.

| Resource | Authority / owner | Claim scope | Immutable binding | Beneficiary-controlled? | Limitation |
|---|---|---|---|---:|---|
| Policy fixture | Azariavibecode | exact declared policy bytes | `Azariavibecode/SafeSpend-Inquest` @ `f7e086259ba0244f6bca660215f3f37eefe4aff3`, `/fixtures/policies/example-policy.md`, SHA-256 `ecf0c00801af162466e18536f5fc6f298133f96034a1c62552864f271a2269d1` | yes | cannot prove official Safe policy or runtime behavior |
| Safe tx endpoint | Safe Transaction Service | Safe tx object, Safe identity, mapped tx hash, `isExecuted` | exact Safe tx hash | no | cannot alone prove successful chain receipt |
| Runtime endpoint | Ethereum Blockscout | mapped transaction hash, sender and success | exact Ethereum tx hash | no | cannot interpret policy compliance |
| StudioNet Explorer | GenLayer network | contract call finality and deployed state | contract address + transaction hash | no | testnet behavior, not production readiness |

## Planned live matrix

Record the expected result before each run.

| Scenario | Policy source | Safe tx hash | Wallet | Expected | Evidence claim |
|---|---|---|---|---|---|
| compliant | TBD | TBD | secondary A/B | `COMPLIANT` | live semantic branch |
| breach | TBD | TBD | secondary A/B | `BREACH` | live semantic branch |
| ambiguous | TBD | TBD | secondary A/B | `INCONCLUSIVE` | fail-closed branch |
| wrong Safe | same policy | tx from another Safe | secondary B | `RUNTIME_UNVERIFIED` | object binding rejection |
| duplicate tx | same inputs | already registered | secondary B | rollback | replay rejection/no mutation |
| wrong digest | mutated descriptor | N/A | secondary A | `SOURCE_UNVERIFIED` | content commitment rejection |

Synthetic policy text demonstrates protocol behavior only. It must never be presented as proof that a real DAO adopted the policy.

