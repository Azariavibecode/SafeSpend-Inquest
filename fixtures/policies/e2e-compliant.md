## POLICY E2E-COMPLIANT-001

For this controlled E2E review, the sponsor explicitly permits one ordinary call (`operation = 0`) to the USDC token contract `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` with zero native ETH value and calldata exactly equal to:

`0xa9059cbb0000000000000000000000000c8e870a6b4f728932196ddd3050f3e953b2fb4d0000000000000000000000000000000000000000000000000000004843321140`

That exact action is authorized as a treasury payment. No other recipient, target, value, operation, or calldata is authorized by this fixture.

This is synthetic sponsor-declared test policy. It demonstrates protocol behavior only and does not assert the official policy of the referenced Safe or DAO.
