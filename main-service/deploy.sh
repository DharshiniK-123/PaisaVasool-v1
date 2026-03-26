#!/bin/bash
set -e

PROJECT_ID="gwx-internship-01"
REGION="us-east1"
SERVICE_NAME="api-gateway"
IMAGE="us-east1-docker.pkg.dev/$PROJECT_ID/gwx-gar-intern-01/api-gateway:latest"
HTTP_TIMEOUT=10 


AUTH_SERVICE_URL="https://paisavasool-auth-service-aftp4q6tkq-ue.a.run.app"
MATCHING_SERVICE_URL="https://paisavasool-paymentmatching-service-aftp4q6tkq-ue.a.run.app"

echo "Building Docker image..."
docker build -t $IMAGE .

echo "Pushing image..."
docker push $IMAGE

echo "Deploying API Gateway..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --platform=managed \
  --service-account gwx-cloudrun-sa-01@gwx-internship-01.iam.gserviceaccount.com \
  --min-instances=0 \
  --max-instances=2 \
  --set-env-vars="AUTH_SERVICE_URL=$AUTH_SERVICE_URL,MATCHING_SERVICE_URL=$MATCHING_SERVICE_URL,HTTP_TIMEOUT=$HTTP_TIMEOUT"

echo "API Gateway deployed "