# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account
- Supabase project
- Production API keys

## Step 1: Prepare Environment Variables

1. Copy `.env.example` to `.env.production` (or enter its values in your hosting dashboard).
2. Fill in the required values with your production credentials, including the Upstash Redis variables.
3. **Do not commit `.env.production` to git**.

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

### 3.2 Add Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

**Optional (for AI features):**
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- And other AI API keys as needed

**Optional (for notifications):**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

**Optional (for error tracking):**
- `SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_SENTRY_DSN`

**Optional (for analytics):**
- `NEXT_PUBLIC_GA_ID`

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. App will be live at https://your-app.vercel.app

## Step 4: Setup Database

1. Go to your Supabase project and open SQL Editor.
2. Apply any required base schema files from `supabase/schema/` first. For the current features, this includes `couple-linking.sql` and `care-daily-logs-phase15.sql`.
3. Run every migration below in filename order:

   ```text
   20260101_setup.sql
   20260102_add_user_settings_and_notifications.sql
   20260103_add_couple_location_sharing.sql
   20260104_designate_thuwon_admin.sql
   20260105_make_daily_care_logs_unique.sql
   ```

4. Sign out and sign back in as `thuwon416@gmail.com` after migration `20260104` to refresh its admin role.
5. Verify the `profiles`, `couple_links`, `care_daily_logs`, `user_locations`, `user_settings`, and `notifications` tables exist before testing the app.

## Step 5: Custom Domain (Optional)

### 5.1 In Vercel

1. Go to Project Settings → Domains
2. Add your domain: `alittleworldwithus.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### 5.2 DNS Configuration

Add the following records to your domain registrar:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 6: Post-Deployment Checklist

- [ ] App loads at production URL
- [ ] Authentication works
- [ ] Database connection successful
- [ ] AI features work (if API keys configured)
- [ ] Notifications work (if VAPID keys configured)
- [ ] PWA installs correctly
- [ ] SSL certificate is active
- [ ] Analytics tracking works (if GA ID configured)
- [ ] Error monitoring works (if Sentry configured)

## Step 7: Monitor

### Analytics

- Check Google Analytics dashboard for user data
- Monitor page views and user behavior

### Error Monitoring

- Check Sentry dashboard for errors
- Set up alerts for critical issues

### Performance

- Use Vercel Analytics to monitor performance
- Check Lighthouse scores
- Monitor build times

## Troubleshooting

### Build Fails

1. Check build logs in Vercel
2. Verify all environment variables are set
3. Check for missing dependencies

### Database Connection Issues

1. Verify Supabase URL and keys
2. Check Supabase logs
3. Ensure RLS policies are correct

### API Keys Not Working

1. Verify keys are correct
2. Check API rate limits
3. Ensure keys have proper permissions

## Rollback

If deployment fails:

```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel will automatically redeploy previous version
```

## Support

For issues:
- Check Vercel docs: https://vercel.com/docs
- Check Supabase docs: https://supabase.com/docs
- Contact support: support@alittleworldwithus.com
