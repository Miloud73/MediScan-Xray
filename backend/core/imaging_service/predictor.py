import os

os.environ["TF_USE_LEGACY_KERAS"] = "1"
import numpy as np
import tensorflow as tf
from PIL import Image
from django.conf import settings

from .model.model_predict import predict_pneumonia as predict_resnet18_pneumonia


IMAGE_SIZE = 224

KERAS_MODEL_PATH = os.path.join(
    settings.BASE_DIR,
    "models",
    "final_densenet121_chexpert_multilabel.h5"
)

ALL_LABELS = [
    "No Finding",
    "Enlarged Cardiomediastinum",
    "Cardiomegaly",
    "Lung Opacity",
    "Lung Lesion",
    "Edema",
    "Consolidation",
    "Pneumonia",
    "Atelectasis",
    "Pneumothorax",
    "Pleural Effusion",
    "Pleural Other",
    "Fracture",
    "Support Devices"
]

_keras_model = None


def get_keras_model():
    global _keras_model

    if _keras_model is None:
        if not os.path.exists(KERAS_MODEL_PATH):
            raise FileNotFoundError(f"Keras model not found: {KERAS_MODEL_PATH}")

        _keras_model = tf.keras.models.load_model(
            KERAS_MODEL_PATH,
            compile=False
        )

    return _keras_model


def preprocess_for_keras(image_file):
    image_file.seek(0)

    image = Image.open(image_file).convert("RGB")
    image = image.resize((IMAGE_SIZE, IMAGE_SIZE))

    image_array = np.array(image).astype("float32")
    image_array = image_array / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    return image_array


def predict_chexpert_multilabel(image_file, threshold=0.3):
    image_array = preprocess_for_keras(image_file)
    model = get_keras_model()

    predictions = model.predict(image_array, verbose=0)[0]

    all_probabilities = []
    detected_diseases = []

    for label, probability in zip(ALL_LABELS, predictions):
        item = {
            "label": label,
            "probability": round(float(probability), 4),
            "percentage": round(float(probability) * 100, 2),
            "detected": bool(probability >= threshold)
        }

        all_probabilities.append(item)

        if probability >= threshold:
            detected_diseases.append(item)

    detected_diseases = sorted(
        detected_diseases,
        key=lambda x: x["probability"],
        reverse=True
    )

    top_prediction = max(
        all_probabilities,
        key=lambda x: x["probability"]
    )

    return {
        "model": "DenseNet121 CheXpert Multi-label",
        "threshold": threshold,
        "detected_diseases": detected_diseases,
        "top_prediction": top_prediction,
        "all_probabilities": all_probabilities,
        "probabilities": {
            item["label"]: item["probability"]
            for item in all_probabilities
        },
        "debug": {
            "model_path": KERAS_MODEL_PATH,
            "image_size": IMAGE_SIZE,
            "number_of_labels": len(ALL_LABELS)
        }
    }


def predict_combined_xray(image_file):
    """
    Pipeline final:
    1. ResNet18 détecte Pneumonia.
    2. DenseNet121 CheXpert détecte les autres pathologies.
    3. On fusionne les résultats.
    """

    # 1. ResNet18 pneumonia prediction
    image_file.seek(0)
    pneumonia_prediction = predict_resnet18_pneumonia(image_file)

    has_pneumonia = bool(pneumonia_prediction.get("has_pneumonia", False))
    pneumonia_confidence = float(pneumonia_prediction.get("confidence", 0.0))

    # 2. DenseNet121 multi-label prediction
    image_file.seek(0)
    multilabel_prediction = predict_chexpert_multilabel(
        image_file,
        threshold=0.3
    )

    # 3. Keep other diseases from multi-label model
    other_diseases = []

    for disease in multilabel_prediction["detected_diseases"]:
        label = disease["label"]

        if label not in ["No Finding", "Pneumonia"]:
            other_diseases.append(disease)

    # 4. Final detected diseases
    final_detected_diseases = []

    if has_pneumonia:
        final_detected_diseases.append({
            "label": "Pneumonia",
            "source_model": "ResNet18",
            "probability": round(pneumonia_confidence, 4),
            "percentage": round(pneumonia_confidence * 100, 2),
            "detected": True
        })

    for disease in other_diseases:
        disease["source_model"] = "DenseNet121 CheXpert"
        final_detected_diseases.append(disease)

    final_detected_diseases = sorted(
        final_detected_diseases,
        key=lambda x: x["probability"],
        reverse=True
    )

    if len(final_detected_diseases) == 0:
        final_status = "No major pathology detected"
    elif has_pneumonia and len(other_diseases) > 0:
        final_status = "Pneumonia with other findings"
    elif has_pneumonia:
        final_status = "Pneumonia detected"
    else:
        final_status = "Other pathology detected"

    return {
        "final_status": final_status,

        "has_pneumonia": has_pneumonia,
        "predicted_label": "Pneumonia" if has_pneumonia else multilabel_prediction["top_prediction"]["label"],
        "confidence": pneumonia_confidence if has_pneumonia else multilabel_prediction["top_prediction"]["probability"],

        "pneumonia_prediction": pneumonia_prediction,
        "multilabel_prediction": multilabel_prediction,

        "final_detected_diseases": final_detected_diseases,

        "probabilities": {
            "resnet18_pneumonia": pneumonia_confidence,
            **multilabel_prediction["probabilities"]
        },

        "debug": {
            "resnet18_model": "core/imaging_service/model/resnet18_ker.pth",
            "keras_model": KERAS_MODEL_PATH,
            "logic": "ResNet18 for Pneumonia, DenseNet121 for other CXR findings"
        }
    }