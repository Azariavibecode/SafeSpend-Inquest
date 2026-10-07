import pytest


class Model:
    def __init__(self):
        self.policies = []
        self.incidents = []
        self.liability = 0

    def policy(self, sponsor, bond):
        if bond <= 0:
            raise ValueError("bond")
        self.policies.append({"sponsor": sponsor, "bond": bond, "state": "DRAFT"})
        self.liability += bond
        return len(self.policies) - 1

    def activate(self, pid, source_ok):
        if self.policies[pid]["state"] != "DRAFT" or not source_ok:
            return False
        self.policies[pid]["state"] = "ACTIVE"
        return True

    def incident(self, pid, reporter, bond, tx):
        p = self.policies[pid]
        if p["state"] != "ACTIVE" or reporter == p["sponsor"] or bond != p["bond"]:
            raise ValueError("invalid")
        if any(i["tx"] == tx for i in self.incidents):
            raise ValueError("replay")
        self.incidents.append({"pid": pid, "reporter": reporter, "bond": bond, "tx": tx, "state": "OPEN", "winner": None})
        self.liability += bond
        return len(self.incidents) - 1

    def freeze(self, iid, safe_ok, runtime_ok):
        if self.incidents[iid]["state"] != "OPEN" or not (safe_ok and runtime_ok):
            return False
        self.incidents[iid]["state"] = "EVIDENCE_FROZEN"
        return True

    def assess(self, iid, verdict):
        i = self.incidents[iid]
        if i["state"] != "EVIDENCE_FROZEN":
            raise ValueError("phase")
        p = self.policies[i["pid"]]
        i["state"] = "ASSESSMENT_FINAL"
        i["winner"] = i["reporter"] if verdict == "BREACH" else p["sponsor"] if verdict == "COMPLIANT" else None


def ready():
    m = Model(); p = m.policy("sponsor", 10); assert m.activate(p, True); return m, p


def test_happy_breach_routes_combined_bonds_to_reporter():
    m, p = ready(); i = m.incident(p, "reporter", 10, "tx1")
    assert m.freeze(i, True, True); m.assess(i, "BREACH")
    assert m.incidents[i]["winner"] == "reporter" and m.liability == 20


def test_compliant_routes_combined_bonds_to_sponsor():
    m, p = ready(); i = m.incident(p, "reporter", 10, "tx2")
    assert m.freeze(i, True, True); m.assess(i, "COMPLIANT")
    assert m.incidents[i]["winner"] == "sponsor"


def test_conflict_has_no_winner_and_cannot_be_presented_as_breach():
    m, p = ready(); i = m.incident(p, "reporter", 10, "tx3")
    m.freeze(i, True, True); m.assess(i, "INCONCLUSIVE")
    assert m.incidents[i]["winner"] is None


@pytest.mark.parametrize("safe_ok,runtime_ok", [(False, True), (True, False), (False, False)])
def test_missing_authority_fails_closed_without_mutation(safe_ok, runtime_ok):
    m, p = ready(); i = m.incident(p, "reporter", 10, "tx4")
    before = m.incidents[i].copy()
    assert not m.freeze(i, safe_ok, runtime_ok)
    assert m.incidents[i] == before


def test_role_conflict_and_replay_are_rejected():
    m, p = ready()
    with pytest.raises(ValueError): m.incident(p, "sponsor", 10, "tx5")
    m.incident(p, "reporter", 10, "tx5")
    with pytest.raises(ValueError): m.incident(p, "other", 10, "tx5")

