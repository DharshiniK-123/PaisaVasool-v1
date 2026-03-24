#!/bin/bash
set -e

PROJECT_ID="gwx-internship-01"
REGION="us-east1"
SERVICE_NAME="api-gateway"
IMAGE="us-east1-docker.pkg.dev/$PROJECT_ID/gwx-gar-intern-01/api-gateway:latest"

DB_HOST="34.23.138.181"
DB_PORT="5432"
DB_NAME="paisa_vasool-db"
DB_USER="dharshinik"
DB_PASSWORD="i43XN9FA9Omv%23B7yftv"

REDIS_HOST="10.125.46.155"
REDIS_PORT="6379"

GCS_BUCKET="gwx-stg-intern-01"
GCS_FOLDER="dharshini"

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
  --set-env-vars="DB_HOST=$DB_HOST,DB_PORT=$DB_PORT,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD,REDIS_HOST=$REDIS_HOST,REDIS_PORT=$REDIS_PORT,GCS_BUCKET=$GCS_BUCKET,GCS_FOLDER=$GCS_FOLDER,AUTH_SERVICE_URL=$AUTH_SERVICE_URL,MATCHING_SERVICE_URL=$MATCHING_SERVICE_URL"

echo "API Gateway deployed "