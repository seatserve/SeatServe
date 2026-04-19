from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Literal
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


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
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
