from django.apps import AppConfig


class ImagingServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'imaging_service'

    def ready(self):
        # Do not preload models on startup in low-memory environments.
        pass