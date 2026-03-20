from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from db import get_db
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models import Expense

expenses_router = APIRouter()

class ExpenseSchema(BaseModel):
    date: date
    end_date: Optional[date] = None
    item: str
    quantity: Optional[str] = ""
    cost: float
    serving_size: Optional[str] = ""
    num_days: Optional[int] = 0

@expenses_router.get("/", response_model=List[dict])
async def get_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).order_by(Expense.date.desc(), Expense.id.desc()))
    rows = result.scalars().all()
    res = []
    for r in rows:
        d = {"id": r.id, "date": r.date.isoformat(), "item": r.item, "quantity": r.quantity, "serving_size": r.serving_size, "num_days": r.num_days}
        if r.end_date:
            d["end_date"] = r.end_date.isoformat()
        if isinstance(r.cost, Decimal):
            d["cost"] = float(r.cost)
        else:
            d["cost"] = r.cost
        res.append(d)
    return res

@expenses_router.post("/")
async def add(data: ExpenseSchema, db: AsyncSession = Depends(get_db)):
    try:
        new_expense = Expense(
            date=data.date, end_date=data.end_date, item=data.item, quantity=data.quantity, 
            cost=data.cost, serving_size=data.serving_size, num_days=data.num_days
        )
        db.add(new_expense)
        await db.commit()
        await db.refresh(new_expense)
        
        d = {"id": new_expense.id, "date": new_expense.date.isoformat(), "item": new_expense.item, "quantity": new_expense.quantity, "serving_size": new_expense.serving_size, "num_days": new_expense.num_days}
        if new_expense.end_date:
            d["end_date"] = new_expense.end_date.isoformat()
        if isinstance(new_expense.cost, Decimal):
            d["cost"] = float(new_expense.cost)
        else:
            d["cost"] = float(new_expense.cost) if new_expense.cost else 0.0
        return d
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@expenses_router.delete("/{id}")
async def delete_entry(id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Expense).where(Expense.id == id))
    await db.commit()
    return {"message": "Deleted"}
