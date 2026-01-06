# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Before Bedtime Adventures transforms family vacation photos into Disney/Pixar-style illustrated children's storybooks using AI-powered cartoon transformation.

## Development Commands

```bash
npm run dev          # Start Next.js + Convex dev servers in parallel
npm run build        # Build for production (runs convex deploy then next build)
npm run lint         # Run ESLint
npx convex dev       # Run Convex backend only (for debugging)
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Convex (serverless database + file storage + real-time subscriptions)
- **Auth**: Clerk (wraps app in ClerkProvider → ConvexClientProvider)
- **AI**: Google Gemini 3 Pro Image API for photo-to-cartoon transformation

### Key Data Flow

1. **Image Upload**: `ImageUpload.tsx` → `images.generateUploadUrl` → Convex Storage → `images.createImage`
2. **AI Transformation**: `transformImage.transformToDisney` (Convex action) fetches image from storage, calls Gemini API, stores result back to Convex Storage
3. **Real-time Updates**: Convex subscriptions automatically update UI when `generationStatus` changes (pending → generating → completed/failed)

### Database Schema (`convex/schema.ts`)

- **users**: Synced with Clerk via `clerkId`
- **books**: User's book projects with status (draft → generating → ready_to_print → ordered → completed)
- **pages**: Book pages with `pageNumber`, `title`, `storyText`
- **images**: Links pages to storage, tracks `generationStatus` and both `originalImageId` and `cartoonImageId`
- **printOrders**: Lulu print integration (stubbed for future)

### Convex Patterns

- **Queries** (`query`): Read data, automatically subscribe to updates
- **Mutations** (`mutation`): Write data, transactional
- **Actions** (`action`): Call external APIs (Gemini), can read storage directly via `ctx.storage.get()`
- Storage IDs use `v.id("_storage")` type

### Route Structure

- `/` - Landing page (public)
- `/dashboard` - User's books list (protected)
- `/books/new` - Create new book
- `/books/[id]/edit` - Book editor with page navigator, image upload, text editing
- `/settings` - User settings

### Auth Middleware

`middleware.ts` uses Clerk's `createRouteMatcher` to protect all routes except `/`, `/sign-in`, `/sign-up`. Unauthenticated users are redirected to landing page.

## Environment Variables

Required in `.env.local`:
```
GEMINI_API_KEY=           # Google Gemini API key
CONVEX_DEPLOYMENT=        # Auto-set by npx convex dev
NEXT_PUBLIC_CONVEX_URL=   # Auto-set by npx convex dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Image Handling Notes

- HEIC/HEIF files are explicitly rejected (browser compatibility issues)
- Max file size: 10MB
- Supported formats: JPEG, PNG only
- Images converted to base64 for Gemini API in chunks (8192 bytes) to avoid memory issues
- Gemini responses contain `inlineData.data` (base64) which gets stored back to Convex Storage

## Git Workflow (IMPORTANT)

This project has git hooks to prevent lost work. Follow these practices:

### Before Starting Work
```bash
git status                    # Check for uncommitted changes
git fetch origin              # Get latest from remote
git log origin/main..HEAD     # See any unpushed local commits
```

### After Making Changes
```bash
git add .
git commit -m "description"   # Post-commit hook will auto-push
```

### NEVER Do These Without Checking First
- `git reset --hard` - Use `git stash` instead
- `git rebase` - The pre-rebase hook will warn about unpushed commits
- `git pull --rebase` - Can orphan local commits if conflicts occur

### If Something Goes Wrong
```bash
git reflog                    # Shows all recent HEAD movements
git show <commit-hash>        # Inspect orphaned commits
git cherry-pick <commit>      # Recover specific commits
```

### Installed Git Hooks
- **post-commit**: Auto-pushes after each commit
- **pre-rebase**: Warns about unpushed commits before rebasing
- **pre-push**: Warns before force pushing
