import os
from fastapi import FastAPI, HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import pool
from pydantic import BaseModel
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

@app.post("/signup")
def signup(user: UserSignup):
    with pool.connection() as conn:
        query = "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email;"
        new_user = conn.execute(query, (user.username, user.email, user.password)).fetchone()
        return {"status": "success", "user": new_user}

@app.post("/login")
def login(user: UserLogin):
    with pool.connection() as conn:
        query="SELECT id, username, email, password FROM users WHERE email = %s;"
        db_user = conn.execute(query, (user.email,)).fetchone()
        if db_user and db_user["password"] == user.password:
            return{
                "status": "success", 
                "user": {"id": db_user["id"], "username": db_user["username"], "email": db_user["email"]}
            }
        
        return{"status": "error", "message": "Invalid email or password"}