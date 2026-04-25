import os
import logging
import torch

from .model_architecture import build_resnet, build_googlenet

logger = logging.getLogger(__name__)


class ModelLoader:
    _instance = None
    _resnet = None
    _googlenet = None
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

    def load_models(self):
    if self._resnet is None or self._googlenet is None:
        try:
            model_dir = os.path.dirname(__file__)
            resnet_path = os.path.join(model_dir, "resnet_best.pth")
            googlenet_path = os.path.join(model_dir, "googlenet_best.pth")

            logger.info("Model dir: %s", model_dir)
            logger.info("ResNet exists: %s", os.path.exists(resnet_path))
            logger.info("GoogLeNet exists: %s", os.path.exists(googlenet_path))
            logger.info("Loading ResNet from %s", resnet_path)
            logger.info("Loading GoogLeNet from %s", googlenet_path)

            resnet = build_resnet(num_classes=2)
            googlenet = build_googlenet(num_classes=2)

            resnet_state = self._load_state_dict(resnet_path)
            googlenet_state = self._load_state_dict(googlenet_path)

            resnet.load_state_dict(resnet_state, strict=True)
            googlenet.load_state_dict(googlenet_state, strict=True)

            resnet.to(self._device)
            googlenet.to(self._device)

            resnet.eval()
            googlenet.eval()

            self._resnet = resnet
            self._googlenet = googlenet

            logger.info("ResNet + GoogLeNet loaded successfully on %s", self._device)

        except Exception as e:
            logger.exception("Error loading ensemble models: %s", str(e))
            raise

    return self._resnet, self._googlenet

    def get_models(self):
        return self.load_models()

    def get_device(self):
        return self._device