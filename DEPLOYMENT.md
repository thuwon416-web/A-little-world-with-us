# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account
- Supabase project
- Production API keys

## Step 1: Prepare Environment Variables

1. Copy `.env.production.example` to `.env.production`
2. Fill in all required values with your production credentials
3. **Do not commit `.env.production` to git**

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

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20260101_setup.sql`
4. Verify tables are created

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
