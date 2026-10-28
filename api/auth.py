import os
from datetime import datetime,timedelta,timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

SECRET = os.environ["JWT_SECRET"]
ALGO = "HS256"
TTL = 60*24 #minutes
bearer = HTTPBearer(auto_error=False)

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

def current_user(creds:HTTPAuthorizationCredentials | None = Depends(bearer)):
    if creds is None:
        raise HTTPException(401,"missing token")
    token = creds.credentials
    try:
        payload = jwt.decode(
            token,SECRET,algorithms=[ALGO],options={"require":["sub","email","exp"]}
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401,"token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401,"bad token")
    return {"id": int(payload["sub"]),"email":payload["email"]}