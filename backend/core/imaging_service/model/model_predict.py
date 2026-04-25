import logging
from typing import Dict, Any

from PIL import Image
import torch
from torchvision import transforms

from .model_loader import ModelLoader

logger = logging.getLogger(__name__)

INPUT_SIZE = 224

inference_transform = transforms.Compose([
    transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


def prepare_input_tensor(image_file, device):
    image = Image.open(image_file).convert("RGB")
    tensor = inference_transform(image).unsqueeze(0).to(device)
    return tensor


@torch.no_grad()
def predict_pneumonia(image_file) -> Dict[str, Any]:
    try:
        loader = ModelLoader.get_instance()
        model = loader.get_model()
        device = loader.get_device()

        inputs = prepare_input_tensor(image_file, device)

        logits = model(inputs)
        probs = torch.softmax(logits, dim=1)

        normal_prob = float(probs[0, 0].item())
        pneumonia_prob = float(probs[0, 1].item())

        confidence = max(normal_prob, pneumonia_prob)

        if confidence < 0.70:
            predicted_label = "UNCERTAIN"
            has_pneumonia = False
        else:
            predicted_label = "PNEUMONIA" if pneumonia_prob >= normal_prob else "NORMAL"
            has_pneumonia = predicted_label == "PNEUMONIA"

        return {
            "predicted_label": predicted_label,
            "has_pneumonia": has_pneumonia,
            "confidence": confidence,
            "probabilities": {
                "NORMAL": normal_prob,
                "PNEUMONIA": pneumonia_prob,
            },
            "debug": {
                "selected_model": "resnet18_kermany_code5",
                "preprocessing": {
                    "mode": "RGB",
                    "resize": [224, 224],
                    "normalize_mean": [0.485, 0.456, 0.406],
                    "normalize_std": [0.229, 0.224, 0.225],
                }
            }
        }

    except Exception as e:
        logger.exception("Error in pneumonia prediction: %s", str(e))
        raise