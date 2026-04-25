import os
import logging
import torch

from .model_architecture import build_model

logger = logging.getLogger(__name__)


class ModelLoader:
    _instance = None
    _model = None
    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelLoader()
        return cls._instance

    def _load_state_dict(self, path: str):
        state = torch.load(path, map_location=self._device, weights_only=False)
        if isinstance(state, dict) and "model_state" in state:
            return state["model_state"]
        return state

    def load_model(self):
        if self._model is None:
            try:
                model_dir = os.path.dirname(__file__)
                model_path = os.path.join(model_dir, "resnet18_ker.pth")

                logger.info("Loading ResNet18 model from %s", model_path)

                model = build_model(num_classes=2)
                state_dict = self._load_state_dict(model_path)
                model.load_state_dict(state_dict, strict=True)

                model.to(self._device)
                model.eval()

                self._model = model
                logger.info("ResNet18 model loaded successfully on %s", self._device)

            except Exception as e:
                logger.exception("Error loading ResNet18 model: %s", str(e))
                raise

        return self._model

    def get_model(self):
        return self.load_model()

    def get_device(self):
        return self._device