from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class AppUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields) -> "AppUser":
        return super().create_user(email, email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields) -> "AppUser":
        return super().create_superuser(email, email, password, **extra_fields)

    async def acreate_user(self, email, password=None, **extra_fields) -> "AppUser":
        return await super().acreate_user(email, email, password, **extra_fields)

    async def acreate_superuser(
        self, email, password=None, **extra_fields
    ) -> "AppUser":
        return await super().acreate_superuser(email, email, password, **extra_fields)


class AppUser(AbstractUser):
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: AppUserManager = AppUserManager()

    def save(self, *args, **kwargs):
        self.username = self.email
        super().save(*args, **kwargs)

    def get_full_name(self) -> str:
        return self.first_name

    def __str__(self) -> str:
        return f"<AppUser: {self.name} ({self.email})>"

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
