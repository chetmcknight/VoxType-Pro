# Setup Guide for GitHub to Google Cloud Run Auto-Deployment

## Prerequisites
- Google Cloud Platform project with Cloud Run API enabled
- Google Cloud SDK installed locally
- Docker installed locally

## Step 1: Set up Google Cloud Service Account

1. Create a service account:
```bash
gcloud iam service-accounts create voxtype-pro-deployer \
  --display-name="VoxType Pro Deployer" \
  --description="Service account for GitHub deployments"
```

2. Grant necessary permissions:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

3. Generate and download the service account key:
```bash
gcloud iam service-accounts keys create ~/voxtype-pro-key.json \
  --iam-account=voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Step 2: Configure GitHub Repository Secrets

1. Go to your GitHub repository: Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID
   - `GCP_SA_KEY`: The entire content of your service account key JSON file

## Step 3: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 4: Test the Deployment

1. Commit and push any changes to the `main` branch
2. Go to Actions tab in your GitHub repository
3. Monitor the deployment progress

## What Happens on Push

1. **GitHub Action triggers** on push to `main` branch
2. **Docker image is built** using your existing Dockerfile
3. **Image is pushed** to Google Container Registry (GCR)
4. **Cloud Run service is updated** with the new image
5. **Service becomes available** at the Cloud Run URL

## Get Your Cloud Run URL

After first deployment, get your service URL:
```bash
gcloud run services describe voxtype-pro \
  --region=us-central1 \
  --format='value(status.url)'
```

## Monitoring

- View deployment logs in GitHub Actions
- Monitor service in Google Cloud Console → Cloud Run
- Check service logs with:
```bash
gcloud logs read "resource.type=cloud_run_revision" \
  --limit=50 \
  --format="table(textPayload)"
```

## Manual Deployment (if needed)

To deploy manually without pushing to GitHub:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/voxtype-pro:latest .
docker push gcr.io/YOUR_PROJECT_ID/voxtype-pro:latest
gcloud run deploy voxtype-pro \
  --image gcr.io/YOUR_PROJECT_ID/voxtype-pro:latest \
  --region us-central1 \
  --allow-unauthenticated
```