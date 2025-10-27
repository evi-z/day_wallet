from django.contrib import admin
from django.urls import path

from day_wallet.views import RegisterView, LoginView, UserInfoView

urlpatterns = [
    path("api/v1/auth/register/", RegisterView.as_view(), name="auth-register"),
    path("api/v1/auth/login/", LoginView.as_view(), name="auth-login"),
    path(
        "api/v1/auth/user-info/",
        UserInfoView.as_view(),
        name="auth-user-info",
    ),
    path("w_admin/", admin.site.urls),
]
