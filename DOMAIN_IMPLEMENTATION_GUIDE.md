# Custom Domain Implementation Guide

## Immediate Actions Required

### 1. Configure Environment Variables (CRITICAL)

Add these environment variables to your production deployment:

```bash
# Vercel API Integration - REQUIRED for custom domains
VERCEL_API_TOKEN=your_vercel_api_token_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_TEAM_ID=your_team_id_here  # Only if using Vercel teams

# Application URL - REQUIRED for subdomain detection
NEXT_PUBLIC_APP_URL=https://wrk.so
```

#### How to Get These Values:

1. **VERCEL_API_TOKEN**:
   - Go to https://vercel.com/account/tokens
   - Create a new token with "Full Access" scope
   - Copy the token value

2. **VERCEL_PROJECT_ID**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → General
   - Copy the "Project ID" value

3. **VERCEL_TEAM_ID** (if applicable):
   - If your project is under a Vercel team
   - Go to team settings and copy the team ID
   - Leave empty if using personal account

### 2. Restart Application

After adding environment variables:
```bash
# If using Vercel
vercel --prod

# If using other platforms
# Restart your application server
```

### 3. Test Configuration

Use the new configuration check endpoint:
```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     https://your-domain.com/api/pro/domain/config-check
```

## Implementation Status

### ✅ Completed Improvements

1. **Enhanced Vercel API Error Handling**
   - Added configuration validation
   - Better error messages for missing credentials
   - Specific authentication failure detection

2. **Improved Domain Management UI**
   - Added retry logic with attempt tracking
   - Better error messaging and user guidance
   - Diagnostic button for troubleshooting
   - Visual loading indicators

3. **System Configuration Validation**
   - New API endpoint to check configuration status
   - Environment variable validation
   - Detailed debugging information

### 🔄 Ready to Deploy

The following files have been updated and are ready for deployment:

- `lib/vercel-api.ts` - Enhanced error handling and configuration validation
- `components/admin/domain-management.tsx` - Improved UI with retry logic and diagnostics
- `app/api/pro/domain/config-check/route.ts` - New configuration validation endpoint

## Testing Checklist

### Before Fixing Environment Variables:

1. **Current Behavior** (Expected to fail):
   ```bash
   # Try adding a domain - should fail with Vercel API configuration error
   # Check browser console for detailed error messages
   ```

2. **Check Current Configuration**:
   ```bash
   # In production, check if environment variables are set
   echo $VERCEL_API_TOKEN  # Should be empty
   echo $VERCEL_PROJECT_ID  # Should be empty
   ```

### After Adding Environment Variables:

1. **Test Configuration Endpoint**:
   ```bash
   # Should return status: "ready"
   GET /api/pro/domain/config-check
   ```

2. **Test Domain Addition**:
   - Add a test domain through the UI
   - Should successfully add to database and Vercel
   - Domain status should progress through: pending → dns_configured → active

3. **Test DNS Verification**:
   - Configure DNS records as instructed
   - Click "Verify Domain" - should succeed
   - Test domain accessibility in browser

## User Support Workflow

### For Support Team:

1. **Check System Configuration**:
   ```bash
   # Use the config check endpoint
   GET /api/pro/domain/config-check
   ```

2. **Run Domain Diagnostics**:
   ```bash
   # For specific domain issues
   POST /api/pro/domain/diagnostics
   {"domain": "customer-domain.com"}
   ```

3. **Common Issues & Solutions**:

   **"Vercel API configuration error"**:
   - Check environment variables are set
   - Verify Vercel API token has correct permissions

   **"DNS not configured"**:
   - Verify DNS records: `dig customer-domain.com CNAME`
   - Check DNS propagation: `nslookup customer-domain.com`

   **"SSL Pending"**:
   - Normal for new domains (2-5 minutes)
   - Can take up to 24 hours in rare cases

## Database Queries for Debugging

```sql
-- Check users with custom domains
SELECT 
  username, 
  customDomain, 
  domainStatus, 
  domainErrorMessage,
  domainVerifiedAt,
  subscriptionStatus
FROM user 
WHERE customDomain IS NOT NULL;

-- Check domain status distribution
SELECT 
  domainStatus, 
  COUNT(*) as count 
FROM user 
WHERE customDomain IS NOT NULL 
GROUP BY domainStatus;

-- Check recent domain additions
SELECT 
  username,
  customDomain,
  domainStatus,
  updatedAt
FROM user 
WHERE customDomain IS NOT NULL 
ORDER BY updatedAt DESC 
LIMIT 10;
```

## Expected Results After Implementation

### For Users:
- ✅ Can successfully add custom domains
- ✅ Clear DNS setup instructions
- ✅ Real-time verification progress
- ✅ Helpful error messages and retry options
- ✅ Working custom domain portfolios

### For Support:
- ✅ Configuration validation endpoint
- ✅ Detailed domain diagnostics
- ✅ Better error logging and tracking
- ✅ Clear troubleshooting steps

### For Developers:
- ✅ Environment variable validation
- ✅ Better error handling throughout the flow
- ✅ Debugging tools and endpoints
- ✅ Clearer code structure and error messages

## Rollback Plan

If issues occur after deployment:

1. **Quick Rollback**:
   ```bash
   # Remove environment variables temporarily
   unset VERCEL_API_TOKEN
   unset VERCEL_PROJECT_ID
   unset VERCEL_TEAM_ID
   ```

2. **Restore Previous Behavior**:
   - Previous UI will still work
   - Domains will fail to verify but won't break existing functionality
   - Database remains unchanged

3. **Check Logs**:
   ```bash
   # Look for Vercel API errors
   grep "Vercel API" /var/log/application.log
   ```

## Next Steps

1. **Deploy environment variables** (highest priority)
2. **Test with a domain you control**
3. **Monitor error logs for any issues**
4. **Update user documentation** with new DNS setup flow
5. **Train support team** on new diagnostic tools

---

*This guide provides everything needed to fix the custom domain functionality. The primary issue is missing Vercel API configuration, which prevents domains from being properly set up in Vercel's infrastructure.*