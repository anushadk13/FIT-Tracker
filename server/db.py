import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip()

def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS protein_log (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            soy_milk BOOLEAN DEFAULT FALSE,
            greek_yogurt BOOLEAN DEFAULT FALSE,
            bread BOOLEAN DEFAULT FALSE,
            veg_protein BOOLEAN DEFAULT FALSE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            item TEXT NOT NULL,
            quantity TEXT,
            cost NUMERIC(10, 2) NOT NULL
        )
    """)

    # Migration for new columns
    cur.execute("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS end_date DATE")
    cur.execute("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS serving_size TEXT")
    cur.execute("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS num_days INTEGER")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS gym_schedule (
            id SERIAL PRIMARY KEY,
            day_of_week TEXT NOT NULL UNIQUE,
            workout TEXT DEFAULT '',
            completed BOOLEAN DEFAULT FALSE
        )
    """)

    # Seed default gym schedule if empty
    cur.execute("SELECT COUNT(*) FROM gym_schedule")
    count = cur.fetchone()["count"]
    if count == 0:
        days = [
            ("Monday", "Chest"),
            ("Tuesday", "Biceps + Triceps"),
            ("Wednesday", "Shoulders + Back"),
            ("Thursday", "Legs"),
            ("Friday", "Cardio"),
            ("Saturday", "Rest"),
            ("Sunday", "Rest"),
        ]
        for day, workout in days:
            cur.execute(
                "INSERT INTO gym_schedule (day_of_week, workout) VALUES (%s, %s)",
                (day, workout)
            )

    conn.commit()
    cur.close()
    conn.close()
