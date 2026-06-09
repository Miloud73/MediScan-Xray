from django.urls import path
from .views import upload_scan , admin_dashboard


urlpatterns = [
    path("upload-scan/", upload_scan, name="upload_scan"),
    path("admin-dashboard/", admin_dashboard, name="admin_dashboard"),
]