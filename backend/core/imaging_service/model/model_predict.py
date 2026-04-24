import io
import logging
from typing import Dict, Any

import numpy as np
from PIL import Image
import cv2
import torch

from .model_loader import ModelLoader

logger = logging.getLogger(__name__)

IMG_SIZE = 224
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]


def preprocess_base(img_bgr: np.ndarray, img_size: int = IMG_SIZE) -> np.ndarray:
    """
    Prétraitement multi-canal cohérent avec le notebook ensemble:
    - resize
    - grayscale
    - 3 canaux dérivés : normalized / equalized / blurred
    """
    img = cv2.resize(img_bgr, (img_size, img_size))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    norm = gray.astype(np.float32) / 255.0
    eq = cv2.equalizeHist(gray).astype(np.float32) / 255.0
    blur = cv2.GaussianBlur(gray, (3, 3), 0).astype(np.float32) / 255.0

    x = np.stack([norm, eq, blur], axis=-1)  # [H, W, 3]
    return x.astype(np.float32)


def normalize_tensor(x: torch.Tensor) -> torch.Tensor:
    mean = torch.tensor([0.5, 0.5, 0.5], dtype=torch.float32).view(3, 1, 1)
    std = torch.tensor([0.5, 0.5, 0.5], dtype=torch.float32).view(3, 1, 1)
    return (x - mean) / std


def load_image_from_upload(image_file) -> np.ndarray:
    image_file.seek(0)
    pil_img = Image.open(io.BytesIO(image_file.read())).convert("RGB")
    rgb = np.array(pil_img)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return bgr


def prepare_input_tensor(image_file, device: torch.device) -> torch.Tensor:
    """
    Prépare le tenseur attendu par ResNet / GoogLeNet:
    [B, C, H, W]
    """
    img_bgr = load_image_from_upload(image_file)
    x = preprocess_base(img_bgr, IMG_SIZE)               # [H,W,3]
    x = torch.from_numpy(x).permute(2, 0, 1).float()    # [C,H,W]
    x = normalize_tensor(x)
    x = x.unsqueeze(0).to(device)                        # [1,C,H,W]
    return x


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

        pred_idx = int(torch.argmax(probs, dim=1).item())
        pred_label = CLASS_NAMES[pred_idx]

        normal_prob = float(probs[0, 0].item())
        pneumonia_prob = float(probs[0, 1].item())

        has_pneumonia = pred_idx == 1
        confidence = pneumonia_prob if has_pneumonia else normal_prob

        result = {
            "has_pneumonia": has_pneumonia,
            "predicted_label": pred_label,
            "confidence": confidence,
            "probabilities": {
                "NORMAL": normal_prob,
                "PNEUMONIA": pneumonia_prob,
            },
        }

        logger.info("Prediction success: %s", result)
        return result

    except Exception as e:
        logger.exception("Error in pneumonia prediction: %s", str(e))
        raise