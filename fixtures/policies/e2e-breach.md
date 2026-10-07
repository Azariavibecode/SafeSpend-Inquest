## POLICY E2E-BREACH-001

The sponsor expressly forbids every call to target `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`, including ERC-20 transfers whose calldata begins with selector `0xa9059cbb`. Any transaction matching that target or selector is a material `ACTION_FORBIDDEN` breach, regardless of amount or recipient.

This is synthetic sponsor-declared test policy. It demonstrates protocol behavior only and does not assert the official policy of the referenced Safe or DAO.
