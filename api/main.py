import os
from fastapi import FastAPI, HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import pool
from pydantic import BaseModel,Field
from auth import current_user,verify_password,make_token,hash_password
from typing import Optional
from otp import hash_code,new_code,verify_code
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

class NewCycle(BaseModel):
    title:          str = Field(min_length=3, max_length=80)
    description:    Optional[str] = None
    price_per_hour: int = Field(ge=0)
    hostel:         Optional[str] = None
    lat:            Optional[float] = None
    lng:            Optional[float] = None

class NewBooking(BaseModel):
    cycle_id:   int
    start_time: str   # format: "2024-11-01T10:00:00"
    end_time:   str

class OTPSubmit(BaseModel):
    code: str = Field(min_length=6, max_length=6)

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
    with pool.connection() as conn:
        query="SELECT id, username, email, created_at FROM users WHERE id = %s"
        me_user=conn.execute(query,(user["id"],)).fetchone()
        return me_user


# cycles

@app.get("/cycles")
def list_cycles(hostel: Optional[str] = None):
    with pool.connection() as conn:
        if hostel:
            rows = conn.execute("""SELECT c.*, u.username as owner_name FROM cycles c JOIN users u ON c.owner_id = u.id
                   WHERE c.is_available = TRUE AND c.hostel = %s ORDER BY c.created_at DESC""",(hostel,)).fetchall()
        else:
            rows = conn.execute("""SELECT c.*, u.username as owner_name FROM cycles c JOIN users u ON c.owner_id = u.id
                   WHERE c.is_available = TRUE ORDER BY c.created_at DESC""").fetchall()
        return rows


@app.post("/cycles", status_code=201)
def create_cycle(body: NewCycle, user=Depends(current_user)):
    with pool.connection() as conn:
        row = conn.execute("""INSERT INTO cycles (owner_id, title, description, price_per_hour, hostel, lat, lng) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (user["id"], body.title, body.description,body.price_per_hour, body.hostel, body.lat, body.lng)).fetchone()
        return row

@app.delete("/cycles/{cycle_id}")
def delete_cycle(cycle_id: int, user=Depends(current_user)):
    with pool.connection() as conn:
        result = conn.execute("DELETE FROM cycles WHERE id = %s AND owner_id = %s",(cycle_id, user["id"]))
        if result.rowcount == 0:
            raise HTTPException(404, "not found or not your cycle")
        return {"ok": True}

# bookings

@app.post("/bookings", status_code=201)
def request_booking(body: NewBooking, user=Depends(current_user)):
    with pool.connection() as conn:
        cycle = conn.execute("SELECT * FROM cycles WHERE id = %s AND is_available = TRUE", (body.cycle_id,)).fetchone()
        if not cycle:
            raise HTTPException(404, "cycle not available")
        if cycle["owner_id"] == user["id"]:
            raise HTTPException(400, "cannot book your own cycle")
        row = conn.execute(
            """INSERT INTO bookings (cycle_id, renter_id, start_time, end_time) VALUES (%s, %s, %s, %s) RETURNING *""",
            (body.cycle_id, user["id"], body.start_time, body.end_time)).fetchone()
        return row

@app.get("/bookings/mine")
def my_bookings(user=Depends(current_user)):
    with pool.connection() as conn:
        return conn.execute(
            """SELECT b.*, c.title as cycle_title, c.hostel FROM bookings b JOIN cycles c ON b.cycle_id = c.id WHERE b.renter_id = %s ORDER BY b.created_at DESC""",
            (user["id"],)).fetchall()

@app.get("/bookings/incoming")
def incoming_bookings(user=Depends(current_user)):
    """Bookings on my cycles that I need to accept/reject."""
    with pool.connection() as conn:
        return conn.execute(
            """SELECT b.*, c.title as cycle_title, u.username as renter_name FROM bookings b JOIN cycles c ON b.cycle_id = c.id JOIN users u ON b.renter_id = u.id WHERE c.owner_id = %s AND b.status = 'requested' ORDER BY b.created_at DESC""",
            (user["id"],)).fetchall()


@app.post("/bookings/{booking_id}/accept")
def accept_booking(booking_id: int, user=Depends(current_user)):
    code = new_code()
    with pool.connection() as conn:
        result = conn.execute(
            """UPDATE bookings b SET status = 'accepted', start_otp = %s FROM cycles c
               WHERE b.id = %s AND b.cycle_id = c.id AND c.owner_id = %s AND b.status = 'requested'""",
            (hash_code(code, booking_id), booking_id, user["id"]))
        if result.rowcount == 0:
            raise HTTPException(409, "not allowed")
        
        return {"ok": True, "start_otp": code}    

@app.post("/bookings/{booking_id}/start")
def start_rental(booking_id: int, body: OTPSubmit, user=Depends(current_user)):
    with pool.connection() as conn:
        booking = conn.execute("SELECT * FROM bookings WHERE id = %s AND renter_id = %s AND status = 'accepted'",
            (booking_id, user["id"])).fetchone()
        
        if not booking:
            raise HTTPException(404, "booking not found")
        if not verify_code(body.code, booking["start_otp"], booking_id):
            raise HTTPException(403, "wrong OTP")
        end_code = new_code()

        conn.execute("UPDATE bookings SET status = 'active', end_otp = %s WHERE id = %s",
            (hash_code(end_code, booking_id), booking_id))
        
        conn.execute("UPDATE cycles SET is_available = FALSE WHERE id = %s",
            (booking["cycle_id"],))
        return {"ok": True, "end_otp": end_code}

@app.post("/bookings/{booking_id}/complete")
def complete_rental(booking_id: int, body: OTPSubmit, user=Depends(current_user)):
    with pool.connection() as conn:
        booking = conn.execute("""SELECT b.* FROM bookings b JOIN cycles c ON b.cycle_id = c.id
                                WHERE b.id = %s AND c.owner_id = %s AND b.status = 'active'""",(booking_id, user["id"])).fetchone()
        if not booking:
            raise HTTPException(404, "booking not found")
        if not verify_code(body.code, booking["end_otp"], booking_id):
            raise HTTPException(403, "wrong OTP")
        
        conn.execute("UPDATE bookings SET status = 'completed' WHERE id = %s", (booking_id,))

        conn.execute("UPDATE cycles SET is_available = TRUE WHERE id = %s",(booking["cycle_id"],))

        return {"ok": True}

@app.post("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int, user=Depends(current_user)):
    with pool.connection() as conn:
        result = conn.execute("""UPDATE bookings SET status = 'cancelled' WHERE id = %s AND renter_id = %s AND status IN ('requested', 'accepted')""",
            (booking_id, user["id"]))
        
        if result.rowcount == 0:
            raise HTTPException(409, "cannot cancel")
        return {"ok": True}
