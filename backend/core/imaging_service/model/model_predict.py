import logging
from typing import Dict, Any

import cv2
import numpy as np
from PIL import Image
import torch

from .model_loader import ModelLoader

logger = logging.getLogger(__name__)


IMG_SIZE = 224


def prepare_input_tensor(image_file, device):
    image = Image.open(image_file).convert("L")
    image = np.array(image)

    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    image = image.astype(np.float32) / 255.0

    equalized = cv2.equalizeHist((image * 255).astype(np.uint8)).astype(np.float32) / 255.0
    blurred = cv2.GaussianBlur(image, (5, 5), 0).astype(np.float32)

    stacked = np.stack([image, equalized, blurred], axis=0)
    tensor = torch.tensor(stacked, dtype=torch.float32).unsqueeze(0).to(device)
    return tensor


@torch.no_grad()
def predict_pneumonia(image_file) -> Dict[str, Any]:
    try:
        loader = ModelLoader.get_instance()
        resnet, googlenet = loader.get_models()
        device = loader.get_device()

        inputs = prepare_input_tensor(image_file, device)

        logits_r = resnet(inputs)
        logits_g = googlenet(inputs)
        logits = (logits_r + logits_g) / 2.0

        logits = torch.nan_to_num(logits, nan=0.0, posinf=1e4, neginf=-1e4)
        probs = torch.softmax(logits, dim=1)
        probs = torch.nan_to_num(probs, nan=0.5, posinf=1.0, neginf=0.0)

        normal_prob = float(probs[0, 0].item())
        pneumonia_prob = float(probs[0, 1].item())

        predicted_label = "PNEUMONIA" if pneumonia_prob >= normal_prob else "NORMAL"
        has_pneumonia = predicted_label == "PNEUMONIA"
        confidence = max(normal_prob, pneumonia_prob)

        return {
            "predicted_label": predicted_label,
            "has_pneumonia": has_pneumonia,
            "confidence": confidence,
            "probabilities": {
                "NORMAL": normal_prob,
                "PNEUMONIA": pneumonia_prob,
            },
        }

    except Exception as e:
        logger.exception("Error in pneumonia prediction: %s", str(e))
        raise