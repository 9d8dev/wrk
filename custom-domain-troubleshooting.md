# Custom Domain Troubleshooting Analysis

## Issue Summary
Users who upgrade to Pro can add a custom domain through the interface, but the domain doesn't actually work for serving their portfolio. This analysis identifies the root causes and provides solutions.

## Key Findings

### 1. **Missing Environment Configuration**
**Status: Critical Issue**

The system requires several Vercel API environment variables that appear to be missing:
- `VERCEL_API_TOKEN` - Required for domain management
- `VERCEL_PROJECT_ID` - Required to identify the Vercel project
- `VERCEL_TEAM_ID` - Optional, for team accounts

**Evidence:**
- Environment check shows `VERCEL_API_TOKEN` is empty
- All Vercel API calls in `lib/vercel-api.ts` will fail without proper authentication
- The `.env.example` file lists these variables but they're not configured

### 2. **Domain Verification Process Issues**
**Status: High Priority**

The domain verification workflow has multiple potential failure points:

**DNS Resolution Timing:**
- DNS changes can take up to 48 hours to propagate
- The system doesn't handle DNS propagation delays gracefully
- Users may get stuck in "pending" state even with correct DNS

**Vercel Integration Failures:**
- If Vercel API calls fail due to missing credentials, domains are marked as "error"
- No retry mechanism for transient Vercel API failures
- SSL certificate provisioning can fail silently

### 3. **Database State Management**
**Status: Medium Priority**

The domain status tracking has some gaps:
- Multiple status states: `pending`, `dns_configured`, `vercel_pending`, `ssl_pending`, `active`, `error`
- Complex state transitions that can get stuck
- `domainErrorMessage` field added in migration 0007 but not fully utilized in UI

### 4. **Middleware Routing Logic**
**Status: Low Priority (Working as Expected)**

The custom domain routing in `middleware.ts` appears correct:
- Properly detects custom domains vs subdomains
- Rewrites to `/_sites/[domain]` route
- Validates Pro subscription in `getUserByCustomDomain()`

## Root Cause Analysis

### Primary Issue: Missing Vercel API Configuration
Without proper Vercel API credentials:
1. Domains can be added to the database (status: `pending`)
2. DNS verification may succeed
3. Vercel domain addition fails silently
4. Domain never becomes `active`
5. Routing works but domain isn't properly configured in Vercel

### Secondary Issues:
1. **Poor Error Handling**: API failures aren't clearly communicated to users
2. **No Retry Logic**: Transient failures aren't automatically retried
3. **Complex Status Flow**: Users can get stuck in intermediate states

## Recommended Fixes

### 1. **Immediate Fix: Configure Vercel API**
**Priority: Critical**

```bash
# Add to production environment
VERCEL_API_TOKEN=<your_vercel_api_token>
VERCEL_PROJECT_ID=<your_project_id>
VERCEL_TEAM_ID=<your_team_id_if_applicable>
```

**How to get these values:**
- `VERCEL_API_TOKEN`: Generate at https://vercel.com/account/tokens
- `VERCEL_PROJECT_ID`: Found in project settings
- `VERCEL_TEAM_ID`: Only needed for team accounts

### 2. **Improve Error Handling**
**Priority: High**

**Current Issues:**
- Vercel API failures are logged but not shown to users
- DNS propagation delays appear as permanent failures

**Recommended Changes:**
- Add better error messages in the domain management UI
- Implement exponential backoff for Vercel API calls
- Add a "retry verification" button for failed domains

### 3. **Add Diagnostics UI**
**Priority: Medium**

The system already has a comprehensive diagnostics endpoint (`/api/pro/domain/diagnostics`). Add a UI to expose this:
- Show detailed DNS check results
- Display Vercel integration status
- Test HTTP/HTTPS accessibility
- Provide specific troubleshooting steps

### 4. **Simplify Status Flow**
**Priority: Low**

Consider consolidating the domain status states:
- `pending` - DNS not configured
- `configuring` - DNS configured, setting up infrastructure
- `active` - Domain fully working
- `error` - Failed with specific error message

## Quick Debug Steps

### For Immediate Testing:
1. **Check Environment Variables:**
   ```bash
   echo $VERCEL_API_TOKEN
   echo $VERCEL_PROJECT_ID
   ```

2. **Test DNS Resolution:**
   ```bash
   nslookup <domain>
   dig <domain> CNAME
   ```

3. **Check Database State:**
   ```sql
   SELECT username, customDomain, domainStatus, domainErrorMessage 
   FROM user 
   WHERE customDomain IS NOT NULL;
   ```

4. **Test Vercel API Connection:**
   ```bash
   curl -H "Authorization: Bearer $VERCEL_API_TOKEN" \
        https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID/domains
   ```

### For User Support:
1. Use the diagnostics endpoint to check domain status
2. Verify Pro subscription is active
3. Check DNS configuration matches requirements
4. Test domain accessibility via browser

## Implementation Priority

1. **Critical (Do First)**: Configure Vercel API environment variables
2. **High**: Improve error messaging and add retry logic
3. **Medium**: Add diagnostics UI for better troubleshooting
4. **Low**: Refactor status flow for simplicity

## Expected Outcome

After implementing these fixes:
- Users can successfully add and verify custom domains
- Clear error messages guide users through DNS setup
- Automatic retry handles transient failures
- Support team has tools to debug domain issues
- Pro users get reliable custom domain functionality

---

*This analysis was generated by examining the codebase structure, database migrations, API endpoints, and configuration requirements.*