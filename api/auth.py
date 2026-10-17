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

