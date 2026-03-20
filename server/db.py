import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from urllib.parse import urlparse
import urllib.parse

load_dotenv()

# Forcefully remove any malformed Postgres environment variables set by Vercel
# that psycopg2's underlying libpq library might automatically pick up.
for key in list(os.environ.keys()):
    if key.startswith("PG"):
        del os.environ[key]

# 1. Environment and URL Configuration
raw_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://icu_user:icu_password@db/icu_db")
raw_url = raw_url.strip()

# 2. URL Cleaning & Formatting
if raw_url.startswith("psql "):
    raw_url = raw_url.replace("psql ", "")
if raw_url.startswith("'") and raw_url.endswith("'"):
    raw_url = raw_url.strip("'")
if raw_url.startswith('"') and raw_url.endswith('"'):
    raw_url = raw_url.strip('"')
raw_url = raw_url.strip()

parsed = urlparse(raw_url)
# Enforcing Async
scheme = "postgresql+asyncpg" if not parsed.scheme.endswith("asyncpg") else parsed.scheme
scheme = scheme.replace("postgres://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")

# Stripping incompatible parameters
query_params = []
if parsed.query:
    for param in parsed.query.split("&"):
        if not param.startswith("sslmode=") and not param.startswith("channel_binding="):
            query_params.append(param)
new_query = "&".join(query_params)

DATABASE_URL = urllib.parse.urlunparse((scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

# 3. Creating the Engine and Session Factory
connect_args = {}
# Note on SSL: If the database is hosted on Neon
if "neon.tech" in DATABASE_URL:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx
    print("SSL context configured for Neon DB.")

print(f"Creating engine for URL: {DATABASE_URL.split('@')[-1]}") # Log host/db only for safety
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 4. Injectable Database Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# 5. Initialization
async def init_db():
    from models import Base, GymSchedule
    
    # Generate the database schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default gym schedule if empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM gym_schedule"))
        count = result.scalar()
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
                new_day = GymSchedule(day_of_week=day, workout=workout)
                session.add(new_day)
            await session.commit()
