import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sns_db")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set!")

KST = ZoneInfo("Asia/Seoul")
KST_OFFSET = timedelta(hours=9)

COLLECTIONS = [
    "posts",
    "comments",
    "notifications",
    "users",
    "guestbook",
]


def shift_dt(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt + KST_OFFSET
    return dt.astimezone(KST)


def migrate_collection(db, name: str) -> int:
    collection = db[name]
    updated = 0
    cursor = collection.find({"$or": [{"created_at": {"$exists": True}}, {"updated_at": {"$exists": True}}]})

    for doc in cursor:
        updates = {}
        created_at = doc.get("created_at")
        updated_at = doc.get("updated_at")

        if isinstance(created_at, datetime):
            updates["created_at"] = shift_dt(created_at)
        if isinstance(updated_at, datetime):
            updates["updated_at"] = shift_dt(updated_at)

        if updates:
            collection.update_one({"_id": doc["_id"]}, {"$set": updates})
            updated += 1

    return updated


def main() -> None:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]

    total_updated = 0
    for name in COLLECTIONS:
        if name in db.list_collection_names():
            count = migrate_collection(db, name)
            total_updated += count
            print(f"{name}: updated {count} documents")

    print(f"Total updated documents: {total_updated}")


if __name__ == "__main__":
    main()
