#!/bin/bash
set -e

PROJECT_ID="gwx-internship-01"
REGION="us-east1"
SERVICE_NAME="paisavasool-frontend"

IMAGE="us-east1-docker.pkg.dev/$PROJECT_ID/gwx-gar-intern-01/paisavasool-frontend:latest"

echo "Building frontend Docker image..."
docker build \
  --no-cache \
  --build-arg VITE_API_BASE_URL=/api \
  -t $IMAGE .

echo "Pushing image..."
docker push $IMAGE

echo "Deploying frontend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --platform=managed \
  --service-account gwx-cloudrun-sa-01@gwx-internship-01.iam.gserviceaccount.com \
  --min-instances=0 \
  --max-instances=2 \
  --min=0 \
  --max=2 \

echo "Frontend deployed 🚀"