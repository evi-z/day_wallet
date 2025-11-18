from day_wallet.models import AppSettings, AppUser
import os


def initialize_app(*args, **kwargs):
    app_name = os.getenv("BACKEND_APP_NAME")
    if not app_name:
        print("APP_NAME env is not set, skipping app initialization")
        return

    settings, _ = AppSettings.objects.get_or_create(name=app_name)

    superuser_username, superuser_password = (
        os.getenv("BACKEND_SUPERUSER_USERNAME"),
        os.getenv("BACKEND_SUPERUSER_PASSWORD"),
    )

    if not superuser_username or not superuser_password:
        return

    current_superuser = settings.superuser
    if not current_superuser:
        user = AppUser.objects.create_superuser(
            email=superuser_username,
            password=superuser_password,
        )

        settings.superuser = user
        settings.save(update_fields=["superuser"])
    else:
        if current_superuser.email != superuser_username:
            current_superuser.email = superuser_username

        current_superuser.set_password(superuser_password)
        current_superuser.save(update_fields=["email", "password"])
