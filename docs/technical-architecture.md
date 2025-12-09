# Technical Architecture - Before Bedtime Adventures

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui or custom components
- **State Management**: React Context + Server Actions
- **Image Upload**: react-dropzone
- **Drag & Drop**: @dnd-kit/core
- **PDF Generation**: jsPDF or react-pdf

### Backend
- **API Routes**: Next.js App Router API routes
- **Database**: Convex (serverless database with real-time capabilities)
- **File Storage**: Convex Storage (built-in)
- **Authentication**: Clerk

### External APIs
- **Image Generation**: Google Gemini 3 Pro Image API
- **Text AI Assistance**: Google Gemini API
- **Print-on-Demand**: Lulu Print API

### Deployment
- **Hosting**: Vercel
- **Database + Storage**: Convex (auto-deployed with `convex deploy`)
- **CI/CD**: Vercel automatic deployments

## Database Schema (Convex)

### Users
```typescript
users: defineTable({
  clerkId: v.string(),           // Clerk user ID
  email: v.string(),
  name: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_clerk_id", ["clerkId"])
```

### Books
```typescript
books: defineTable({
  userId: v.id("users"),
  title: v.string(),
  pageCount: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("generating"),
    v.literal("ready_to_print"),
    v.literal("ordered"),
    v.literal("completed")
  ),
  characterImages: v.array(v.id("_storage")), // Convex storage IDs
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
```

### Pages
```typescript
pages: defineTable({
  bookId: v.id("books"),
  pageNumber: v.number(),
  title: v.optional(v.string()),     // Stop/location name
  storyText: v.optional(v.string()), // User-written text
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_book", ["bookId"])
  .index("by_book_and_page", ["bookId", "pageNumber"])
```

### Images
```typescript
images: defineTable({
  pageId: v.id("pages"),
  originalImageId: v.id("_storage"),         // Original photo in Convex storage
  cartoonImageId: v.optional(v.id("_storage")), // Cartoon in Convex storage
  generationStatus: v.union(
    v.literal("pending"),
    v.literal("generating"),
    v.literal("completed"),
    v.literal("failed")
  ),
  order: v.number(),              // For 1-3 images per page
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_page", ["pageId"])
  .index("by_status", ["generationStatus"])
```

### PrintOrders
```typescript
printOrders: defineTable({
  bookId: v.id("books"),
  luluOrderId: v.optional(v.string()),
  status: v.union(
    v.literal("pending_payment"),
    v.literal("payment_received"),
    v.literal("generating_pdf"),
    v.literal("submitted_to_lulu"),
    v.literal("printing"),
    v.literal("shipped"),
    v.literal("delivered"),
    v.literal("failed")
  ),
  pdfStorageId: v.optional(v.id("_storage")), // PDF in Convex storage
  cost: v.number(),                           // In cents
  price: v.number(),                          // In cents
  shippingAddress: v.object({
    name: v.string(),
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_book", ["bookId"])
  .index("by_status", ["status"])
```

**Key Benefits of Convex:**
- Real-time updates: Users see cartoon generation progress live
- Built-in file storage: No separate S3/Blob needed
- Type-safe: Full TypeScript integration
- Serverless: No database management
- Automatic migrations: Schema changes are seamless

## Application Architecture

### User Flows

#### 1. Landing Page → Sign Up
```
/ (landing) → /auth/signup → /dashboard
```

#### 2. Create New Book
```
/dashboard → /books/new
  ↓
1. Enter book title
2. Choose number of stops/pages (10-20)
3. Upload character reference photos (optional but recommended)
  ↓
/books/[id]/edit
```

#### 3. Build Book Pages
```
/books/[id]/edit
  ↓
For each page:
  - Upload 1-3 vacation photos
  - Photos sent to Gemini API → cartoon transformation
  - Write/edit story text for the page
  - AI suggestions for story text (via Gemini)
  - Preview cartoon result
  - Reorder pages via drag-and-drop
  ↓
/books/[id]/preview (full book preview)
```

#### 4. Order Physical Book
```
/books/[id]/preview → /books/[id]/checkout
  ↓
1. Generate print-ready PDF
2. Get cost estimate from Lulu
3. Enter shipping address
4. Payment processing
5. Submit to Lulu API
6. Order confirmation
  ↓
/orders/[id] (track order status)
```

## API Architecture

### Gemini Integration
```typescript
// lib/gemini/cartoon-transform.ts
export async function transformToCartoon(
  imageUrl: string,
  characterReferences: string[] = [],
  style: string = "Disney Pixar"
): Promise<string>

// lib/gemini/story-suggest.ts
export async function suggestStoryText(
  imageUrl: string,
  context: string
): Promise<string>
```

### Print Pipeline
```typescript
// lib/print/generate-pdf.ts
export async function generatePrintReadyPDF(
  bookId: string
): Promise<string> // Returns PDF URL

// lib/print/lulu-client.ts
export async function submitPrintOrder(
  pdfUrl: string,
  shippingAddress: Address
): Promise<PrintOrder>

export async function getOrderStatus(
  luluOrderId: string
): Promise<OrderStatus>
```

## Component Structure

```
app/
├── (marketing)/
│   ├── page.tsx                    # Landing page
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── dashboard/page.tsx          # User's books list
│   ├── books/
│   │   ├── new/page.tsx            # Create new book
│   │   └── [id]/
│   │       ├── edit/page.tsx       # Book builder
│   │       ├── preview/page.tsx    # Full preview
│   │       └── checkout/page.tsx   # Order flow
│   └── orders/
│       └── [id]/page.tsx           # Order tracking
└── api/
    ├── gemini/
    │   ├── transform/route.ts      # Image → cartoon
    │   └── suggest-text/route.ts   # AI story suggestions
    ├── print/
    │   ├── generate-pdf/route.ts
    │   └── submit-order/route.ts
    └── webhooks/
        └── lulu/route.ts           # Order status updates

components/
├── book-builder/
│   ├── PageEditor.tsx              # Single page editing
│   ├── ImageUploader.tsx           # Multi-image upload
│   ├── CartoonPreview.tsx          # Show cartoon transformation
│   ├── TextEditor.tsx              # Story text input
│   └── PageReorder.tsx             # Drag-and-drop reordering
├── preview/
│   ├── BookPreview.tsx             # Flipbook-style preview
│   └── PageSpread.tsx              # Two-page spread view
└── ui/                             # Reusable UI components
    ├── button.tsx
    ├── card.tsx
    └── ...

lib/
├── gemini/
│   ├── client.ts                   # Gemini API client
│   ├── cartoon-transform.ts        # Image transformation
│   └── story-suggest.ts            # Text generation
└── print/
    ├── lulu-client.ts              # Lulu API client (stubbed)
    ├── generate-pdf.ts             # PDF generation
    └── pdf-specs.ts                # 8.5x8.5 specs

convex/
├── schema.ts                       # Database schema
├── users.ts                        # User queries/mutations
├── books.ts                        # Book queries/mutations
├── pages.ts                        # Page queries/mutations
├── images.ts                       # Image queries/mutations
└── printOrders.ts                  # Print order queries/mutations
```

## Development Phases

### Phase 1: Foundation (Week 1)
- ✅ Project setup (Next.js + TypeScript + Tailwind)
- ✅ Convex database setup
- ✅ Clerk authentication setup
- ✅ Database schema (Convex)
- [ ] Landing page design polish

### Phase 2: Book Builder (Week 2-3)
- [ ] Book creation flow
- [ ] Image upload system
- [ ] Gemini API integration for cartoon transformation
- [ ] Character reference system
- [ ] Text editor
- [ ] Page reordering

### Phase 3: Preview & Polish (Week 4)
- [ ] Book preview component
- [ ] Gemini text suggestions
- [ ] Style refinement options
- [ ] Mobile responsiveness

### Phase 4: Print Integration (Week 5-6)
- [ ] PDF generation (8.5x8.5 with bleed)
- [ ] Lulu API stub
- [ ] Manual order testing
- [ ] Payment integration (Stripe)

### Phase 5: Launch (Week 7-8)
- [ ] Full Lulu automation
- [ ] Order tracking
- [ ] User testing
- [ ] Performance optimization
- [ ] Launch! 🚀

## Notes for Using Claude Sonnet 4.5
When building complex features, leverage Claude Sonnet 4.5 for:
- Complex state management patterns
- Optimized image processing pipelines
- Gemini API prompt engineering
- PDF generation with precise specifications
- Error handling and edge cases
- Performance optimizations
