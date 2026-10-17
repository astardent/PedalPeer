import os
from datetime import datetime,timedelta,timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

SECRET = os.environ["JST_SECRET"]
ALGO = "HS256"
TLL = 60*24 #minutes

def hash_password(plain: str)->str:
    return bcrypt.hashpw(plain.encode(),bcrypt.gensalt()).decode()

def verify_password(plain:str, hashed:str)->bool:
    try:
        return bcrypt.checkpw(plain.encode(),hashed.encode())
    except ValueError:
        return False

def make_token(user_id:int, email:str)->str:
    payload = {
        "sub":str(user_id),
        "email":email,
        "exp":datetime.now(timezone.utc)+timedelta(minutes=TTL),
    }
    return jwt.encode(payload,SECRET,algorithm=ALGO)

def current_user(authorization:str = Header(default="")):
    token = authorization.removeprefix("Bearer").strip()
    if not token:
        raise HTTPException(401,"missing token")
    try:
        payload = jwt.decode(
            token,SECRET,algorithms=[ALGO],options={"require":["sub","email","exp"]}
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401,"token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401,"bad token")
    return {"id": int(payload["sub"]),"email"=payload["email"]}