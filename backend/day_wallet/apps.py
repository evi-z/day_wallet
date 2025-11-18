import os
from django.apps import AppConfig
from django.conf import settings
import sys

from django.db.models.signals import post_migrate


class DayWalletConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "day_wallet"

    def ready(self):
        from day_wallet.initial import initialize_app

        post_migrate.connect(initialize_app, sender=self)
