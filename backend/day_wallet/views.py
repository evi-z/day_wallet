from re import S
from django.contrib.auth import authenticate
from django.db import transaction
import httpx
from rest_framework import status
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings

from day_wallet.service import AppUserService
from backend_app.responses import SuccessResponse


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request: Request):
        AppUserService.register_user(request.data)
        return SuccessResponse()


class LoginView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request: Request):
        user, auth_token = AppUserService.login_user(request.data)
        return SuccessResponse(
            {
                "id": user.id,
                "name": user.first_name,
                "email": user.email,
                "auth_token": auth_token.key,
                "db_name": user.couchdb_db,
            }
        )


class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        user = request.user

        return SuccessResponse(
            {
                "db_username": user.username,
                "db_password": user.db_password,
            }
        )
