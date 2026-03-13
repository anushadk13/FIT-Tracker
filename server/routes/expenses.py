from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from db import get_connection
from decimal import Decimal

expenses_router = APIRouter()

class Expense(BaseModel):
    date: date
    end_date: Optional[date] = None
    item: str
    quantity: Optional[str] = ""
    cost: float
    serving_size: Optional[str] = ""
    num_days: Optional[int] = 0

@expenses_router.get("/", response_model=List[dict])
def get_all():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["date"] = d["date"].isoformat()
        if d.get("end_date"):
            d["end_date"] = d["end_date"].isoformat()
        # Convert Decimal to float for JSON
        if isinstance(d["cost"], Decimal):
            d["cost"] = float(d["cost"])
        result.append(d)
    return result

@expenses_router.post("/")
def add(data: Expense):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO expenses (date, end_date, item, quantity, cost, serving_size, num_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (data.date, data.end_date, data.item, data.quantity, data.cost, data.serving_size, data.num_days))
        row = cur.fetchone()
        conn.commit()
        d = dict(row)
        d["date"] = d["date"].isoformat()
        if d.get("end_date"):
            d["end_date"] = d["end_date"].isoformat()
        if isinstance(d["cost"], Decimal):
            d["cost"] = float(d["cost"])
        return d
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@expenses_router.delete("/{id}")
def delete(id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM expenses WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Deleted"}
