#!/bin/bash
set -e

PROJECT_ID="gwx-internship-01"
REGION="us-east1"
SERVICE_NAME="paisavasool-auth-service"

IMAGE="us-east1-docker.pkg.dev/$PROJECT_ID/gwx-gar-intern-01/paisavasool-auth-service:latest"

DB_HOST="34.23.138.181"
DB_PORT="5432"
DB_NAME="paisa_vasool_db"
DB_USER="dharshinik"
DB_PASSWORD='i43XN9FA9Omv#B7yftv'
CONN_NAME="gwx-internship-01:us-east1:gwx-csql-intern-01"
DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONN_NAME"
 

JWT_SECRET_KEY="secret_key"
JWT_REFRESH_SECRET_KEY="refresh_secret_key"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_MINUTES="60"
JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS="7"

echo "Building Docker image..."
docker build -t $IMAGE .

echo "Pushing image..."
docker push $IMAGE

echo "Deploying auth-service..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --platform=managed \
  --min-instances=0 \
  --max-instances=2 \
  --service-account gwx-cloudrun-sa-01@gwx-internship-01.iam.gserviceaccount.com \
  --add-cloudsql-instances=$CONN_NAME \
  --set-env-vars="DATABASE_URL=$DB_URL,JWT_SECRET_KEY=$JWT_SECRET_KEY,JWT_REFRESH_SECRET_KEY=$JWT_REFRESH_SECRET_KEY,JWT_ALGORITHM=$JWT_ALGORITHM,JWT_EXPIRATION_MINUTES=$JWT_EXPIRATION_MINUTES,JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS=$JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS"
echo "Auth service deployed "