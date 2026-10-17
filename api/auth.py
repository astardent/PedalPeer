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
