from rest_framework.decorators import api_view, parser_classes, authentication_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .knowledge_base import calculate
from .predictor import predict_combined_xray

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

        return Response(result, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )