from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("w_admin/", admin.site.urls),
]
