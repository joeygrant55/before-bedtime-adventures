# Before Bedtime Adventures

Transform your family vacation photos into magical, Disney-style children's storybooks.

## 🎨 What is This?

Before Bedtime Adventures is a web application that helps parents turn their vacation memories into beautifully illustrated hardcover children's books. Using AI-powered cartoon transformation, we convert your vacation photos into Disney/Pixar-style illustrations while maintaining character consistency across all pages.

### Key Features

- 📸 **Upload vacation photos** - Select 1-3 photos per stop on your journey
- 🎨 **AI cartoon transformation** - Gemini 3 Pro Image converts photos to Disney-style art
- ✏️ **Write your story** - Add text for each page (with AI suggestions)
- 👨‍👩‍👧‍👦 **Character consistency** - Same family members look consistent throughout the book
- 📚 **Print hardcover books** - Premium 8.5"x8.5" hardcover children's books delivered to your door

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (database + file storage)
- **Auth**: Clerk
- **AI**: Google Gemini 3 Pro Image API
- **Print**: Lulu Print-on-Demand API (coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Accounts needed:
  - [Convex](https://convex.dev) (free tier)
  - [Clerk](https://clerk.com) (free tier)
  - [Google AI Studio](https://ai.google.dev) for Gemini API

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate your `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
   - Auto-update your `.env.local` file

3. **Set up Clerk**
   - Go to [clerk.com](https://clerk.com) and create an application
   - Copy your publishable key and secret key
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
     CLERK_SECRET_KEY=sk_...
     ```

4. **Add your Gemini API key**
   - Already configured: `GEMINI_API_KEY=AIzaSyBUTa4YNqFN87Z9A0jWsSIxaoMn69gyWIU`

5. **Run the development server**
   ```bash
   npm run dev
   ```
   This runs both Next.js and Convex in parallel.

   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
before-bedtime-adventures/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout with Clerk + Convex providers
│   └── ConvexClientProvider.tsx
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries/mutations
│   └── books.ts           # Book queries/mutations
├── lib/                    # Utility libraries
│   └── gemini/            # Gemini AI integration
│       ├── client.ts
│       ├── cartoon-transform.ts
│       └── story-suggest.ts
├── components/             # React components (coming soon)
├── docs/                   # Technical documentation
│   ├── gemini-api-research.md
│   ├── print-on-demand-research.md
│   └── technical-architecture.md
└── middleware.ts          # Clerk authentication middleware
```

## 🗄️ Database Schema

See the full schema in `convex/schema.ts`. Key tables:

- **users** - User accounts (synced with Clerk)
- **books** - Book projects (title, status, character references)
- **pages** - Individual book pages (page number, location, story text)
- **images** - Photos and cartoons (original + AI-generated versions)
- **printOrders** - Print order tracking (status, Lulu integration)

## 🎯 Development Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Next.js + TypeScript + Tailwind setup
- [x] Convex database integration
- [x] Clerk authentication
- [x] Database schema design
- [x] Gemini API integration structure

### 🚧 Phase 2: Book Builder (In Progress)
- [ ] Book creation flow
- [ ] Image upload to Convex Storage
- [ ] Gemini cartoon transformation
- [ ] Character reference system
- [ ] Page editor with text input
- [ ] Drag-and-drop page reordering

### 📋 Phase 3: Preview & Polish
- [ ] Book preview component
- [ ] AI story text suggestions
- [ ] Style refinement options
- [ ] Mobile responsive design

### 🖨️ Phase 4: Print Integration
- [ ] PDF generation (8.5"x8.5" with bleed)
- [ ] Lulu API integration
- [ ] Payment processing (Stripe)
- [ ] Order tracking

### 🚀 Phase 5: Launch
- [ ] User testing
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Marketing site

## 🔑 Environment Variables

Create a `.env.local` file with:

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Convex (auto-filled by 'npx convex dev')
CONVEX_DEPLOYMENT=your_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🤝 Contributing

This is currently a private project under active development.

## 📚 Documentation

- [Technical Architecture](./docs/technical-architecture.md) - Full system design
- [Gemini API Research](./docs/gemini-api-research.md) - AI capabilities & implementation
- [Print-on-Demand Research](./docs/print-on-demand-research.md) - Lulu integration details

## 🎨 Design Principles

1. **Character Consistency** - Use Gemini 3 Pro Image's multi-reference capability
2. **User Control** - Parents write their own story, AI assists
3. **Quality First** - Premium hardcover books, professional printing
4. **Simplicity** - Easy upload → cartoon → order flow
5. **Magic & Wonder** - Disney-style art brings vacation memories to life

## 📝 Scripts

- `npm run dev` - Run Next.js + Convex in development mode
- `npm run build` - Build for production (Convex + Next.js)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx convex dev` - Run Convex backend only

## ⚡ Performance Notes

- Convex provides real-time updates for cartoon generation progress
- Character references are cached per book to reduce API calls
- Images stored in Convex Storage with automatic CDN delivery

## 🐛 Known Issues

- Gemini 3 Pro Image API integration is still in development (placeholder code)
- Lulu API integration is stubbed for future implementation
- Mobile responsive design needs optimization

## 📄 License

Private project - All rights reserved

---

**Built with ❤️ for families who want to preserve their vacation memories in magical storybooks**
# Trigger redeploy for Stripe key

# Force redeploy Fri Jan 30 13:51:02 EST 2026
