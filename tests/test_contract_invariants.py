from pathlib import Path

SOURCE = (Path(__file__).parents[1] / "contracts" / "SafeSpendInquest.py").read_text(encoding="utf-8")


def segment(name: str) -> str:
    start = SOURCE.index(f"def {name}(")
    next_def = SOURCE.find("\n    def ", start + 8)
    return SOURCE[start:] if next_def < 0 else SOURCE[start:next_def]


def test_native_transfer_target_is_an_evm_interface_not_a_nested_contract():
    assert "@gl.evm.contract_interface\nclass _Recipient:" in SOURCE
    assert "class _Recipient(gl.Contract)" not in SOURCE


def test_runtime_claim_requires_two_independent_authorities():
    freeze = segment("_runtime_evidence")
    assert "safe-transaction-mainnet.safe.global" in freeze
    assert "eth.blockscout.com/api/v2/transactions/" in freeze
    assert 'isExecuted") is not True' in freeze
    assert 'receipt.get("status"' in freeze
    assert 'receipt.get("to", {}).get("hash"' in freeze
    assert 'receipt.get("from", {}).get("hash"' not in freeze


def test_policy_content_is_bound_to_github_objects_and_bytes():
    verify = segment("_verified_policy")
    for required in ["/git/commits/", "?recursive=1", "_blob_sha1", "hashlib.sha256"]:
        assert required in verify


def test_roles_are_sender_bound_and_deployer_has_no_business_override():
    opened = segment("open_incident")
    assert 'self._actor() == policy["sponsor"]' in opened
    assert "gl.message.sender_address" in SOURCE
    assert "self.owner" not in SOURCE
    assert "admin" not in SOURCE.lower()


def test_positive_verdict_is_unreachable_before_both_sources_are_frozen():
    assess = segment("assess_incident")
    assert 'incident["state"] != "EVIDENCE_FROZEN"' in assess
    assert 'self.evidence["POLICY:"' in assess
    assert 'self.evidence["RUNTIME:"' in assess
    assert "prompt_comparative" in assess


def test_bond_validation_precedes_object_creation():
    register = segment("register_policy")
    opened = segment("open_incident")
    assert register.index("POSITIVE_SPONSOR_BOND_REQUIRED") < register.index("self.policies[")
    assert opened.index("REPORTER_BOND_MUST_MATCH_SPONSOR_BOND") < opened.index("self.incidents[")


def test_a_policy_bond_can_back_exactly_one_incident():
    opened = segment("open_incident")
    assert 'policy["state"] != "ACTIVE"' in opened
    assert 'policy["state"] = "IN_REVIEW"' in opened
    assert 'self.policies[str(int(policy_id))]' in opened


def test_settlement_is_sender_bound_single_use_and_finalized_transfer():
    claim = segment("claim_settlement")
    assert 'incident["state"] != "ASSESSMENT_FINAL"' in claim
    assert 'self._actor() != incident["settlement_recipient"]' in claim
    assert 'incident["state"] = "SETTLED"' in claim
    assert 'emit_transfer(value=amount, on="finalized")' in claim
    assert 'policy["state"] = "CLOSED"' in claim


def test_inconclusive_never_selects_a_winner():
    assess = segment("assess_incident")
    claim = segment("claim_settlement")
    assert 'recipient, amount = "", 0' in assess
    assert 'incident["verdict"] == "INCONCLUSIVE"' in claim
    refund = segment("claim_split_refund")
    assert 'incident["verdict"] != "INCONCLUSIVE"' in refund
    assert 'incident["reporter_refunded"] and incident["sponsor_refunded"]' in refund

