# Deployment Guide: Neon Database + Vercel

This guide walks you through setting up a Neon Postgres database and deploying the Tutor Quality System to Vercel.

## 🗄️ Part 1: Create Neon Database

### Step 1: Sign Up for Neon

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"** (you can use GitHub, Google, or email)
3. Complete the signup process

### Step 2: Create a New Project

1. Once logged in, click **"Create Project"**
2. Fill in the project details:
   - **Project Name**: `tutor-quality-system` (or any name you prefer)
   - **Region**: Choose closest to you (e.g., `US East (Ohio)`)
   - **PostgreSQL Version**: `16` (latest)
   - **Compute Size**: `Free` (perfect for MVP)
3. Click **"Create Project"**

### Step 3: Get Your Connection String

1. After the project is created, you'll see the **Connection Details** panel
2. Look for the **Connection String** - it will look like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Copy this connection string** - you'll need it for your `.env` file

### Step 4: Enable Connection Pooling (Important for Vercel)

1. In your Neon project dashboard, go to **Settings** → **Connection Pooling**
2. Enable **Connection Pooling** (this is required for serverless functions)
3. Copy the **Pooled Connection String** - it will look like:
   ```
   postgresql://username:password@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Use the pooled connection string** for Vercel deployment

### Step 5: Update Your Local `.env` File

1. Open your `.env` file in the project root
2. Paste the connection string:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   OPENAI_API_KEY=sk-your-key-here
   NODE_ENV=development
   ```

### Step 6: Push Database Schema

Run this command to create all tables in your Neon database:

```bash
npm run db:push
```

You should see output like:
```
✓ Pushed schema to database
```

### Step 7: Seed the Database (Optional)

Generate synthetic data for testing:

```bash
npm run db:seed
```

This will create:
- ~100 tutors
- ~2,500 students
- ~3,000 sessions

---

## 🚀 Part 2: Deploy to Vercel

### Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Tutor Quality System MVP"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (use GitHub for easiest integration)
3. Authorize Vercel to access your GitHub account

### Step 3: Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository (`Nerdy_48HourAIProductSprint` or whatever you named it)
3. Click **"Import"**

### Step 4: Configure Project Settings

Vercel should auto-detect Next.js, but verify:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 5: Add Environment Variables

**This is critical!** Add these environment variables in Vercel:

1. In the project import screen, scroll down to **"Environment Variables"**
2. Add each variable:

   **Variable 1:**
   - **Name**: `DATABASE_URL`
   - **Value**: Your **pooled** Neon connection string
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get from [platform.openai.com](https://platform.openai.com/api-keys))
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - **Environments**: ✅ Production

### Step 6: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. You'll see a success message with your deployment URL!

### Step 7: Set Up Database Schema in Production

After deployment, you need to push the schema to your production database:

**Option A: Use Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run database push (this will use your production DATABASE_URL)
vercel env pull .env.production
npm run db:push
```

**Option B: Use Neon Dashboard**

1. Go to your Neon project dashboard
2. Click **"SQL Editor"**
3. Run the schema manually (or use Drizzle Studio locally with production connection)

**Option C: Run Scripts via Vercel Functions**

Create a one-time API route to run migrations (delete after use):

```typescript
// src/app/api/migrate/route.ts (DELETE AFTER USE!)
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  // This would run your migrations
  // Only use this once, then delete the route!
  return Response.json({ success: true });
}
```

### Step 8: Seed Production Database (Optional)

If you want synthetic data in production:

```bash
# Set production env vars locally
vercel env pull .env.production

# Run seed script
npm run db:seed
```

---

## 🔒 Part 3: Enable Password Protection (Optional)

For MVP demo security:

1. In Vercel dashboard, go to your project
2. Navigate to **Settings** → **Deployment Protection**
3. Enable **"Password Protection"**
4. Set a password for your deployment
5. Save changes

Now visitors will need the password to access your dashboard.

---

## ✅ Verify Deployment

1. Visit your Vercel deployment URL
2. You should see the dashboard homepage
3. Navigate to `/tutors` - should show empty list (if no data seeded)
4. Check browser console for any errors

---

## 🐛 Troubleshooting

### Issue: "No database connection string provided"

**Solution**: Make sure `DATABASE_URL` is set in Vercel environment variables and you're using the **pooled** connection string.

### Issue: Build fails with database errors

**Solution**: The database connection is checked at build time. Make sure:
- `DATABASE_URL` is set in Vercel
- You're using the pooled connection string
- The database exists and is accessible

### Issue: "Table does not exist" errors

**Solution**: Run `npm run db:push` against your production database using the production connection string.

### Issue: API routes return 500 errors

**Solution**: 
1. Check Vercel function logs (Project → Deployments → Click deployment → Functions tab)
2. Verify `DATABASE_URL` is correct
3. Ensure database schema is pushed

### Issue: Slow API responses

**Solution**: 
- Make sure you're using the **pooled** connection string
- Check Neon dashboard for connection limits
- Consider upgrading Neon plan if needed

---

## 📊 Post-Deployment Checklist

- [ ] Database schema pushed to production
- [ ] Environment variables set in Vercel
- [ ] Database seeded (optional)
- [ ] Dashboard loads without errors
- [ ] API endpoints respond correctly
- [ ] Password protection enabled (if desired)
- [ ] Custom domain configured (optional)

---

## 🎉 You're Done!

Your Tutor Quality System is now live on Vercel! 

**Next Steps:**
1. Test all features in production
2. Record demo video (Task 10)
3. Share the deployment URL with stakeholders

---

## 💰 Cost Estimate

**Free Tier (MVP):**
- Neon: Free tier (0.5 GB storage, 1 project)
- Vercel: Free tier (unlimited deployments)
- OpenAI: Pay-per-use (~$2-3 for MVP demo)

**Total MVP Cost: ~$2-3** 🎉

