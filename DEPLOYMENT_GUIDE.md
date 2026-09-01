# Deployment Guide - A Little World With Us

## Prerequisites

Before deploying, ensure you have:
- A Supabase project (free tier is sufficient)
- A Vercel account (free tier is sufficient)
- Git repository with your code

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/log in
3. Click "New Project"
4. Name your project (e.g., "a-little-world-with-us-app")
5. Choose a region closest to your users
6. Set a strong database password (save this!)
7. Wait for project to be created (~2 minutes)

### 1.2 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon public key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.3 Run Database Schema
1. Go to SQL Editor in Supabase
2. Run the SQL from `supabase/schema.sql` (if available)
3. Or run the following to create basic tables:

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create couple_links table
CREATE TABLE IF NOT EXISTS couple_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couple_links(id),
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create more tables as needed...
```

### 1.4 Set Up Storage (Optional)
1. Go to Storage → Create bucket
2. Name it `uploads`
3. Make it public (for avatars, photos)

---

## Step 2: Configure Environment Variables

### 2.1 Update `.env.local` (Web)
Open `.env.local` in the root directory and update:

```bash
# Supabase (REQUIRED) - Replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# App (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional Features
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_AI_SERVICE_KEY=your-ai-service-key
```

### 2.2 Update `mobile/.env.local` (Mobile)
Open `mobile/.env.local` and update with the same Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
EXPO_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

### 3.3 Deploy
```bash
vercel --prod
```
This will:
- Build your Next.js app
- Deploy to Vercel
- Provide a URL (e.g., `https://a-little-world-with-us.vercel.app`)

### 3.4 Add Environment Variables in Vercel
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the same variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - (Optional) `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - (Optional) `NEXT_PUBLIC_AI_SERVICE_KEY`

### 3.5 Redeploy
After adding environment variables:
```bash
vercel --prod
```

---

## Step 4: Build Mobile App (Optional)

### 4.1 Install Expo CLI
```bash
npm install -g expo-cli
```

### 4.2 Update `mobile/app.json`
Update the `expo.name` and `expo.slug` to match your app name.

### 4.3 Build for Android
```bash
cd mobile
eas build --platform android
```

### 4.4 Build for iOS (requires Mac)
```bash
cd mobile
eas build --platform ios
```

---

## Step 5: Test Production

### 5.1 Test Web App
1. Open your Vercel URL
2. Test login functionality
3. Test chat, gallery, all features
4. Check console for errors

### 5.2 Test Mobile App
1. Test on physical device via Expo Go
2. Test biometric auth (if on supported device)
3. Test all features

---

## Step 6: Monitor & Maintain

### 6.1 Monitor Supabase
- Check dashboard for errors
- Monitor database size
- Review logs

### 6.2 Monitor Vercel
- Check deployment logs
- Monitor performance
- Set up error tracking (optional)

### 6.3 Supabase Auto-Pause (Free Tier)
Supabase free projects automatically pause after 1 week of inactivity:
- Check pause status: Supabase dashboard → Settings → Database
- If paused, the app will not function until manually resumed
- To prevent auto-pause:
  - **Option 1**: Upgrade to Pro tier ($25/month) for always-on database
  - **Option 2**: Set up an uptime monitoring service (e.g., UptimeRobot) to ping your app weekly
    - Create a free UptimeRobot account
    - Add monitor for your production URL
    - Set check interval to 5 minutes or weekly
    - This keeps your app active and prevents Supabase from pausing

---

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all dependencies are installed
- Check Node.js version (should be 18+)

### Auth Not Working
- Verify Supabase URL and keys
- Check RLS policies in Supabase

### Features Not Loading
- Check browser console for errors
- Verify API keys are correct
- Check network tab for failed requests

---

## Security Checklist

- [ ] Replace all placeholder credentials
- [ ] Use strong passwords
- [ ] Enable RLS policies in Supabase
- [ ] Don't commit `.env.local` to git
- [ ] Use HTTPS in production
- [ ] Regularly update dependencies

---

## Step 7: Custom Domain Setup (Recommended for Myanmar Access)

### 7.1 Why Custom Domain?
The default `*.vercel.app` domains may be blocked in Myanmar without VPN. Setting up a custom domain ensures reliable access.

### 7.2 Purchase a Domain
1. Choose a domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
2. Purchase a domain for your app (e.g., `alittleworldwithus.com`)
3. Save your registrar login credentials

### 7.3 Add Domain in Vercel
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `alittleworldwithus.com`)
4. Vercel will provide DNS records to configure

### 7.4 Configure DNS Records
In your domain registrar's DNS settings:
1. Add an **A record** pointing to Vercel's provided IP address
2. Or add a **CNAME record** pointing to Vercel's provided hostname
3. Wait for DNS propagation (typically 5-30 minutes)

### 7.5 Verify SSL
Vercel automatically provisions SSL certificates. Once DNS propagates:
1. Your domain will show "Valid Configuration" in Vercel
2. HTTPS will be enabled automatically
3. Redirect your root domain to `www` if desired

### 7.6 Test Custom Domain
1. Visit your custom domain in a browser
2. Verify the app loads correctly
3. Test all features
4. Test access from Myanmar if applicable

---

## Next Steps

After successful deployment:
1. Share the app with your partner
2. Customize the theme and colors
3. Add your own content (photos, memories)
4. Set up custom domain (recommended for Myanmar access)
5. Configure analytics (optional)

---

## Support

For issues:
- Check Vercel logs
- Check Supabase logs
- Review this guide
- Contact support if needed

---

**Last Updated:** 2024
**Version:** 1.0.0
