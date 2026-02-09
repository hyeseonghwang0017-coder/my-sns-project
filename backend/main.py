from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from dotenv import load_dotenv

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from routes.users import router as users_router
from routes.posts import router as posts_router
from routes.uploads import router as uploads_router
from routes.profiles import router as profiles_router
from routes.notifications import router as notifications_router

app = FastAPI(title="SNS API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://my-sns-project.vercel.app",
        "https://*.vercel.app",  # Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

@app.on_event("startup")
async def startup_db_client():
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL")
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable is not set!")
    db_name = os.getenv("DATABASE_NAME", "sns_db")
    app.mongodb_client = AsyncIOMotorClient(mongo_uri)
    app.mongodb = app.mongodb_client[db_name]
    print("MongoDB connected!")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

app.include_router(users_router)  # 수정
app.include_router(posts_router)
app.include_router(uploads_router)
app.include_router(profiles_router)
app.include_router(notifications_router)

@app.get("/")
async def root():
    return {"message": "SNS API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}