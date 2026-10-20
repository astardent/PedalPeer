import secrets, hashlib, os

def new_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_code(code: str, booking_id: int) -> str:
    pepper = os.environ.get("OTP_PEPPER", "dev-pepper")
    return hashlib.sha256(f"{booking_id}:{code}:{pepper}".encode()).hexdigest()

def verify_code(submitted: str, stored_hash: str, booking_id: int) -> bool:
    return secrets.compare_digest(hash_code(submitted, booking_id), stored_hash)