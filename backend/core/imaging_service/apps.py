from django.apps import AppConfig
import logging

from .model.model_loader import ModelLoader

logger = logging.getLogger(__name__)


class ImagingServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'imaging_service'

    def ready(self):
        # Preload models when Django starts
        try:
            ModelLoader.get_instance().get_models()
        except Exception as e:
            # Log error but don't crash the app
            logger.error(f"Failed to preload model: {str(e)}")