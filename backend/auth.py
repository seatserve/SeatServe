"""Auth helpers: password hashing + JWT. Kept framework-agnostic."""
import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request

JWT_ALG = "HS256"
ACCESS_TTL_HOURS = 12  # 12h access tokens (kiosk/staff-friendly)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_token(*, sub: str, role: str, multiplex_id: str | None = None, email: str | None = None) -> str:
    payload = {
        "sub": sub,
        "role": role,
        "multiplex_id": multiplex_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TTL_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _secret(), algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _extract_bearer(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return auth[7:]


def require_roles(*allowed_roles: str):
    async def dep(request: Request) -> dict:
        token = _extract_bearer(request)
        payload = decode_token(token)
        if payload.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return payload
    return dep
