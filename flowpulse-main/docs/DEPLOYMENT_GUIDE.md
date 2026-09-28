# 🚀 FlowPulse Deployment & Operations Guide

This guide provides instructions for deploying both the **Web Command Center** (`flowpulse_work`) and building the **Mobile Patient App** (`mobile`) for production environments.

---

## 1. Web Application Deployment (Next.js)

The Web Command Center is built on Next.js (App Router) and can be deployed to Vercel, AWS ECS, or any Node.js hosting platform.

### Deploying to Vercel

1. **Link Repository**:
   Connect your GitHub repository `Muthudeenathayalan/flowpulse` in the Vercel Dashboard.
2. **Root Directory**:
   Set the **Root Directory** setting to `flowpulse_work`.
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Docker Containerization (Self-Hosted)

Create a `Dockerfile` inside `flowpulse_work`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 2. Mobile Patient App Deployment (React Native / Expo)

The Mobile App is built using React Native with Expo SDK 52.

### Generating Android Production APK / AAB via EAS

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. **Configure Project**:
   ```bash
   cd mobile
   eas build:configure
   ```
3. **Build APK for Direct Sideloading / Testing**:
   ```bash
   eas build -p android --profile preview
   ```
4. **Build Android App Bundle (.aab) for Google Play Store**:
   ```bash
   eas build -p android --profile production
   ```

### Local Android Build via Gradle

1. Ensure Android SDK, NDK, and Java 17 (JDK) are installed and on `PATH`.
2. Navigate to `mobile/android`:
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```
3. The generated release APK will be located at:
   `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 3. Continuous Integration & Verification

FlowPulse features an automated GitHub Actions CI pipeline located in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

Every commit and pull request to `main` triggers:
- ✅ Strict TypeScript typechecking across Web and Mobile
- ✅ Unit and queue algorithm test execution
- ✅ Production build validation
