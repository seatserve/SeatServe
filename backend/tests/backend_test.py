"""Backend API tests for CineBites QR-based in-seat food ordering system."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- Health -----
def test_root_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "CineBites API live"


# ----- Theater info -----
def test_theater_info(session):
    r = session.get(f"{API}/theater-info", params={"screen": "2", "seat": "B12"})
    assert r.status_code == 200
    data = r.json()
    assert data["theater"] == "AMB Cinemas"
    assert data["screen"] == "2"
    assert data["seat"] == "B12"


# ----- Menu -----
def test_menu_returns_12_items_no_id_leak(session):
    r = session.get(f"{API}/menu")
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) == 12
    cats = {i["category"] for i in items}
    assert cats == {"Popcorn", "Beverages", "Snacks", "Combos"}
    for i in items:
        assert "_id" not in i
        assert "id" in i and "name" in i and "price" in i


# ----- Orders -----
@pytest.fixture(scope="module")
def sample_payload():
    return {
        "theater": "AMB Cinemas",
        "screen": "2",
        "seat": "B12",
        "items": [
            {"item_id": "pop-classic", "name": "Classic Salted Popcorn", "price": 249, "quantity": 2, "image": "https://example.com/img.jpg"}
        ],
        "payment_method": "upi",
        "total": 523.0,
    }


@pytest.fixture(scope="module")
def created_order(session, sample_payload):
    r = session.post(f"{API}/orders", json=sample_payload)
    assert r.status_code == 200, r.text
    return r.json()


def test_create_order(created_order, sample_payload):
    assert "id" in created_order
    assert "short_id" in created_order and len(created_order["short_id"]) == 6
    assert created_order["status"] == "preparing"
    assert created_order["seat"] == sample_payload["seat"]
    assert created_order["screen"] == sample_payload["screen"]
    assert len(created_order["items"]) == 1
    assert created_order["items"][0]["item_id"] == "pop-classic"


def test_create_order_empty_items_400(session, sample_payload):
    payload = dict(sample_payload)
    payload["items"] = []
    r = session.post(f"{API}/orders", json=payload)
    assert r.status_code == 400


def test_list_orders_no_id_leak(session, created_order):
    r = session.get(f"{API}/orders")
    assert r.status_code == 200
    orders = r.json()
    assert isinstance(orders, list) and len(orders) >= 1
    for o in orders:
        assert "_id" not in o
    # newest first => created_order should be present near top
    ids = [o["id"] for o in orders]
    assert created_order["id"] in ids


def test_get_order_by_id(session, created_order):
    r = session.get(f"{API}/orders/{created_order['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created_order["id"]


def test_get_order_unknown_404(session):
    r = session.get(f"{API}/orders/nonexistent-id-xyz")
    assert r.status_code == 404


def test_update_status_flow(session, created_order):
    oid = created_order["id"]
    r1 = session.patch(f"{API}/orders/{oid}/status", json={"status": "out_for_delivery"})
    assert r1.status_code == 200
    assert r1.json()["status"] == "out_for_delivery"

    r2 = session.patch(f"{API}/orders/{oid}/status", json={"status": "delivered"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "delivered"

    # Persist check
    r3 = session.get(f"{API}/orders/{oid}")
    assert r3.json()["status"] == "delivered"


def test_update_status_invalid_id_404(session):
    r = session.patch(f"{API}/orders/bad-id-zzz/status", json={"status": "delivered"})
    assert r.status_code == 404
