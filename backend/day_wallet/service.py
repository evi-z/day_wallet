from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.db import transaction
import httpx
from day_wallet.models import AppUser, generate_db_password

COUCHDB_USERS_URL = f"{settings.COUCHDB_URL}/_users"


class AppUserService:
    @classmethod
    def _create_couchdb_user(cls, user: AppUser, password: str):
        user_doc = {
            "_id": f"org.couchdb.user:{user.username}",
            "name": user.username,
            "password": user.db_password,
            "roles": ["user"],
            "type": "user",
        }

        response = httpx.put(
            f"{COUCHDB_USERS_URL}/org.couchdb.user:{user.username}",
            json=user_doc,
            auth=(settings.COUCHDB_ADMIN_USER, settings.COUCHDB_ADMIN_PASSWORD),
        )

        if response.status_code != 201:
            raise Exception(
                f"Ошибка при создании базы данных пользователя в CouchDB: {response.text}"
            )

    @classmethod
    @transaction.atomic
    def register_user(cls, data: dict) -> AppUser:
        if AppUser.objects.filter(email=data["email"]).exists():
            raise Exception("Пользователь с таким email уже существует")

        user = AppUser.objects.create_user(
            email=data["email"],
            password=data["password"],
            first_name=data["name"],
        )

        cls._create_couchdb_user(user, data["password"])

        return user

    @classmethod
    @transaction.atomic
    def _update_couchdb_user_password(cls, user: AppUser, new_password: str):
        # Получаем текущий документ пользователя для получения _rev
        user.db_password = new_password
        user.save()

        user_doc = cls._get_couchdb_user(user)

        # Обновляем пароль в документе
        user_doc["password"] = new_password

        # Отправляем обновленный документ обратно в CouchDB
        update_response = httpx.put(
            f"{COUCHDB_USERS_URL}/org.couchdb.user:{user.username}",
            json=user_doc,
            auth=(settings.COUCHDB_ADMIN_USER, settings.COUCHDB_ADMIN_PASSWORD),
        )

        if update_response.status_code != 201:
            raise Exception(
                f"Ошибка при обновлении пароля пользователя в CouchDB: {update_response.text}"
            )

    @classmethod
    def _get_couchdb_user(cls, user: AppUser) -> dict:
        response = httpx.get(
            f"{COUCHDB_USERS_URL}/org.couchdb.user:{user.username}",
            auth=(settings.COUCHDB_ADMIN_USER, settings.COUCHDB_ADMIN_PASSWORD),
        )
        if response.status_code != 200:
            raise Exception(f"Пользователь не найден в CouchDB: {response.text}")

        return response.json()

    @classmethod
    def login_user(cls, data: dict) -> tuple[AppUser, Token]:
        user = authenticate(**data)
        if not user:
            raise Exception("Неверный логин или пароль")

        cls._get_couchdb_user(user)  # Raise Exception if user not found in CouchDB
        auth_token, created = Token.objects.get_or_create(user=user)
        return user, auth_token
