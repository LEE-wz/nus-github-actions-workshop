import pytest
from app.main import app, scores


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        scores.clear()
        yield c


def test_index_returns_html(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Octocat" in resp.data


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "healthy"}


def test_submit_score(client):
    resp = client.post("/api/scores", json={"name": "Mona", "score": 42})
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["name"] == "Mona"
    assert body["score"] == 42


def test_get_scores_empty(client):
    resp = client.get("/api/scores")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_scores_sorted(client):
    client.post("/api/scores", json={"name": "A", "score": 10})
    client.post("/api/scores", json={"name": "B", "score": 50})
    client.post("/api/scores", json={"name": "C", "score": 30})
    resp = client.get("/api/scores")
    data = resp.get_json()
    assert data[0]["name"] == "B"
    assert data[1]["name"] == "C"
    assert data[2]["name"] == "A"


def test_scores_capped_at_ten(client):
    for i in range(15):
        client.post("/api/scores", json={"name": f"P{i}", "score": i})
    resp = client.get("/api/scores")
    assert len(resp.get_json()) == 10


def test_reject_missing_name(client):
    resp = client.post("/api/scores", json={"score": 10})
    assert resp.status_code == 400


def test_reject_missing_score(client):
    resp = client.post("/api/scores", json={"name": "X"})
    assert resp.status_code == 400


def test_reject_negative_score(client):
    resp = client.post("/api/scores", json={"name": "X", "score": -5})
    assert resp.status_code == 400


def test_reject_non_numeric_score(client):
    resp = client.post("/api/scores", json={"name": "X", "score": "abc"})
    assert resp.status_code == 400


def test_name_truncated_to_20_chars(client):
    resp = client.post("/api/scores", json={"name": "A" * 50, "score": 1})
    assert resp.status_code == 201
    assert len(resp.get_json()["name"]) == 20


def test_reject_empty_json(client):
    resp = client.post("/api/scores", json={})
    assert resp.status_code == 400
