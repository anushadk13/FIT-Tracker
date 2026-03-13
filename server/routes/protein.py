from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from db import get_connection

protein_router = APIRouter()

class ProteinLog(BaseModel):
    date: date
    soy_milk: Optional[bool] = False
    greek_yogurt: Optional[bool] = False
    bread: Optional[bool] = False
    veg_protein: Optional[bool] = False

@protein_router.get("/", response_model=List[dict])
def get_all():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM protein_log ORDER BY date DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Ensure dates are strings for JSON serialization in FastAPI
    result = []
    for r in rows:
        d = dict(r)
        d["date"] = d["date"].isoformat()
        result.append(d)
    return result

@protein_router.post("/")
def upsert(data: ProteinLog):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO protein_log (date, soy_milk, greek_yogurt, bread, veg_protein)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date) DO UPDATE SET
                soy_milk = EXCLUDED.soy_milk,
                greek_yogurt = EXCLUDED.greek_yogurt,
                bread = EXCLUDED.bread,
                veg_protein = EXCLUDED.veg_protein
            RETURNING *
        """, (
            data.date,
            data.soy_milk,
            data.greek_yogurt,
            data.bread,
            data.veg_protein,
        ))
        row = cur.fetchone()
        conn.commit()
        d = dict(row)
        d["date"] = d["date"].isoformat()
        return d
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@protein_router.delete("/{id}")
def delete(id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM protein_log WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Deleted"}
