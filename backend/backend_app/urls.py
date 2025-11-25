from backend_app import values
from django.contrib import admin
from django.urls import path

from day_wallet.views import RegisterView, LoginView, UserInfoView

api_path = values.API_PATH.strip('/') + '/'

urlpatterns = [
    path(api_path + "auth/register/", RegisterView.as_view(), name="auth-register"),
    path(api_path + "auth/login/", LoginView.as_view(), name="auth-login"),
    path(
        api_path + "auth/user-info/",
        UserInfoView.as_view(),
        name="auth-user-info",
    ),
    path("w_admin/", admin.site.urls),
]
