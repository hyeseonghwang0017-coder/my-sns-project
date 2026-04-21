"""
비밀번호 분실 등으로 계정에 접근할 수 없는 사용자의 사용자명(username)을 DB에서 비웁니다.
(개인정보 최소화 — 이메일/비밀번호는 그대로 두고 공개 식별자만 제거)

사용 예:
  cd backend && . .venv_new/bin/activate  # 또는 사용 중인 venv
  python redact_user_username.py --dry-run --email user@example.com
  python redact_user_username.py --username 화면에보이던아이디   # @ 빼고, 앱과 동일하게
  python redact_user_username.py --dry-run --display-name "닉네임"  # 동명이인이 있으면 안내 후 중단
  python redact_user_username.py --id 507f1f77bcf86cd799439011

주의:
- username이 여러 문서에서 ""로 같아도 이 프로젝트는 회원가입 시 빈 username으로 조회하지 않아 충돌이 없습니다.
- 표시 이름(display_name)은 그대로입니다. 닉네임까지 지우려면 MongoDB에서 display_name을 별도로 수정하세요.
"""
import argparse
import asyncio
import os
from typing import List

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


def _parse_args():
    p = argparse.ArgumentParser(description="특정 유저의 username을 빈 문자열로 설정하고, 관련 컬렉션의 author_username 등을 동기화합니다.")
    p.add_argument("--email", action="append", dest="emails", default=[], help="대상 이메일 (여러 번 지정 가능)")
    p.add_argument("--id", action="append", dest="ids", default=[], help="MongoDB ObjectId 문자열 (여러 번 지정 가능)")
    p.add_argument(
        "--username",
        action="append",
        dest="usernames",
        default=[],
        help="가입 시 아이디 (@ 없이). 예: 홈에서 @hello 였으면 hello",
    )
    p.add_argument(
        "--display-name",
        action="append",
        dest="display_names",
        default=[],
        help="프로필/글에 보이는 표시 이름(닉네임). 동일 닉네임이 여러 명이면 스크립트가 중단하고 목록을 보여줍니다.",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="실제 업데이트 없이 대상만 출력",
    )
    return p.parse_args()


async def _resolve_user_ids(
    db,
    emails: List[str],
    id_strs: List[str],
    usernames: List[str],
    display_names: List[str],
) -> List[ObjectId]:
    oids: List[ObjectId] = []
    for raw in id_strs:
        try:
            oids.append(ObjectId(raw.strip()))
        except InvalidId:
            raise SystemExit(f"잘못된 ObjectId: {raw!r}")

    for email in emails:
        e = email.strip()
        if not e:
            continue
        doc = await db.users.find_one({"email": e})
        if not doc:
            raise SystemExit(f"이메일로 유저를 찾을 수 없습니다: {e}")
        oids.append(doc["_id"])

    for uname in usernames:
        u = uname.strip().lstrip("@")
        if not u:
            continue
        doc = await db.users.find_one({"username": u})
        if not doc:
            raise SystemExit(f"username으로 유저를 찾을 수 없습니다: {u!r} (@ 없이 정확히 입력했는지 확인)")
        oids.append(doc["_id"])

    for dname in display_names:
        d = dname.strip()
        if not d:
            continue
        cursor = db.users.find({"display_name": d})
        matches = await cursor.to_list(length=50)
        if not matches:
            raise SystemExit(f"display_name으로 유저를 찾을 수 없습니다: {d!r}")
        if len(matches) > 1:
            print(f"표시 이름 {d!r} 이(가) 같은 사람이 {len(matches)}명 있습니다. 아래 중 누구인지 확인한 뒤 --username 또는 --id 로 다시 실행하세요:\n")
            for m in matches:
                print(f"  username={m.get('username')!r}  email={m.get('email')}  _id={m['_id']}")
            raise SystemExit("")
        oids.append(matches[0]["_id"])

    # 중복 제거(순서 유지)
    seen = set()
    unique: List[ObjectId] = []
    for oid in oids:
        if oid not in seen:
            seen.add(oid)
            unique.append(oid)

    if not unique:
        raise SystemExit(
            "--email, --id, --username, --display-name 중 하나로 최소 한 명을 지정하세요.\n"
            "이메일/ID를 모르면, 앱에 보이던 @아이디를 --username 에 넣으면 됩니다 (@는 빼도 됩니다)."
        )

    return unique


async def main():
    args = _parse_args()
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db

    user_ids = await _resolve_user_ids(
        db,
        args.emails,
        args.ids,
        args.usernames,
        args.display_names,
    )
    id_strings = [str(uid) for uid in user_ids]

    print("대상 유저:\n")
    for uid in user_ids:
        u = await db.users.find_one({"_id": uid})
        if not u:
            print(f"  - {uid}: (문서 없음)")
            continue
        print(f"  - _id={uid}")
        print(f"    email={u.get('email')}")
        print(f"    username={u.get('username')!r} -> ''")
        print(f"    display_name={u.get('display_name')!r}")
        print()

    if args.dry_run:
        print("(--dry-run 이므로 DB는 변경하지 않았습니다.)")
        client.close()
        return

    u_result = await db.users.update_many(
        {"_id": {"$in": user_ids}},
        {"$set": {"username": ""}},
    )
    p_result = await db.posts.update_many(
        {"author_id": {"$in": id_strings}},
        {"$set": {"author_username": ""}},
    )
    c_result = await db.comments.update_many(
        {"author_id": {"$in": id_strings}},
        {"$set": {"author_username": ""}},
    )
    g_result = await db.guestbook.update_many(
        {"author_id": {"$in": id_strings}},
        {"$set": {"author_username": ""}},
    )
    n_result = await db.notifications.update_many(
        {"actor_id": {"$in": id_strings}},
        {"$set": {"actor_username": ""}},
    )

    print("적용 결과:")
    print(f"  users (username):        {u_result.modified_count}건 수정")
    print(f"  posts (author_username): {p_result.modified_count}건 수정")
    print(f"  comments:                {c_result.modified_count}건 수정")
    print(f"  guestbook:               {g_result.modified_count}건 수정")
    print(f"  notifications:           {n_result.modified_count}건 수정")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
