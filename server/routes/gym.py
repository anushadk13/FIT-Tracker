from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db import get_connection

gym_router = APIRouter()

class GymEntry(BaseModel):
    workout: str
    completed: bool

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

@gym_router.get("/", response_model=List[dict])
def get_all():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM gym_schedule")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Sort by defined day order
    rows = sorted([dict(r) for r in rows], key=lambda x: DAY_ORDER.index(x["day_of_week"]) if x["day_of_week"] in DAY_ORDER else 99)
    return rows

@gym_router.put("/{id}")
def update(id: int, data: GymEntry):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE gym_schedule
            SET workout = %s, completed = %s
            WHERE id = %s
            RETURNING *
        """, (data.workout, data.completed, id))
        row = cur.fetchone()
        conn.commit()
        if not row:
            raise HTTPException(status_code=404, detail="Entry not found")
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
