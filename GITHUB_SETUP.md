# GitHub Actions to Google Cloud Run Setup

## Option 1: Service Account Key (Easier Setup)

### Step 1: Create Service Account
```bash
gcloud iam service-accounts create voxtype-pro-deployer \
  --display-name="VoxType Pro Deployer"
```

### Step 2: Grant Permissions
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Step 3: Generate Service Account Key
```bash
gcloud iam service-accounts keys create ~/voxtype-pro-key.json \
  --iam-account=voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Add GitHub Secrets
- Go to Repository → Settings → Secrets and variables → Actions
- Add `GCP_PROJECT_ID`: Your Google Cloud Project ID
- Add `GCP_SA_KEY`: The entire content of `voxtype-pro-key.json`

---

## Option 2: Workload Identity (More Secure)

### Step 1: Enable Required APIs
```bash
gcloud services enable iamcredentials.googleapis.com
gcloud services enable iap.googleapis.com
```

### Step 2: Create Workload Identity Pool
```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Pool"
```

### Step 3: Create Workload Identity Provider
```bash
gcloud iam workload-identity-pools providers create github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=attribute.repository" \
  --attribute-condition='attribute.repository=="chetmcknight/VoxType-Pro"'
```

### Step 4: Get Your Project Number
```bash
gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'
```

### Step 5: Allow Service Account to be Impersonated
```bash
gcloud iam service-accounts add-iam-policy-binding voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/chetmcknight/VoxType-Pro" \
  --role="roles/iam.workloadIdentityUser"
```

### Step 6: Update Workflow File
Replace the auth step in `.github/workflows/deploy.yml`:
```yaml
- name: 'Google Auth'
  id: 'auth'
  uses: 'google-github-actions/auth@v2'
  with:
    workload_identity_provider: 'projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
    service_account: 'voxtype-pro-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com'
```

---

## Enable Cloud APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Test Deployment
1. Commit and push changes to main branch
2. Check GitHub Actions tab for deployment progress

## Troubleshooting

### Error: "workflow must specify exactly one of..."
**Solution:** Use the service account key method (Option 1) for simplicity, or properly configure Workload Identity (Option 2).

### Error: "Permission denied"
**Solution:** Ensure service account has proper roles and GitHub secrets are correctly set.

### Build Fails
**Solution:** Check Dockerfile and ensure all dependencies are properly installed.

## Get Deployment URL
```bash
gcloud run services describe voxtype-pro \
  --region=us-central1 \
  --format='value(status.url)'
```