from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert
from models import ProteinLog

protein_router = APIRouter()

class ProteinLogSchema(BaseModel):
    date: date
    soy_milk: Optional[bool] = False
    greek_yogurt: Optional[bool] = False
    bread: Optional[bool] = False
    veg_protein: Optional[bool] = False

@protein_router.get("/", response_model=List[dict])
async def get_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProteinLog).order_by(ProteinLog.date.desc()))
    rows = result.scalars().all()
    res = []
    for r in rows:
        d = {"id": r.id, "date": r.date.isoformat(), "soy_milk": r.soy_milk, "greek_yogurt": r.greek_yogurt, "bread": r.bread, "veg_protein": r.veg_protein}
        res.append(d)
    return res

@protein_router.post("/")
async def upsert(data: ProteinLogSchema, db: AsyncSession = Depends(get_db)):
    try:
        stmt = insert(ProteinLog).values(
            date=data.date, soy_milk=data.soy_milk, greek_yogurt=data.greek_yogurt, bread=data.bread, veg_protein=data.veg_protein
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=['date'],
            set_=dict(
                soy_milk=stmt.excluded.soy_milk,
                greek_yogurt=stmt.excluded.greek_yogurt,
                bread=stmt.excluded.bread,
                veg_protein=stmt.excluded.veg_protein
            )
        ).returning(ProteinLog)
        
        result = await db.execute(stmt)
        row = result.scalar_one()
        await db.commit()
        return {"id": row.id, "date": row.date.isoformat(), "soy_milk": row.soy_milk, "greek_yogurt": row.greek_yogurt, "bread": row.bread, "veg_protein": row.veg_protein}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@protein_router.delete("/{id}")
async def delete_entry(id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ProteinLog).where(ProteinLog.id == id))
    await db.commit()
    return {"message": "Deleted"}
