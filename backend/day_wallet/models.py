from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
import secrets


class AppSettings(models.Model):
    name = models.CharField(max_length=255, primary_key=True)
    superuser = models.OneToOneField(
        "AppUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return f"<AppSettings: {self.name}>"

    class Meta:
        verbose_name = "Настройки приложения"
        verbose_name_plural = "Настройки приложения"


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


def generate_db_password() -> str:
    return secrets.token_urlsafe()


class AppUser(AbstractUser):
    email = models.EmailField(verbose_name="Email", unique=True)
    db_password = models.CharField(
        verbose_name="Пароль для CouchDB", max_length=255, default=generate_db_password
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: AppUserManager = AppUserManager()

    def save(self, *args, **kwargs):
        self.username = self.email
        super().save(*args, **kwargs)

    @property
    def name(self) -> str:
        return self.get_full_name()

    def get_full_name(self) -> str:
        return self.first_name

    @property
    def couchdb_db(self) -> str:
        return f"userdb-{self.username.encode().hex()}"

    def __str__(self) -> str:
        return f"<AppUser: {self.name} ({self.email})>"

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
