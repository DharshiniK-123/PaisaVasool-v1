
#!/bin/bash
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Define common project variables
PROJECT_ID="gwx-internship-01"
REGION="us-east1"
SERVICE_NAME="paisavasool-auth-service"
IMAGE="us-east1-docker.pkg.dev/$PROJECT_ID/gwx-gar-intern-01/paisavasool-auth-service:latest"
CONN_NAME="gwx-internship-01:us-east1:gwx-csql-intern-01"



# Database settings
DB_USER="dharshinik"
DB_HOST="${DB_HOST:-34.23.138.181}"
DB_PORT="5432"
DB_NAME="paisa_vasool_db"
DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONN_NAME"


ADMIN_SEED_PASSWORD="Dharshini@#123"
# JWT Settings
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_MINUTES="60"
JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS="7"

# Service Settings
REDIS_HOST="localhost"
REDIS_PORT="6379"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_EMAIL="dharsveni@gmail.com"


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
  --set-env-vars="DB_USER=$DB_USER,DATABASE_URL=$DB_URL,JWT_SECRET_KEY=$JWT_SECRET_KEY,JWT_REFRESH_SECRET_KEY=$JWT_REFRESH_SECRET_KEY,JWT_ALGORITHM=$JWT_ALGORITHM,JWT_EXPIRATION_MINUTES=$JWT_EXPIRATION_MINUTES,JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS=$JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD,DB_HOST=$DB_HOST,DB_PORT=$DB_PORT,DB_NAME=$DB_NAME,REDIS_HOST=$REDIS_HOST,REDIS_PORT=$REDIS_PORT,SMTP_SERVER=$SMTP_SERVER,SMTP_PORT=$SMTP_PORT,SMTP_EMAIL=$SMTP_EMAIL,SMTP_PASSWORD=$SMTP_PASSWORD,ADMIN_SEED_PASSWORD=$ADMIN_SEED_PASSWORD"

echo "Auth service deployed!"