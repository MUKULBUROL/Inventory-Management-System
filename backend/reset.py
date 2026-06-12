import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_admin():
    db: Session = SessionLocal()
    try:
        u = db.query(User).filter(User.email == "admin@example.com").first()
        if u:
            u.hashed_password = get_password_hash("password123")
            db.commit()
            print("Password reset successfully")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
