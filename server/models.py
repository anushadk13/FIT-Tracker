from sqlalchemy import Column, Integer, String, Boolean, Date, Numeric, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ProteinLog(Base):
    __tablename__ = "protein_log"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    soy_milk = Column(Boolean, default=False)
    greek_yogurt = Column(Boolean, default=False)
    bread = Column(Boolean, default=False)
    veg_protein = Column(Boolean, default=False)

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    item = Column(Text, nullable=False)
    quantity = Column(Text, nullable=True)
    cost = Column(Numeric(10, 2), nullable=False)
    end_date = Column(Date, nullable=True)
    serving_size = Column(Text, nullable=True)
    num_days = Column(Integer, nullable=True)

class GymSchedule(Base):
    __tablename__ = "gym_schedule"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Text, nullable=False, unique=True)
    workout = Column(Text, default='')
    completed = Column(Boolean, default=False)
