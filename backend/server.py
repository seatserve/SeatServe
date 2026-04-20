from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="CineBites API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
OrderStatus = Literal["preparing", "out_for_delivery", "delivered"]


class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str  # Popcorn | Beverages | Snacks | Combos
    image: str
    is_available: bool = True
    stock_count: Optional[int] = None  # None = unlimited


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


class CartItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    image: str


class OrderCreate(BaseModel):
    theater: str
    screen: str
    seat: str
    items: List[CartItem]
    payment_method: Literal["upi", "card"]
    total: float


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    short_id: str
    theater: str
    screen: str
    seat: str
    items: List[CartItem]
    payment_method: str
    total: float
    status: OrderStatus = "preparing"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    eta_minutes: int = 10


# ---------- Seed Menu ----------
MENU_SEED: List[dict] = [
    # Popcorn
    {"id": "pop-classic", "name": "Classic Salted Popcorn", "description": "Freshly popped, lightly salted. Cinema signature.", "price": 249, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "pop-caramel", "name": "Caramel Crunch Popcorn", "description": "Golden caramel coated kernels, sweet & crisp.", "price": 299, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "pop-cheese", "name": "Cheddar Cheese Popcorn", "description": "Aged cheddar dust, bold & savoury.", "price": 319, "category": "Popcorn", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    # Beverages
    {"id": "bev-cola", "name": "Chilled Cola", "description": "Ice-cold classic cola, 500ml.", "price": 149, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"id": "bev-lemon", "name": "Sparkling Lemonade", "description": "Fresh lime fizz, 500ml.", "price": 169, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"id": "bev-coffee", "name": "Iced Mocha Coffee", "description": "Cold brew with chocolate swirl.", "price": 229, "category": "Beverages", "image": "https://images.unsplash.com/photo-1768254270166-bee57d6bfce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb2xhJTIwZHJpbmslMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY1NzM1MTZ8MA&ixlib=rb-4.1.0&q=85"},
    # Snacks
    {"id": "snk-nachos", "name": "Loaded Nachos", "description": "Crispy tortillas, cheese, jalapeños, salsa.", "price": 349, "category": "Snacks", "image": "https://images.pexels.com/photos/29851128/pexels-photo-29851128.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "snk-burger", "name": "Gourmet Cheese Burger", "description": "Juicy patty, molten cheese, brioche bun.", "price": 429, "category": "Snacks", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "snk-fries", "name": "Truffle Parm Fries", "description": "Crispy fries, truffle oil, parmesan.", "price": 279, "category": "Snacks", "image": "https://images.pexels.com/photos/29851128/pexels-photo-29851128.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    # Combos
    {"id": "cmb-duo", "name": "Movie Duo Combo", "description": "Large popcorn + 2 colas. Perfect for two.", "price": 549, "category": "Combos", "image": "https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "cmb-family", "name": "Family Feast Combo", "description": "Popcorn, nachos, burger & 3 drinks.", "price": 1199, "category": "Combos", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "cmb-solo", "name": "Solo Premiere Combo", "description": "Medium popcorn + burger + cola.", "price": 699, "category": "Combos", "image": "https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
]


SEAT_SEED = {
    "theater": "AMB Cinemas",
    "available_seats": [
        {"screen": "1", "seat": "A5"},
        {"screen": "2", "seat": "B12"},
        {"screen": "2", "seat": "B13"},
        {"screen": "3", "seat": "C5"},
        {"screen": "3", "seat": "C6"},
        {"screen": "4", "seat": "D8"},
    ],
}


@app.on_event("startup")
async def seed_menu():
    count = await db.menu.count_documents({})
    if count == 0:
        await db.menu.insert_many([dict(m) for m in MENU_SEED])
        logging.info("Seeded %d menu items", len(MENU_SEED))


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "CineBites API live"}


@api_router.get("/theater-info")
async def theater_info(screen: str, seat: str):
    return {
        "theater": SEAT_SEED["theater"],
        "screen": screen,
        "seat": seat,
    }


@api_router.get("/seats")
async def list_seats():
    return SEAT_SEED


@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu.find({}, {"_id": 0}).to_list(500)
    return items


@api_router.get("/categories", response_model=List[str])
async def list_categories():
    cats = await db.menu.distinct("category")
    # Keep seeded categories always first, then any new ones alphabetically
    default = ["Popcorn", "Beverages", "Snacks", "Combos"]
    extras = sorted([c for c in cats if c and c not in default])
    ordered = [c for c in default if c in cats] + extras
    return ordered or default


@api_router.post("/menu", response_model=MenuItem, status_code=201)
async def create_menu_item(payload: MenuItemCreate):
    item = MenuItem(id=uuid.uuid4().hex[:10], **payload.model_dump())
    await db.menu.insert_one(item.model_dump())
    return item


@api_router.patch("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, payload: MenuItemUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.menu.find_one_and_update(
        {"id": item_id},
        {"$set": updates},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return result


@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"deleted": item_id}


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate availability & stock before creating order
    for ci in payload.items:
        menu_item = await db.menu.find_one({"id": ci.item_id}, {"_id": 0})
        if not menu_item:
            raise HTTPException(status_code=400, detail=f"Item {ci.item_id} no longer on menu")
        if not menu_item.get("is_available", True):
            raise HTTPException(status_code=400, detail=f"{menu_item['name']} is sold out")
        stock = menu_item.get("stock_count")
        if stock is not None and stock < ci.quantity:
            raise HTTPException(status_code=400, detail=f"Only {stock} × {menu_item['name']} left")

    order = Order(
        short_id=uuid.uuid4().hex[:6].upper(),
        theater=payload.theater,
        screen=payload.screen,
        seat=payload.seat,
        items=payload.items,
        payment_method=payload.payment_method,
        total=payload.total,
    )
    doc = order.model_dump()
    doc["items"] = [i.model_dump() if hasattr(i, "model_dump") else i for i in doc["items"]]
    await db.orders.insert_one(doc)

    # Decrement stock (if tracked); auto-flip is_available=False when depleted
    for ci in payload.items:
        menu_item = await db.menu.find_one({"id": ci.item_id}, {"_id": 0})
        if menu_item and menu_item.get("stock_count") is not None:
            new_stock = max(0, menu_item["stock_count"] - ci.quantity)
            update = {"stock_count": new_stock}
            if new_stock == 0:
                update["is_available"] = False
            await db.menu.update_one({"id": ci.item_id}, {"$set": update})

    return order


@api_router.get("/orders", response_model=List[Order])
async def list_orders():
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


class StatusUpdate(BaseModel):
    status: OrderStatus


@api_router.patch("/orders/{order_id}/status", response_model=Order)
async def update_status(order_id: str, payload: StatusUpdate):
    result = await db.orders.find_one_and_update(
        {"id": order_id},
        {"$set": {"status": payload.status}},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


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
