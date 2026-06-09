from django.db import models
from django.conf import settings


class ScanResult(models.Model):
    patient_name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)

    diagnosis_type = models.CharField(max_length=100)
    final_status = models.CharField(max_length=255)
    has_pneumonia = models.BooleanField(default=False)
    confidence = models.FloatField(default=0.0)

    detected_diseases = models.JSONField(default=list, blank=True)
    probabilities = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} - {self.diagnosis_type}"