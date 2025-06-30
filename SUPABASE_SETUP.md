# Setting Up Real Supabase Authentication

## Step 1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Click "New Project"
4. Fill in the details:
   - **Organization**: Choose your organization
   - **Name**: `AI Resume Builder`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project" and wait for it to be created

## Step 2: Get Your Project Credentials

### API Credentials
1. Go to **Settings → API** in your Supabase dashboard
2. Copy the **Project URL** (looks like: `https://abcdefg.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)

### Database Credentials  
1. Go to **Settings → Database** in your Supabase dashboard
2. Scroll down to **Connection pooling**
3. Copy the **Connection string** 
4. Also copy the **Direct connection** string

## Step 3: Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# Replace with your actual Supabase project URL
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"

# Replace with your actual anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Keep your Gemini API key
GEMINI_API_KEY="AIzaSyC1Nz0Ta1Q8ihC8e3fSxIQ4qvcpCnSv1q8"

# Replace with your Supabase database URLs
DATABASE_URL="postgresql://postgres.project:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.project:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"
```

## Step 4: Push Database Schema

After updating your .env file, run:

```bash
npx prisma db push
```

## Step 5: Configure OAuth (Optional)

### For Google OAuth:
1. In Supabase dashboard: **Authentication → Providers**
2. Enable Google provider
3. Get credentials from Google Cloud Console
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### For GitHub OAuth:
1. In Supabase dashboard: **Authentication → Providers** 
2. Enable GitHub provider
3. Create GitHub OAuth App in your GitHub settings
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

## Step 6: Test Your Setup

1. Restart your development server: `npm run dev`
2. Go to `http://localhost:3000/auth`
3. Try creating an account
4. Check your email for confirmation link
5. After confirming, try signing in

## Troubleshooting

- **"Missing Supabase credentials"**: Double-check your .env file
- **Database connection errors**: Verify your DATABASE_URL is correct
- **Email not sending**: Check Supabase email settings in Authentication → Settings
