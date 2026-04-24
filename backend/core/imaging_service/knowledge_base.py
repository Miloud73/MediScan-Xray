conditions = ["Normal", "Pneumonia"]

# Prior probabilities
priors = {
    "Normal": 0.70,
    "Pneumonia": 0.30,
}


def calculate(age: float, gender: str, has_pneumonia: bool) -> dict:
    """
    Simplified risk estimation using only:
    - age
    - gender
    - model pneumonia prediction

    Args:
        age: Patient age in years
        gender: 'male' or 'female'
        has_pneumonia: Whether the AI model predicts pneumonia

    Returns:
        Dictionary with probabilities for Normal and Pneumonia
    """
    posteriors = {
        "Normal": priors["Normal"],
        "Pneumonia": priors["Pneumonia"],
    }

    # Age adjustment: older age slightly increases pneumonia risk
    age_factor = min(1.0, max(0.0, age / 80.0))

    pneumonia_age_likelihood = 0.30 + (0.40 * age_factor)
    normal_age_likelihood = 1.0 - (0.20 * age_factor)

    posteriors["Pneumonia"] = posteriors["Pneumonia"] * pneumonia_age_likelihood / (
        posteriors["Pneumonia"] * pneumonia_age_likelihood
        + (1 - posteriors["Pneumonia"]) * (1 - pneumonia_age_likelihood)
    )

    posteriors["Normal"] = posteriors["Normal"] * normal_age_likelihood / (
        posteriors["Normal"] * normal_age_likelihood
        + (1 - posteriors["Normal"]) * (1 - normal_age_likelihood)
    )

    # Gender adjustment: small risk increase for male
    if str(gender).strip().lower() == "male":
        gender_factor = 1.1
        posteriors["Pneumonia"] = posteriors["Pneumonia"] * gender_factor / (
            posteriors["Pneumonia"] * gender_factor + (1 - posteriors["Pneumonia"])
        )

    # Strong adjustment from AI model output
    if has_pneumonia:
        posteriors["Pneumonia"] = max(posteriors["Pneumonia"], 0.95)
        posteriors["Normal"] = min(posteriors["Normal"], 0.05)
    else:
        posteriors["Normal"] = max(posteriors["Normal"], 0.95)
        posteriors["Pneumonia"] = min(posteriors["Pneumonia"], 0.05)

    return {
        "Normal": round(min(0.99, max(0.01, posteriors["Normal"])), 2),
        "Pneumonia": round(min(0.99, max(0.01, posteriors["Pneumonia"])), 2),
    }