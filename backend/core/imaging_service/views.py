from rest_framework.decorators import api_view, parser_classes, authentication_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .knowledge_base import calculate
from .predictor import predict_combined_xray

from django.contrib.auth import get_user_model
from django.db.models import Avg
from .models import ScanResult


from datetime import datetime
from dateutil.relativedelta import relativedelta


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_scan(request):
    """
    Upload a chest X-ray image, run multi-label pulmonary model inference,
    then combine pneumonia prediction with age + gender based analysis.
    """
    try:
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['image']

        patient_name = request.data.get('patientName')
        if not patient_name:
            return Response(
                {'error': 'Patient name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        patient_name = str(patient_name).strip()

        prediction = predict_combined_xray(image_file)

        has_pneumonia = prediction["has_pneumonia"]
        predicted_label = prediction["predicted_label"]
        confidence = prediction["confidence"]
        probabilities = prediction["probabilities"]

        birthdate_str = request.data.get('birthdate')
        if not birthdate_str:
            return Response(
                {'error': 'Birthdate is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            try:
                birthdate = datetime.fromisoformat(
                    birthdate_str.replace('Z', '+00:00')
                )
            except ValueError:
                birthdate = datetime.strptime(birthdate_str, '%m/%d/%Y')
        except ValueError:
            return Response(
                {'error': 'Invalid birthdate format. Please use YYYY-MM-DD or MM/DD/YYYY'},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = datetime.now()
        age = relativedelta(today, birthdate).years

        gender = str(request.data.get('gender', 'female')).strip().lower()
        if gender not in ['male', 'female']:
            return Response(
                {'error': 'Invalid gender value. Use male or female.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            params = {
                'age': float(age),
                'gender': gender,
                'has_pneumonia': has_pneumonia,
            }
        except (ValueError, TypeError) as e:
            return Response(
                {'error': f'Invalid parameter value: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = calculate(**params)

        result['patientName'] = patient_name
        result['age'] = age
        result['gender'] = gender

        result['prediction'] = {
            'label': predicted_label,
            'final_status': prediction["final_status"],
            'has_pneumonia': has_pneumonia,
            'confidence': confidence,
            'probabilities': probabilities,
            'debug': prediction.get('debug', {})
        }

        result['pneumonia_prediction'] = prediction["pneumonia_prediction"]

        result['multi_label_prediction'] = prediction["multilabel_prediction"]

        result['final_detected_diseases'] = prediction["final_detected_diseases"]
        other_diseases = [
            disease for disease in prediction["final_detected_diseases"]
            if disease["label"] not in ["Pneumonia", "No Finding"]
        ]

        if has_pneumonia:
            result['ui_decision'] = {
                "type": "pneumonia",
                "title": "Pneumonie détectée",
                "message": "Le système a détecté des signes compatibles avec une pneumonie. Veuillez suivre les recommandations affichées.",
                "specialist_required": False,
                "specialist": None,
                "diseases": prediction["final_detected_diseases"]
            }

        elif len(other_diseases) > 0:
            disease_names = [disease["label"] for disease in other_diseases]

            result['ui_decision'] = {
                "type": "other_pulmonary_disease",
                "title": "Anomalie pulmonaire détectée",
                "message": "L’image ne semble pas indiquer une pneumonie, mais le système a détecté une autre anomalie pulmonaire possible. Il est recommandé de consulter un spécialiste des poumons pour une interprétation médicale complète.",
                "specialist_required": True,
                "specialist": "Pneumologue",
                "diseases": other_diseases,
                "detected_labels": disease_names
            }

        else:
            result['ui_decision'] = {
                "type": "normal",
                "title": "Aucune pathologie majeure détectée",
                "message": "Le système n’a pas détecté de pneumonie ni d’autre anomalie pulmonaire significative. En cas de symptômes, veuillez consulter un professionnel de santé.",
                "specialist_required": False,
                "specialist": None,
                "diseases": []
            }
        scan = ScanResult.objects.create(
            patient_name=patient_name,
            age=age,
            gender=gender,
            diagnosis_type=result["ui_decision"]["type"],
            final_status=prediction["final_status"],
            has_pneumonia=has_pneumonia,
            confidence=confidence,
            detected_diseases=prediction["final_detected_diseases"],
            probabilities=probabilities,
            created_by=request.user
        )

        print("SCAN SAVED ID =", scan.id)

        return Response(result, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        
        
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    User = get_user_model()

    total_scans = ScanResult.objects.count()
    total_users = User.objects.count()

    pneumonia_count = ScanResult.objects.filter(
        diagnosis_type="pneumonia"
    ).count()

    anomaly_count = ScanResult.objects.filter(
        diagnosis_type="other_pulmonary_disease"
    ).count()

    normal_count = ScanResult.objects.filter(
        diagnosis_type="normal"
    ).count()

    male_count = ScanResult.objects.filter(gender="male").count()
    female_count = ScanResult.objects.filter(gender="female").count()

    avg_age = ScanResult.objects.aggregate(
        avg_age=Avg("age")
    )["avg_age"]

    scans = ScanResult.objects.order_by("-created_at")[:50]

    patients_data = []

    for scan in scans:
        patients_data.append({
            "id": scan.id,
            "patient_name": scan.patient_name,
            "age": scan.age,
            "gender": scan.gender,
            "diagnosis_type": scan.diagnosis_type,
            "final_status": scan.final_status,
            "has_pneumonia": scan.has_pneumonia,
            "confidence": scan.confidence,
            "detected_diseases": scan.detected_diseases,
            "created_at": scan.created_at,
            "created_by": scan.created_by.username if scan.created_by else None,
        })

    users = User.objects.all().order_by("-date_joined")

    users_data = []

    for user in users:
        users_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined,
        })

    return Response({
        "statistics": {
            "total_scans": total_scans,
            "total_users": total_users,
            "pneumonia_count": pneumonia_count,
            "anomaly_count": anomaly_count,
            "normal_count": normal_count,
            "male_count": male_count,
            "female_count": female_count,
            "average_age": round(avg_age, 2) if avg_age else 0,
        },
        "patients": patients_data,
        "users": users_data
    })