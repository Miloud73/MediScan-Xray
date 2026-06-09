from django.urls import path
from .views import upload_scan


urlpatterns = [
    path("upload-scan/", upload_scan, name="upload_scan"),
]