import os
from fastapi import FastAPI, HTTPException
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
    try:
        with pool.connection() as conn:
            result = conn.execute("SELECT version();").fetchone()
            return {"status": "connected", "database_version": result["version"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_users():
    try:
        with pool.connection() as conn:
            # Selects rows from your 'users' table
            results = conn.execute("SELECT id, username, email FROM users;").fetchall()
            return {"users": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/signup")
def signup(user: UserSignup):
    try:
        with pool.connection() as conn:
            # Check if user already exists
            existing = conn.execute("SELECT id FROM users WHERE email = %s;", (user.email,)).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Insert user (Note: In production apps, passwords should be hashed)
            query = """
                INSERT INTO users (username, email, password)
                VALUES (%s, %s, %s)
                RETURNING id, username, email;
            """
            new_user = conn.execute(query, (user.username, user.email, user.password)).fetchone()
            return {"status": "success", "user": new_user}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(user: UserLogin):
    try:
        with pool.connection() as conn:
            query = "SELECT id, username, email, password FROM users WHERE email = %s;"
            db_user = conn.execute(query, (user.email,)).fetchone()
            
            if not db_user or db_user["password"] != user.password:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            return {
                "status": "success", 
                "message": "Login successful", 
                "user": {"id": db_user["id"], "username": db_user["username"], "email": db_user["email"]}
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))