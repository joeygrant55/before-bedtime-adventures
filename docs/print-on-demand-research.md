# Print-on-Demand Research

## Recommended Provider: Lulu Print API

### Why Lulu?
- **Robust API** with full automation capabilities
- **Global fulfillment** (US, UK, EU, Australia, Canada, India)
- **Hardcover support** with multiple binding options
- **No upfront costs** - true print-on-demand
- **Free ISBNs** for broader distribution
- **White-label fulfillment** - books ship with no Lulu branding

## Lulu Hardcover Options for Children's Books

### Binding Types
1. **Hardcover Casewrap** - Premium feel, full-color cover wraps around boards
2. **Linen Hardcover with Dust Jacket** - Most premium option for children's books

### Available Sizes (Perfect for Our Use Case)
- **8.5" x 8.5"** ✅ RECOMMENDED - Industry standard for picture books
- **8" x 10"** - Traditional book layout
- **10" x 8"** - Landscape orientation option

### Print Specifications
- **Full-color interior** (required for our cartoon illustrations)
- **Premium paper stock** options
- **Bleed requirements**: Keep critical content at least 0.25" from edges
- **Resolution**: Minimum 300 DPI for images
- **File format**: PDF (print-ready)

## Pricing Model
- Per-book pricing based on:
  - Page count (our range: 10-20 pages)
  - Trim size (8.5x8.5)
  - Binding type (hardcover)
  - Color vs B&W interior (full color)
- Estimated cost per book: $8-15 (for 15-page hardcover, full color)
- We add our markup on top

## API Integration

### Key API Endpoints
```
POST /print-jobs/          # Create new print order
GET /print-jobs/{id}       # Check order status
GET /print-jobs/{id}/cost  # Get pricing quote
POST /print-files/         # Upload PDF for printing
```

### Workflow
1. User completes book in our app
2. Generate print-ready PDF (8.5x8.5, with bleed)
3. Call Lulu API to get cost estimate
4. User pays (our price = cost + markup)
5. Submit print job via API
6. Lulu prints and ships directly to customer
7. Webhook notification when shipped

### Print File Requirements
- **Dimensions**: 8.625" x 8.625" (8.5" + 0.125" bleed on all sides)
- **Cover**: Separate PDF or full cover spread
- **Interior**: One PDF with all pages
- **Color space**: CMYK (not RGB)
- **Fonts**: Embedded
- **Resolution**: 300+ DPI

## Implementation Plan

### Phase 1: Manual Testing
- Create test PDFs manually
- Use Lulu's web interface to order test prints
- Verify quality and specifications

### Phase 2: PDF Generation
- Build automated PDF generator in our app
- Implement proper bleed and margins
- Color space conversion (RGB → CMYK)
- Font embedding for children's book fonts

### Phase 3: API Integration (Stubbed Initially)
- Set up Lulu API credentials
- Implement cost estimation
- Create print order submission flow
- Add order tracking and webhooks

### Phase 4: Full Automation
- Automatic fulfillment on payment
- Order status updates to users
- Reorder functionality
- Bulk discount handling

## Alternative Providers

### Printful
- Good Shopify integration
- Limited hardcover book options
- Less robust API for custom books

### Blurb
- Great quality
- API available but less documented
- Higher pricing

### IngramSpark
- Best for distribution to retailers
- More complex setup
- Higher upfront costs

## Monetization Strategy

### Option 1: Markup Model
- Cost: $12 per book (estimated)
- Our Price: $29.99
- Profit: $17.99 per book

### Option 2: Subscription + Discounted Books
- Monthly: $9.99 (unlimited books)
- Book cost: $19.99 each
- Profit: Subscription + volume

### Option 3: Tiered Pricing
- First book: $34.99
- Additional books: $24.99 each
- Encourages multiple book creation

## Next Steps
1. Sign up for Lulu API access
2. Create test children's book PDF
3. Order test print to verify quality
4. Document exact PDF specifications
5. Build PDF generation pipeline
6. Stub API integration points
