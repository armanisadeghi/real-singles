-- Add deployment status tracking columns to app_version table
-- These columns track Vercel deployment status via webhooks

-- Add deployment status column (pending, building, ready, error, canceled)
ALTER TABLE app_version 
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'pending';

-- Add Vercel deployment ID
ALTER TABLE app_version 
ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT;

-- Add Vercel deployment URL
ALTER TABLE app_version 
ADD COLUMN IF NOT EXISTS vercel_deployment_url TEXT;

-- Add deployment error message (if deployment fails)
ALTER TABLE app_version 
ADD COLUMN IF NOT EXISTS deployment_error TEXT;

-- Create index for efficient lookups by deployment ID
CREATE INDEX IF NOT EXISTS idx_app_version_vercel_deployment_id 
ON app_version(vercel_deployment_id);

-- Create index for efficient lookups by git commit (used by webhook to match deployments)
CREATE INDEX IF NOT EXISTS idx_app_version_git_commit 
ON app_version(git_commit);

-- Add comment explaining deployment_status values
COMMENT ON COLUMN app_version.deployment_status IS 
'Deployment status: pending (version created), building (Vercel building), ready (deployed successfully), error (deployment failed), canceled (deployment canceled)';
