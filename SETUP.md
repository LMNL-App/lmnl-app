# LMNLapp.com - Setup & Run Guide

This guide will help you set up and run the LMNL app locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo CLI** - Will be installed via npx
- **Git** - [Download](https://git-scm.com/)
- **Expo Go app** on your phone (for testing) - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

For iOS development (macOS only):
- **Xcode** - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)

For Android development:
- **Android Studio** - [Download](https://developer.android.com/studio)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd lmnl-app

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Add your Supabase credentials to .env (see Supabase Setup below)

# 5. Start the development server
npm start
```

---

## Supabase Setup

LMNL uses [Supabase](https://supabase.com) for authentication, database, and storage.

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in the details:
   - **Name:** `lmnl` (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose the closest to your users
4. Click **"Create new project"** and wait for setup (~2 minutes)

### Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 3: Configure Environment Variables

Edit your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Run each migration file in order:

**Migration 1: Initial Schema**
- Copy contents of `supabase/migrations/001_initial_schema.sql`
- Paste into SQL Editor and click **"Run"**

**Migration 2: Functions & Triggers**
- Copy contents of `supabase/migrations/002_functions_triggers.sql`
- Paste into SQL Editor and click **"Run"**

**Migration 3: Storage Policies**
- Copy contents of `supabase/migrations/003_storage.sql`
- Paste into SQL Editor and click **"Run"**

**Optional: Seed Data**
- Copy contents of `supabase/seed.sql`
- Paste into SQL Editor and click **"Run"**
- This adds sample sponsored posts for testing

### Step 5: Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Click **"New Bucket"**
3. Create two buckets:

   | Bucket Name | Public |
   |-------------|--------|
   | `avatars`   | Yes    |
   | `posts`     | Yes    |

4. For each bucket, ensure "Public bucket" is enabled

### Step 6: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Optionally configure:
   - **Confirm email:** Enable/disable email verification
   - **Secure email change:** Recommended to enable

---

## Custom Domain Integration (lmnlapp.com)

If you are hosting the web build and want the app’s links to resolve to `lmnlapp.com`, complete the steps below.

### Step 1: Point DNS to Your Web Host

1. Build and deploy the web app to your hosting provider (e.g., Vercel, Netlify, Cloudflare Pages).
2. In your DNS provider:
   - Create a **CNAME** for `www` pointing to your host’s domain.
   - Create an **A/ALIAS** record for the root (`@`) pointing to your host’s IP/alias target.
3. Wait for DNS propagation and verify `https://lmnlapp.com` resolves.

### Step 2: Enable HTTPS

Most hosts provision SSL automatically. Confirm the certificate is active for both:
- `lmnlapp.com`
- `www.lmnlapp.com`

### Step 3: Update Supabase Auth URLs

In Supabase **Authentication** → **URL Configuration**:
- **Site URL:** `https://lmnlapp.com`
- **Redirect URLs:** add `https://lmnlapp.com/**` and `https://www.lmnlapp.com/**`

This ensures email magic links and OAuth redirects return to your domain.

### Step 4: Update In-App Links

Links used in sharing and settings should use the new domain. The current references live in:
- `app/profile/[id].tsx`
- `app/(tabs)/profile.tsx`
- `app/settings/about.tsx`
- `app/settings/privacy.tsx`

Consider centralizing the base URL in a config constant to avoid hardcoding it in multiple places.

### Step 5: Configure Universal Links (iOS) and App Links (Android)

To have `https://lmnlapp.com` open the mobile app:

1. Ensure these config entries exist in `app.json`:
   - iOS: `associatedDomains` includes `applinks:lmnlapp.com` and `applinks:www.lmnlapp.com`
   - Android: `intentFilters` include the `https` host for `lmnlapp.com` and `www.lmnlapp.com`
2. Host the required association files on your domain:
   - iOS: `https://lmnlapp.com/.well-known/apple-app-site-association`
   - Android: `https://lmnlapp.com/.well-known/assetlinks.json`
3. Make sure the association files reference your app IDs:
   - iOS: `appID` = `<APPLE_TEAM_ID>.com.lmnl.app`
   - Android: `package_name` = `com.lmnl.app` and the signing certificate fingerprint
4. Rebuild the app (EAS or local build) so the OS can verify the links.

Once configured, opening a share link like `https://lmnlapp.com/u/<username>` will launch the app and route to the profile screen.

---

## Running the App

### Development Server

```bash
# Start Expo development server
npm start

# Or with specific options
npm run android    # Open in Android emulator
npm run ios        # Open in iOS simulator (macOS only)
npm run web        # Open in web browser
```

### Using Expo Go (Recommended for Quick Testing)

1. Start the development server: `npm start`
2. Scan the QR code with:
   - **iOS:** Camera app
   - **Android:** Expo Go app
3. The app will load on your device

### Using Emulators/Simulators

**Android Emulator:**
```bash
# Ensure Android Studio and an AVD are set up
cd C:\Users\Samin\AppData\Local\Android\Sdk\emulator
.\emulator -avd Pixel_9_Pro_API_35
npm run android
```

**iOS Simulator (macOS only):**
```bash
# Ensure Xcode is installed
npm run ios
```

---

## Project Structure

```
lmnl-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Feed
│   │   ├── search.tsx       # Search/Discover
│   │   ├── create.tsx       # Create Post
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── settings/            # Settings screens
│   ├── onboarding/          # First-time user flow
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── feed/            # Feed-specific components
│   │   └── profile/         # Profile components
│   ├── stores/              # Zustand state management
│   │   ├── authStore.ts
│   │   ├── feedStore.ts
│   │   ├── usageStore.ts
│   │   └── themeStore.ts
│   ├── lib/                 # External service integrations
│   │   ├── supabase.ts      # Supabase client
│   │   ├── auth.ts          # Auth utilities
│   │   └── storage.ts       # File storage utilities
│   ├── utils/               # Helper functions
│   ├── constants/           # App constants
│   └── types/               # TypeScript types
├── supabase/
│   ├── migrations/          # SQL migration files
│   └── seed.sql             # Sample data
├── assets/                  # Images, fonts, etc.
├── .env.example             # Environment template
├── app.json                 # Expo configuration
├── package.json
└── tsconfig.json
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start in web browser |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

---

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked to auth.users) |
| `posts` | User posts and sponsored content |
| `interactions` | Likes and comments (unified) |
| `daily_usage` | Tracks daily limits per user |
| `follows` | Follower/following relationships |
| `notifications` | In-app notifications |
| `sponsored_posts` | Advertisement content |
| `push_tokens` | Expo push notification tokens |

### Daily Limits (Enforced Server-Side)

| User Type | Posts | Likes | Comments | Feed Posts |
|-----------|-------|-------|----------|------------|
| Standard | 5/day | 5/day | 5/day | 10/day |
| Verified Educational | 2/day | 5/day | 5/day | 10/day |

---

## Troubleshooting

### Common Issues

**"Unable to connect to Supabase"**
- Check your `.env` file has correct credentials
- Ensure there are no extra spaces or quotes
- Restart the development server after changing `.env`

**"RLS policy error" or "Permission denied"**
- Run all migration files in order
- Check that RLS is enabled on all tables
- Verify the policies were created successfully

**"Storage bucket not found"**
- Create `avatars` and `posts` buckets in Supabase Dashboard
- Ensure they are set to public

**Metro bundler issues**
```bash
# Clear cache and restart
npx expo start --clear
```

**Dependency issues**
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

**iOS build issues (macOS)**
```bash
cd ios && pod install && cd ..
```

### Getting Help

- Check [Expo Documentation](https://docs.expo.dev/)
- Check [Supabase Documentation](https://supabase.com/docs)
- Review the `plan.md` file for architectural decisions
- Review the `claude.md` file for AI assistant context

---

## Development Tips

### Adding New Screens

1. Create a new file in `app/` directory
2. Expo Router automatically creates routes based on file structure
3. Use existing screens as templates

### Adding New Components

1. Create component in `src/components/`
2. Export from the appropriate `index.ts` barrel file
3. Follow existing patterns for theming and styling

### Modifying Database Schema

1. Create a new migration file in `supabase/migrations/`
2. Number it sequentially (e.g., `004_new_feature.sql`)
3. Run the migration in Supabase SQL Editor
4. Update TypeScript types in `src/types/database.ts`

### Testing Daily Limits

The daily limits reset at midnight in the user's timezone. For testing:

1. Create test interactions to reach limits
2. Manually reset in Supabase Dashboard:
   ```sql
   UPDATE daily_usage
   SET posts_count = 0, likes_count = 0, comments_count = 0, posts_viewed = 0
   WHERE user_id = 'your-user-id';
   ```

---

## Deployment

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### App Store Submission

1. Update `app.json` with production values
2. Create app icons and splash screens
3. Build production versions with EAS
4. Submit through App Store Connect (iOS) and Google Play Console (Android)

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and conventions
3. Run type checking before committing: `npm run typecheck`
4. Test on both iOS and Android if possible
5. Submit a pull request with clear description

---

## License

[Add your license here]

---

## Support

For questions or issues, please [create an issue](link-to-issues) or contact the development team.

npx expo run:android --variant release