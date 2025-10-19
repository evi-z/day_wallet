import httpx
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Создаем пользователя в CouchDB _users
            couch_users_url = f"{settings.COUCHDB_URL}/_users"
            user_doc = {
                "_id": f"org.couchdb.user:{user.username}",
                "name": user.username,
                "password": request.data["password"],  # Пароль в plain для CouchDB
                "roles": ["user"],
                "type": "user",
            }
            response = httpx.post(
                f"{couch_users_url}/_security/_all_docs?include_docs=true",  # Нет, используйте PUT для _users
                json=user_doc,
                auth=(settings.COUCHDB_ADMIN_USER, settings.COUCHDB_ADMIN_PASS),
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 201:
                return Response(
                    {"message": "User created"}, status=status.HTTP_201_CREATED
                )
            else:
                user.delete()  # Откат если CouchDB ошибка
                return Response(
                    {"error": "CouchDB creation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user_data = serializer.validated_data
            # Проверяем, что пользователь существует в CouchDB
            couch_users_url = f"{settings.COUCHDB_URL}/_users/org.couchdb.user:{user_data['username']}"
            response = requests.get(
                couch_users_url,
                auth=(settings.COUCHDB_ADMIN_USER, settings.COUCHDB_ADMIN_PASS),
            )
            if response.status_code != 200:
                return Response(
                    {"error": "User not found in CouchDB"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Возвращаем данные для логина в CouchDB (только один раз!)
            return Response(
                {
                    "message": "Login successful",
                    "couchdb_login": {
                        "username": user_data["username"],
                        "password": request.data["password"],
                    },
                    "user_db": f"userdb-{user_data['username'].encode().hex()}",
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
