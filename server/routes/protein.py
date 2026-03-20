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
    morning: Optional[bool] = False
    afternoon: Optional[bool] = False
    night: Optional[bool] = False

@protein_router.get("/", response_model=List[dict])
async def get_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProteinLog).order_by(ProteinLog.date.desc()))
    rows = result.scalars().all()
    res = []
    for r in rows:
        d = {"id": r.id, "date": r.date.isoformat(), "morning": r.morning, "afternoon": r.afternoon, "night": r.night}
        res.append(d)
    return res

@protein_router.post("/")
async def upsert(data: ProteinLogSchema, db: AsyncSession = Depends(get_db)):
    try:
        stmt = insert(ProteinLog).values(
            date=data.date, morning=data.morning, afternoon=data.afternoon, night=data.night
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=['date'],
            set_=dict(
                morning=stmt.excluded.morning,
                afternoon=stmt.excluded.afternoon,
                night=stmt.excluded.night
            )
        ).returning(ProteinLog)
        
        result = await db.execute(stmt)
        row = result.scalar_one()
        await db.commit()
        return {"id": row.id, "date": row.date.isoformat(), "morning": row.morning, "afternoon": row.afternoon, "night": row.night}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@protein_router.delete("/{id}")
async def delete_entry(id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ProteinLog).where(ProteinLog.id == id))
    await db.commit()
    return {"message": "Deleted"}
