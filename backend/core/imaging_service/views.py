from rest_framework.decorators import api_view, parser_classes, authentication_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .knowledge_base import calculate
from datetime import datetime
from dateutil.relativedelta import relativedelta
from .model.model_predict import predict_pneumonia


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_scan(request):
    """
    Upload a medical scan image, run pneumonia model inference,
    then combine prediction with age + gender based analysis.
    """
    try:
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['image']

        prediction = predict_pneumonia(image_file)

        has_pneumonia = prediction["has_pneumonia"]
        predicted_label = prediction["predicted_label"]
        confidence = prediction["confidence"]
        probabilities = prediction["probabilities"]

        # birthdate -> age
        birthdate_str = request.data.get('birthdate')
        if not birthdate_str:
            return Response(
                {'error': 'Birthdate is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            try:
                birthdate = datetime.fromisoformat(birthdate_str.replace('Z', '+00:00'))
            except ValueError:
                birthdate = datetime.strptime(birthdate_str, '%m/%d/%Y')
        except ValueError:
            return Response(
                {'error': 'Invalid birthdate format. Please use YYYY-MM-DD or MM/DD/YYYY'},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = datetime.now()
        age = relativedelta(today, birthdate).years

        # gender
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

        result['age'] = age
        result['gender'] = gender
        result['prediction'] = {
            'label': predicted_label,
            'has_pneumonia': has_pneumonia,
            'confidence': confidence,
            'probabilities': probabilities,
        }

        return Response(result, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )