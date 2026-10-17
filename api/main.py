import os
from fastapi import FastAPI, HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import pool
from pydantic import BaseModel
from auth import current_user,verify_password,make_token,hash_password

load_dotenv()

app = FastAPI(title="PedalPeer Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/test-db")
def test_db():
    with pool.connection() as conn:
        result = conn.execute("SELECT version();").fetchone()
        return {"status": "connected", "database_version": result["version"]}

@app.get("/users")
def get_users():
    with pool.connection() as conn:
        results = conn.execute("SELECT id, username, email FROM users;").fetchall()
        return {"users": results}


class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/signup", status_code=201)
def signup(user: UserSignup):
    try:
        with pool.connection() as conn:
            #check if email exist
            existing = conn.execute("SELECT id FROM users WHERE email = %s;", (user.email,)).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            # Insert new user
            query = "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email;"
            new_user = conn.execute(query, (user.username, user.email, hash_password(user.password))).fetchone()
            
            return {"status": "success", "user": new_user}
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(body: UserLogin):
    with pool.connection() as conn:
        query="SELECT id, username, email, password_hash FROM users WHERE email = %s"
        row = conn.execute(query,(body.email,)).fetchone()

        if not row or not verify_password(body.password, row["password_hash"]):
            raise HTTPException(401, "invalid credentials")
        return{
            "user":  {"id": row["id"], "username": row["username"], "email": row["email"]},
            "token": make_token(row["id"], row["email"])
        }


@app.get("/me")
def me(user=Depends(current_user)):
    with pool.connection as conn:
        query="SELECT id, username, email, created_at FROM users WHERE id = %s"
        me_user=conn.execute(query,(user["id"],)).fetchone()
        return me_user