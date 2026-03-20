from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models import GymSchedule

gym_router = APIRouter()

class GymEntrySchema(BaseModel):
    workout: str
    completed: bool

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

@gym_router.get("/", response_model=List[dict])
async def get_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GymSchedule))
    rows = result.scalars().all()
    # Sort by defined day order
    res = []
    for r in rows:
        d = {"id": r.id, "day_of_week": r.day_of_week, "workout": r.workout, "completed": r.completed}
        res.append(d)
    res = sorted(res, key=lambda x: DAY_ORDER.index(x["day_of_week"]) if x["day_of_week"] in DAY_ORDER else 99)
    return res

@gym_router.put("/{id}")
async def update_entry(id: int, data: GymEntrySchema, db: AsyncSession = Depends(get_db)):
    try:
        from sqlalchemy import update
        stmt = update(GymSchedule).where(GymSchedule.id == id).values(workout=data.workout, completed=data.completed).returning(GymSchedule)
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()
        await db.commit()
        if not row:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"id": row.id, "day_of_week": row.day_of_week, "workout": row.workout, "completed": row.completed}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
