# Environment Setup Guide

## Quick Setup

This guide will help you set up the environment variables for both web and mobile versions of Our Forever App.

---

## Required Environment Variables

### Web (`.env.local`)

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_PASSWORD=your-secure-password

# Optional Features
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_AI_SERVICE_KEY=your-ai-service-key
NEXT_PUBLIC_ANNIVERSARY=2024-01-01
NEXT_PUBLIC_PIN_CODE=1234
NEXT_PUBLIC_COUPLE_START=2024-01-01
```

### Mobile (`mobile/.env.local`)

```bash
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration (REQUIRED)
EXPO_PUBLIC_APP_URL=http://localhost:3000
EXPO_PUBLIC_APP_PASSWORD=your-secure-password

# Optional Features
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
EXPO_PUBLIC_AI_SERVICE_KEY=your-ai-service-key
```

---

## Getting Supabase Credentials

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project creation (~2 minutes)

### 2. Get Your Credentials
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 3. Update Your `.env.local` Files
Replace the placeholder values with your actual Supabase credentials.

---

## Getting Google Maps API Key (Optional)

### 1. Go to Google Cloud Console
1. Visit [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing one

### 2. Enable Maps JavaScript API
1. Go to **APIs & Services** → **Library**
2. Search for "Maps JavaScript API"
3. Click "Enable"

### 3. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Add to your `.env.local` files

---

## Getting AI Service Key (Optional)

Currently, this is optional. You can use the built-in AI features without this key.

---

## Testing Your Setup

### Test Web
```bash
npm run dev
```
Visit `http://localhost:3000` and check for console errors.

### Test Mobile
```bash
cd mobile
npx expo start
```
Scan the QR code with Expo Go app on your phone.

---

## Production Deployment

When deploying to production:

1. **Update `NEXT_PUBLIC_APP_URL`** to your production URL:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

2. **Add Environment Variables to Vercel**:
   - Go to Vercel project settings
   - Add all the variables from `.env.local`

3. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## Common Issues

### "Supabase not configured" error
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Ensure you're using the anon key, not the service role key

### "Authentication failed" error
- Check that `NEXT_PUBLIC_APP_PASSWORD` matches between web and mobile
- Verify the password is set in both `.env.local` files

### Build fails
- Ensure all required environment variables are set
- Check that values don't have extra spaces or quotes
- Verify file names are exactly `.env.local` (not `.env.local.txt`)

---

## Security Notes

- **Never commit `.env.local` to git**
- It's already in `.gitignore`
- Don't share your `.env.local` files
- Use strong passwords
- Don't use the service role key in public variables

---

## Next Steps

After setting up environment variables:
1. Run the app locally to test
2. Check all features work
3. Follow the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to deploy

---

**Need help?** Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.
