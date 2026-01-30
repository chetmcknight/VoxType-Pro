#!/bin/bash
# Deploy to Google Cloud Run

# You may need to run 'gcloud auth login' and 'gcloud config set project [YOUR_PROJECT_ID]' first.

SERVICE_NAME="voxtype-pro-web"
REGION="us-west1"

echo "🚀 Deploying $SERVICE_NAME to Cloud Run..."

# Build and Deploy
# The --source . flag tells Cloud Run to build the container from source (using the Dockerfile)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080

echo "✅ Deployment command finished."
