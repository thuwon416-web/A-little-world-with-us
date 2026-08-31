# Setup Instructions

## 1. Clone the repository

```bash
git clone <repo-url>
cd our-forever
```

## 2. Install dependencies

```bash
# Web app
npm install

# Mobile app
cd mobile
npm install
```

## 3. Setup environment variables

### Web app
```bash
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

### Mobile app
```bash
cd mobile
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

## 4. Setup Supabase

1. Create a new Supabase project
2. Run SQL migrations in `supabase/schema/`
3. Copy your project URL and anon key to `.env` files

## 5. Run the app

### Web app
```bash
npm run dev
```

### Mobile app
```bash
cd mobile
npm start
```

## 6. Build for production

### Web app
```bash
npm run build
```

### Mobile app
```bash
cd mobile
eas build --platform android --profile production
```
