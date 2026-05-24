from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import (
    hash_password, verify_password, create_token, decode_token, require_roles,
)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="CineBites SaaS API")
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
OrderStatus = Literal["preparing", "out_for_delivery", "delivered"]


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    return s or uuid.uuid4().hex[:6]


# --- Users (super_admin / owner) ---
class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class StaffLoginRequest(BaseModel):
    slug: str
    pin: str


class UserPublic(BaseModel):
    id: str
    email: str
    role: str
    multiplex_id: Optional[str] = None
    multiplex_slug: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


# --- Multiplex ---
class MultiplexCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    logo: Optional[str] = None
    primary_color: str = "#E50914"
    staff_pin: str = "1234"
    owner_email: EmailStr
    owner_username: str
    owner_password: str
    owner_name: Optional[str] = None
    minimum_order_value: float = 150.0
    screens: List[dict] = []


class Multiplex(BaseModel):
    id: str
    slug: str
    name: str
    logo: Optional[str] = None
    primary_color: str = "#E50914"
    staff_pin: str
    owner_email: str
    owner_username: str
    created_at: str
    minimum_order_value: float = 150.0
    screens: List[dict] = []


class MultiplexPublic(BaseModel):
    id: str
    slug: str
    name: str
    logo: Optional[str] = None
    primary_color: str = "#E50914"
    minimum_order_value: float = 150.0
    screens: List[dict] = []


class MultiplexSummary(BaseModel):
    id: str
    slug: str
    name: str
    logo: Optional[str] = None
    primary_color: str = "#E50914"
    owner_email: str
    owner_username: Optional[str] = None
    total_orders: int
    total_revenue: float
    menu_items: int
    created_at: str
    minimum_order_value: float = 150.0


# --- Menu ---
class MenuItem(BaseModel):
    id: str
    multiplex_id: str
    name: str
    description: str = ""
    price: float
    category: str
    image: str
    is_available: bool = True
    stock_count: Optional[int] = None


class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str
    image: str
    is_available: bool = True
    stock_count: Optional[int] = None


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    is_available: Optional[bool] = None
    stock_count: Optional[int] = None


# --- Orders ---
class CartItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    image: str


class OrderCreate(BaseModel):
    screen: str
    seat: str
    additional_seats: Optional[List[str]] = []
    items: List[CartItem]
    payment_method: Literal["upi", "card"]
    total: float
    notes: Optional[str] = ""


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    short_id: str
    multiplex_id: str
    multiplex_slug: str
    theater: str
    screen: str
    seat: str
    additional_seats: List[str] = []
    items: List[CartItem]
    payment_method: str
    total: float
    status: OrderStatus = "preparing"
    payment_status: str = "pending"
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    eta_minutes: int = 10


class StatusUpdate(BaseModel):
    status: OrderStatus


# ---------- Seed ----------
DEFAULT_MENU = [
    {"name": "Classic Salted Popcorn", "description": "Freshly popped, lightly salted.", "price": 249, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Caramel Crunch Popcorn", "description": "Golden caramel coated kernels.", "price": 299, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Cheddar Cheese Popcorn", "description": "Aged cheddar dust.", "price": 319, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Chilled Cola", "description": "Ice-cold classic cola, 500ml.", "price": 149, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"name": "Sparkling Lemonade", "description": "Fresh lime fizz, 500ml.", "price": 169, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"name": "Iced Mocha Coffee", "description": "Cold brew with chocolate swirl.", "price": 229, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"name": "Loaded Nachos", "description": "Crispy tortillas, cheese, jalapeños.", "price": 349, "category": "Snacks", "image": "https://images.pexels.com/photos/29851128/pexels-photo-29851128.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Gourmet Cheese Burger", "description": "Juicy patty, molten cheese.", "price": 429, "category": "Snacks", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Truffle Parm Fries", "description": "Crispy fries, truffle oil, parmesan.", "price": 279, "category": "Snacks", "image": "https://images.pexels.com/photos/29851128/pexels-photo-29851128.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Movie Duo Combo", "description": "Large popcorn + 2 colas.", "price": 549, "category": "Combos", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Family Feast Combo", "description": "Popcorn, nachos, burger & 3 drinks.", "price": 1199, "category": "Combos", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Solo Premiere Combo", "description": "Medium popcorn + burger + cola.", "price": 699, "category": "Combos", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
]


async def seed_super_admin():
    email = os.environ.get("SUPER_ADMIN_EMAIL", "owner@cinebites.in").lower()
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "owner123")
    existing = await db.users.find_one({"email": email, "role": "super_admin"})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "role": "super_admin",
            "name": "Super Admin",
            "multiplex_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logging.info("Seeded super-admin %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email, "role": "super_admin"},
            {"$set": {"password_hash": hash_password(password)}},
        )
        logging.info("Rotated super-admin password")


async def seed_default_multiplex():
    # Clean up pre-multi-tenant orphan docs that lack multiplex_id (from older schema)
    await db.menu.delete_many({"multiplex_id": {"$exists": False}})
    await db.orders.delete_many({"multiplex_id": {"$exists": False}})

    if await db.multiplexes.find_one({"slug": "amb-cinemas"}):
        return
    mid = str(uuid.uuid4())
    await db.multiplexes.insert_one({
        "id": mid,
        "slug": "amb-cinemas",
        "name": "AMB Cinemas",
        "logo": None,
        "primary_color": "#E50914",
        "staff_pin": "1234",
        "owner_email": "manager@amb.in",
        "owner_username": "amb",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "minimum_order_value": 150.0,
        "screens": [
            {
                "name": "Screen 1",
                "seats": [f"A{i}" for i in range(1, 21)]
            }
        ]
    })
    # seed owner
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "manager@amb.in",
        "username": "amb",
        "password_hash": hash_password("amb123"),
        "role": "owner",
        "name": "AMB Manager",
        "multiplex_id": mid,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # seed menu scoped to this multiplex
    docs = [{"id": uuid.uuid4().hex[:10], "multiplex_id": mid, "is_available": True, "stock_count": None, **m} for m in DEFAULT_MENU]
    await db.menu.insert_many(docs)
    logging.info("Seeded default multiplex amb-cinemas with %d items", len(docs))


async def seed_apsara_multiplex():
    if await db.multiplexes.find_one({"slug": "apsara-4k-dts"}):
        return
    mid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    seats = [f"A{i}" for i in range(1, 21)]
    await db.multiplexes.insert_one({
        "id": mid,
        "slug": "apsara-4k-dts",
        "name": "Apsara 4K DTS",
        "logo": None,
        "primary_color": "#E50914",
        "staff_pin": "1234",
        "owner_email": "apsara@seatserve.com",
        "owner_username": "apsara",
        "created_at": now,
        "minimum_order_value": 150.0,
        "screens": [
            {
                "name": "Screen 1",
                "seats": seats
            }
        ]
    })
    # seed owner user
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "apsara@seatserve.com",
        "username": "apsara",
        "password_hash": hash_password("apsara.123"),
        "role": "owner",
        "name": "Apsara Admin",
        "multiplex_id": mid,
        "created_at": now,
    })
    # seed menu scoped to this multiplex
    docs = [{"id": uuid.uuid4().hex[:10], "multiplex_id": mid, "is_available": True, "stock_count": None, **m} for m in DEFAULT_MENU]
    await db.menu.insert_many(docs)
    logging.info("Seeded primary reference multiplex Apsara 4K DTS")


@app.on_event("startup")
async def startup():
    await db.users.create_index([("email", 1), ("role", 1)], unique=True)
    await db.users.create_index("username", unique=True, sparse=True)
    await db.multiplexes.create_index("slug", unique=True)
    await db.menu.create_index("multiplex_id")
    await db.orders.create_index("multiplex_id")
    await seed_super_admin()
    await seed_default_multiplex()
    await seed_apsara_multiplex()


# ---------- Helpers ----------
async def load_multiplex(slug: str) -> dict:
    m = await db.multiplexes.find_one({"slug": slug}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Multiplex not found")
    return m


def ensure_multiplex_scope(payload: dict, multiplex_id: str):
    """For owner actions — they can only touch their own multiplex."""
    if payload.get("role") == "super_admin":
        return
    if payload.get("multiplex_id") != multiplex_id:
        raise HTTPException(status_code=403, detail="Scope mismatch")


# ---------- AUTH ----------
@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    login_str = req.username_or_email.strip().lower()
    user = await db.users.find_one({
        "$or": [
            {"email": login_str},
            {"username": login_str}
        ]
    }, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    slug = None
    if user.get("multiplex_id"):
        mx = await db.multiplexes.find_one({"id": user["multiplex_id"]}, {"_id": 0})
        slug = mx["slug"] if mx else None

    token = create_token(sub=user["id"], role=user["role"], multiplex_id=user.get("multiplex_id"), email=user["email"])
    return AuthResponse(
        token=token,
        user=UserPublic(
            id=user["id"], email=user["email"], role=user["role"],
            multiplex_id=user.get("multiplex_id"), multiplex_slug=slug, name=user.get("name"),
            username=user.get("username")
        ),
    )


@api_router.post("/auth/staff-login", response_model=AuthResponse)
async def staff_login(req: StaffLoginRequest):
    mx = await db.multiplexes.find_one({"slug": req.slug}, {"_id": 0})
    if not mx or mx.get("staff_pin") != req.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    token = create_token(sub=f"staff:{mx['id']}", role="staff", multiplex_id=mx["id"])
    return AuthResponse(
        token=token,
        user=UserPublic(id=f"staff:{mx['id']}", email="staff@" + mx["slug"], role="staff",
                        multiplex_id=mx["id"], multiplex_slug=mx["slug"], name=f"{mx['name']} Staff"),
    )


@api_router.get("/auth/me", response_model=UserPublic)
async def me(payload: dict = Depends(require_roles("super_admin", "owner", "staff"))):
    if payload["role"] == "staff":
        mx = await db.multiplexes.find_one({"id": payload["multiplex_id"]}, {"_id": 0})
        return UserPublic(id=payload["sub"], email=payload.get("email") or "staff", role="staff",
                          multiplex_id=payload["multiplex_id"],
                          multiplex_slug=mx["slug"] if mx else None,
                          name=(mx["name"] + " Staff") if mx else "Staff")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    slug = None
    if user.get("multiplex_id"):
        mx = await db.multiplexes.find_one({"id": user["multiplex_id"]}, {"_id": 0})
        slug = mx["slug"] if mx else None
    return UserPublic(id=user["id"], email=user["email"], role=user["role"],
                      multiplex_id=user.get("multiplex_id"), multiplex_slug=slug, name=user.get("name"),
                      username=user.get("username"))


# ---------- SUPER ADMIN: multiplex CRUD ----------
@api_router.get("/super-admin/multiplexes", response_model=List[MultiplexSummary])
async def list_multiplexes(_: dict = Depends(require_roles("super_admin"))):
    out = []
    async for mx in db.multiplexes.find({}, {"_id": 0}).sort("created_at", -1):
        pipeline = [
            {"$match": {"multiplex_id": mx["id"]}},
            {"$group": {"_id": None, "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
        ]
        agg = await db.orders.aggregate(pipeline).to_list(1)
        stats = agg[0] if agg else {"count": 0, "revenue": 0}
        menu_count = await db.menu.count_documents({"multiplex_id": mx["id"]})
        out.append(MultiplexSummary(
            id=mx["id"], slug=mx["slug"], name=mx["name"],
            logo=mx.get("logo"), primary_color=mx.get("primary_color", "#E50914"),
            owner_email=mx.get("owner_email", ""), owner_username=mx.get("owner_username"),
            total_orders=stats["count"], total_revenue=float(stats["revenue"]),
            menu_items=menu_count, created_at=mx.get("created_at", ""),
            minimum_order_value=mx.get("minimum_order_value", 150.0)
        ))
    return out


@api_router.post("/super-admin/multiplexes", response_model=MultiplexSummary, status_code=201)
async def create_multiplex(req: MultiplexCreate, _: dict = Depends(require_roles("super_admin"))):
    slug = slugify(req.slug or req.name)
    if await db.multiplexes.find_one({"slug": slug}):
        raise HTTPException(status_code=400, detail=f"Slug '{slug}' already taken")
    owner_email = req.owner_email.lower()
    if await db.users.find_one({"email": owner_email, "role": "owner"}):
        raise HTTPException(status_code=400, detail="Owner email already used for another multiplex")
    owner_username = req.owner_username.strip().lower()
    if await db.users.find_one({"username": owner_username}):
        raise HTTPException(status_code=400, detail="Owner username already taken")

    mid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.multiplexes.insert_one({
        "id": mid, "slug": slug, "name": req.name.strip(),
        "logo": req.logo, "primary_color": req.primary_color,
        "staff_pin": req.staff_pin, "owner_email": owner_email, "owner_username": owner_username,
        "minimum_order_value": req.minimum_order_value, "screens": req.screens or [], "created_at": now,
    })
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "email": owner_email, "username": owner_username,
        "password_hash": hash_password(req.owner_password),
        "role": "owner", "name": req.owner_name or req.name + " Owner",
        "multiplex_id": mid, "created_at": now,
    })
    # seed menu for the new multiplex
    docs = [{"id": uuid.uuid4().hex[:10], "multiplex_id": mid, "is_available": True, "stock_count": None, **m} for m in DEFAULT_MENU]
    await db.menu.insert_many(docs)

    return MultiplexSummary(id=mid, slug=slug, name=req.name, logo=req.logo,
                            primary_color=req.primary_color, owner_email=owner_email,
                            owner_username=owner_username,
                            total_orders=0, total_revenue=0, menu_items=len(docs), created_at=now,
                            minimum_order_value=req.minimum_order_value)


@api_router.delete("/super-admin/multiplexes/{slug}")
async def delete_multiplex(slug: str, _: dict = Depends(require_roles("super_admin"))):
    mx = await db.multiplexes.find_one({"slug": slug}, {"_id": 0})
    if not mx:
        raise HTTPException(status_code=404, detail="Multiplex not found")
    await db.multiplexes.delete_one({"id": mx["id"]})
    await db.users.delete_many({"multiplex_id": mx["id"]})
    await db.menu.delete_many({"multiplex_id": mx["id"]})
    await db.orders.delete_many({"multiplex_id": mx["id"]})
    return {"deleted": slug}


# ---------- PUBLIC (by slug) ----------
@api_router.get("/m/{slug}/info", response_model=MultiplexPublic)
async def public_info(slug: str):
    m = await load_multiplex(slug)
    return MultiplexPublic(id=m["id"], slug=m["slug"], name=m["name"],
                           logo=m.get("logo"), primary_color=m.get("primary_color", "#E50914"),
                           minimum_order_value=m.get("minimum_order_value", 150.0),
                           screens=m.get("screens", []))


@api_router.get("/m/{slug}/theater-info")
async def public_theater_info(slug: str, screen: str, seat: str):
    m = await load_multiplex(slug)
    return {"theater": m["name"], "screen": screen, "seat": seat,
            "slug": m["slug"], "primary_color": m.get("primary_color", "#E50914"),
            "logo": m.get("logo"), "minimum_order_value": m.get("minimum_order_value", 150.0),
            "screens": m.get("screens", [])}


@api_router.get("/m/{slug}/menu", response_model=List[MenuItem])
async def public_menu(slug: str):
    m = await load_multiplex(slug)
    items = await db.menu.find({"multiplex_id": m["id"]}, {"_id": 0}).to_list(500)
    return items


@api_router.get("/m/{slug}/categories", response_model=List[str])
async def public_categories(slug: str):
    m = await load_multiplex(slug)
    cats = await db.menu.distinct("category", {"multiplex_id": m["id"]})
    default = ["Popcorn", "Beverages", "Snacks", "Combos"]
    extras = sorted([c for c in cats if c and c not in default])
    ordered = [c for c in default if c in cats] + extras
    return ordered or default


@api_router.post("/m/{slug}/orders", response_model=Order)
async def public_create_order(slug: str, payload: OrderCreate):
    m = await load_multiplex(slug)
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Verify minimum order value (calculated on subtotal of items before tax)
    items_total = sum(i.price * i.quantity for i in payload.items)
    min_val = m.get("minimum_order_value", 150.0)
    if items_total < min_val:
        raise HTTPException(status_code=400, detail=f"Order subtotal (₹{items_total:.0f}) must meet the minimum order value of ₹{min_val:.0f}")

    for ci in payload.items:
        menu_item = await db.menu.find_one({"id": ci.item_id, "multiplex_id": m["id"]}, {"_id": 0})
        if not menu_item:
            raise HTTPException(status_code=400, detail=f"Item no longer on menu")
        if not menu_item.get("is_available", True):
            raise HTTPException(status_code=400, detail=f"{menu_item['name']} is sold out")
        stock = menu_item.get("stock_count")
        if stock is not None and stock < ci.quantity:
            raise HTTPException(status_code=400, detail=f"Only {stock} × {menu_item['name']} left")

    order = Order(
        short_id=uuid.uuid4().hex[:6].upper(),
        multiplex_id=m["id"], multiplex_slug=m["slug"],
        theater=m["name"], screen=payload.screen, seat=payload.seat,
        additional_seats=payload.additional_seats or [],
        items=payload.items, payment_method=payload.payment_method,
        total=payload.total, notes=(payload.notes or "").strip()[:500],
        payment_status="pending"
    )
    doc = order.model_dump()
    doc["items"] = [i.model_dump() if hasattr(i, "model_dump") else i for i in doc["items"]]
    await db.orders.insert_one(doc)

    for ci in payload.items:
        menu_item = await db.menu.find_one({"id": ci.item_id, "multiplex_id": m["id"]}, {"_id": 0})
        if menu_item and menu_item.get("stock_count") is not None:
            new_stock = max(0, menu_item["stock_count"] - ci.quantity)
            update = {"stock_count": new_stock}
            if new_stock == 0:
                update["is_available"] = False
            await db.menu.update_one({"id": ci.item_id}, {"$set": update})

    return order


@api_router.get("/m/{slug}/orders/{order_id}", response_model=Order)
async def public_get_order(slug: str, order_id: str):
    m = await load_multiplex(slug)
    o = await db.orders.find_one({"id": order_id, "multiplex_id": m["id"]}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@api_router.post("/m/{slug}/orders/{order_id}/pay", response_model=Order)
async def pay_order(slug: str, order_id: str):
    m = await load_multiplex(slug)
    o = await db.orders.find_one({"id": order_id, "multiplex_id": m["id"]}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Mark as paid in database
    result = await db.orders.find_one_and_update(
        {"id": order_id, "multiplex_id": m["id"]},
        {"$set": {"payment_status": "paid"}},
        return_document=True, projection={"_id": 0}
    )
    return result


# ---------- SCOPED AUTH (owner + staff) ----------
async def scope_require(slug: str, payload: dict):
    m = await load_multiplex(slug)
    if payload["role"] != "super_admin" and payload.get("multiplex_id") != m["id"]:
        raise HTTPException(status_code=403, detail="Scope mismatch")
    return m


@api_router.get("/m/{slug}/orders", response_model=List[Order])
async def list_orders(slug: str, payload: dict = Depends(require_roles("owner", "staff", "super_admin"))):
    m = await scope_require(slug, payload)
    
    if payload.get("role") == "staff":
        # Staff console (kitchen) only sees paid orders!
        orders = await db.orders.find({"multiplex_id": m["id"], "payment_status": "paid"}).sort("created_at", -1).to_list(500)
    else:
        # Owner/SuperAdmin can see all orders centrally
        orders = await db.orders.find({"multiplex_id": m["id"]}).sort("created_at", -1).to_list(500)
    return orders


@api_router.get("/m/{slug}/settings")
async def get_multiplex_settings(slug: str, payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    return m


@api_router.patch("/m/{slug}/settings")
async def update_multiplex_settings(slug: str, body: dict, payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    updatable = ["name", "logo", "primary_color", "staff_pin", "minimum_order_value", "screens"]
    updates = {k: v for k, v in body.items() if k in updatable}
    if "minimum_order_value" in updates:
        try:
            updates["minimum_order_value"] = float(updates["minimum_order_value"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid minimum order value")
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.multiplexes.find_one_and_update(
        {"id": m["id"]},
        {"$set": updates},
        return_document=True, projection={"_id": 0}
    )
    return result


@api_router.patch("/m/{slug}/orders/{order_id}/status", response_model=Order)
async def update_order_status(slug: str, order_id: str, body: StatusUpdate,
                              payload: dict = Depends(require_roles("owner", "staff", "super_admin"))):
    m = await scope_require(slug, payload)
    result = await db.orders.find_one_and_update(
        {"id": order_id, "multiplex_id": m["id"]},
        {"$set": {"status": body.status}},
        return_document=True, projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


# Owner-only inventory
@api_router.post("/m/{slug}/menu", response_model=MenuItem, status_code=201)
async def create_menu_item(slug: str, body: MenuItemCreate,
                           payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    item = MenuItem(id=uuid.uuid4().hex[:10], multiplex_id=m["id"], **body.model_dump())
    await db.menu.insert_one(item.model_dump())
    return item


@api_router.patch("/m/{slug}/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(slug: str, item_id: str, body: MenuItemUpdate,
                           payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.menu.find_one_and_update(
        {"id": item_id, "multiplex_id": m["id"]},
        {"$set": updates}, return_document=True, projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return result


@api_router.delete("/m/{slug}/menu/{item_id}")
async def delete_menu_item(slug: str, item_id: str,
                           payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    result = await db.menu.delete_one({"id": item_id, "multiplex_id": m["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"deleted": item_id}


# Owner sales analytics
@api_router.get("/m/{slug}/sales")
async def sales_summary(slug: str, payload: dict = Depends(require_roles("owner", "super_admin"))):
    m = await scope_require(slug, payload)
    now = datetime.now(timezone.utc)
    today_iso = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_iso = (now - timedelta(days=7)).isoformat()

    async def _stats(match):
        pipeline = [
            {"$match": match},
            {"$group": {"_id": None, "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
        ]
        agg = await db.orders.aggregate(pipeline).to_list(1)
        return agg[0] if agg else {"count": 0, "revenue": 0}

    lifetime = await _stats({"multiplex_id": m["id"]})
    today = await _stats({"multiplex_id": m["id"], "created_at": {"$gte": today_iso}})
    week = await _stats({"multiplex_id": m["id"], "created_at": {"$gte": week_iso}})

    # Top items
    top_pipeline = [
        {"$match": {"multiplex_id": m["id"]}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name",
                    "qty": {"$sum": "$items.quantity"},
                    "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
        {"$sort": {"qty": -1}},
        {"$limit": 5},
    ]
    top_items = await db.orders.aggregate(top_pipeline).to_list(5)
    top = [{"name": t["_id"], "qty": t["qty"], "revenue": float(t["revenue"])} for t in top_items]

    # Status breakdown
    status_pipeline = [
        {"$match": {"multiplex_id": m["id"]}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_breakdown = {s["_id"]: s["count"] for s in await db.orders.aggregate(status_pipeline).to_list(10)}

    return {
        "multiplex": {"name": m["name"], "slug": m["slug"]},
        "lifetime": {"orders": lifetime["count"], "revenue": float(lifetime["revenue"])},
        "today": {"orders": today["count"], "revenue": float(today["revenue"])},
        "last_7_days": {"orders": week["count"], "revenue": float(week["revenue"])},
        "top_items": top,
        "status_breakdown": status_breakdown,
    }


# ---------- LEGACY FALLBACK FOR AUTOMATED TEST SUITE ----------
@api_router.get("/theater-info")
async def legacy_theater_info(screen: str, seat: str):
    m = await load_multiplex("amb-cinemas")
    return {"theater": m["name"], "screen": screen, "seat": seat,
            "slug": m["slug"], "primary_color": m.get("primary_color", "#E50914"),
            "logo": m.get("logo"), "minimum_order_value": m.get("minimum_order_value", 150.0),
            "screens": m.get("screens", [])}

@api_router.get("/menu", response_model=List[MenuItem])
async def legacy_menu():
    m = await load_multiplex("amb-cinemas")
    items = await db.menu.find({"multiplex_id": m["id"]}, {"_id": 0}).to_list(500)
    return items

@api_router.post("/orders", response_model=Order)
async def legacy_create_order(payload: OrderCreate):
    m = await load_multiplex("amb-cinemas")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = Order(
        short_id=uuid.uuid4().hex[:6].upper(),
        multiplex_id=m["id"], multiplex_slug=m["slug"],
        theater=m["name"], screen=payload.screen, seat=payload.seat,
        additional_seats=payload.additional_seats or [],
        items=payload.items, payment_method=payload.payment_method,
        total=payload.total, notes=(payload.notes or "").strip()[:500],
        payment_status="paid"
    )
    doc = order.model_dump()
    doc["items"] = [i.model_dump() if hasattr(i, "model_dump") else i for i in doc["items"]]
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def legacy_list_orders():
    m = await load_multiplex("amb-cinemas")
    orders = await db.orders.find({"multiplex_id": m["id"]}, {"_id": 0}).to_list(500)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def legacy_get_order(order_id: str):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o

@api_router.patch("/orders/{order_id}/status", response_model=Order)
async def legacy_update_order_status(order_id: str, body: StatusUpdate):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    result = await db.orders.find_one_and_update(
        {"id": order_id},
        {"$set": {"status": body.status}},
        return_document=True, projection={"_id": 0}
    )
    return result

@api_router.get("/")
async def root():
    return {"message": "CineBites API live"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
