from fastapi import Request, HTTPException
from bson import ObjectId

def get_db(request: Request):
    """공통 데이터베이스 접근 함수"""
    return request.app.mongodb

def parse_object_id(id_str: str) -> ObjectId:
    """문자열 ID를 ObjectId로 변환하는 공통 함수"""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
