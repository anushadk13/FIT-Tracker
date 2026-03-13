import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    url = os.getenv("DATABASE_URL", "")
    if not url:
        return psycopg2.connect("", cursor_factory=RealDictCursor)
        
    # Clean the URL (inspired by robust production patterns)
    url = url.strip().replace("\n", "").replace("\r", "")
    
    # Remove 'psql ' prefixes if accidentally pasted
    if url.startswith("psql '") and url.endswith("'"):
        url = url[6:-1]
    elif url.startswith("psql "):
        url = url[5:]

    # Remove problematic query parameters for serverless environments
    if "?" in url:
        base_url, query = url.split("?", 1)
        params = query.split("&")
        # Keep sslmode=require but strip channel_binding which causes issues with some libpq versions
        filtered_params = [p for p in params if not p.startswith("channel_binding=")]
        if filtered_params:
            url = f"{base_url}?{'&'.join(filtered_params)}"
        else:
            url = base_url

    print(f"Connecting to DB (sanitized): {url[:25]}...{url[-15:]}")
    return psycopg2.connect(url, cursor_factory=RealDictCursor)

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
