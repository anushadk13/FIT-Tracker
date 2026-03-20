from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db import init_db
from routes.protein import protein_router
from routes.expenses import expenses_router
from routes.gym import gym_router
import uvicorn

import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database...")
    try:
        await init_db()
        print("Database ready.")
    except Exception as e:
        print(f"Database initialization failed: {e}")
    yield

app = FastAPI(title="FitTracker API", lifespan=lifespan)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Internal Server Error: {exc}\n{traceback.format_exc()}"
    print(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )

@app.get("/api/health")
async def health_check():
    try:
        from db import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"failed: {e}"
        
    return {
        "status": "online",
        "version": "1.0.1-sanitized",
        "database": db_status
    }

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://cosmic-cascaron-316988.netlify.app",
        "https://shimmering-crepe-9844db.netlify.app",
        "https://fit-tracker-ashen.vercel.app",
        "https://roaring-faun-a1bc7c.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(protein_router, prefix="/api/protein", tags=["protein"])
app.include_router(expenses_router, prefix="/api/expenses", tags=["expenses"])
app.include_router(gym_router, prefix="/api/gym", tags=["gym"])

if __name__ == "__main__":
    # Using port 5001 because macOS AirPlay Receiver often occupies 5000
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
