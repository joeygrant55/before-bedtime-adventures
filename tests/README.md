# BBA Playwright Tests

**Tests for the Cover Designer Typography Controls (Just Shipped!)**

## What's Tested

✅ **Font Picker**
- All 5 fonts render correctly (Playfair, Fredoka, Chewy, Poppins, Lora)
- Font changes update preview in real-time
- Screenshots of each font

✅ **Size Sliders**
- Title and subtitle size adjustment (1-5 scale)
- Preview updates correctly
- Visual regression screenshots

✅ **Color Pickers**
- All 6 color presets work
- Custom color picker functional
- Color applies to preview correctly

✅ **Position Selector**
- Top, center, bottom positions
- Layout changes correctly
- Screenshots of each position

✅ **Accessibility**
- Keyboard navigation works
- Color contrast meets WCAG AA
- ARIA labels present

✅ **Integration**
- Settings save correctly
- Settings persist on reload
- Full page visual regression

## Running Tests

### Quick Start
```bash
cd ~/Desktop/Slateworks.io/before-bedtime-adventures

# Run all tests (headed mode - watch it run!)
npm run test:e2e

# Run in headless mode
npm run test:e2e -- --headed=false

# Run specific test file
npm run test:e2e tests/cover-designer.spec.ts

# Run with UI (interactive mode)
npm run test:e2e -- --ui
```

### Commands

```bash
# Run tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test tests/cover-designer.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Show test report
npx playwright show-report

# Update screenshots (baseline)
npx playwright test --update-snapshots
```

## Screenshot Outputs

All screenshots are saved to:
```
before-bedtime-adventures/screenshots/
├── typography-font-playfair-display.png
├── typography-font-fredoka.png
├── typography-font-chewy.png
├── typography-font-poppins.png
├── typography-font-lora.png
├── typography-size-large.png
├── typography-size-small.png
├── typography-color-white.png
├── typography-color-gold.png
├── typography-position-top.png
├── typography-position-center.png
├── typography-position-bottom.png
└── cover-designer-full.png
```

## Visual Regression Testing

1. **Establish Baseline:**
   ```bash
   npx playwright test --update-snapshots
   ```

2. **Make UI Changes**

3. **Run Tests to Compare:**
   ```bash
   npx playwright test
   ```

4. **Review Differences:**
   ```bash
   npx playwright show-report
   ```

## CI/CD Integration

### GitHub Actions
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Playwright MCP Integration

To use Playwright MCP in your IDE for conversational testing:

### VS Code / Cursor / Windsurf
1. Open settings
2. Go to MCP section
3. Add new server:
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["@playwright/mcp@latest"]
       }
     }
   }
   ```

### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Usage with MCP
Once configured, you can ask your AI assistant:
- "Test the cover designer with all fonts"
- "Screenshot the typography controls"
- "Check accessibility on the cover page"
- "Compare before/after my UI changes"

## Test Structure

```typescript
test('should change title font when selected', async ({ page }) => {
  // Navigate to page
  await page.goto('/books/test-book-id/cover');
  
  // Interact with UI
  await page.getByText('Fredoka').click();
  
  // Verify result
  const previewTitle = page.locator('.preview h1').first();
  await expect(previewTitle).toHaveCSS('font-family', /Fredoka/);
  
  // Screenshot for visual verification
  await page.screenshot({ path: 'screenshots/font-fredoka.png' });
});
```

## Debugging Tests

```bash
# Debug mode (opens inspector)
npx playwright test --debug

# Debug specific test
npx playwright test tests/cover-designer.spec.ts --debug

# Headed + slowmo (watch in slow motion)
npx playwright test --headed --slow-mo=1000

# Generate test code (record actions)
npx playwright codegen http://localhost:3000
```

## Tips

**Before Running Tests:**
- Make sure app is running (`npm run dev`)
- Or let Playwright start it automatically (configured in `playwright.config.ts`)

**Common Issues:**
- "Target page, context or browser has been closed" → App crashed, check console
- "Timeout waiting for locator" → Element not found, check selector
- "Screenshots don't match" → UI changed, update snapshots with `--update-snapshots`

**Best Practices:**
- Use `getByRole` / `getByText` over CSS selectors when possible
- Add `data-testid` attributes for stable selectors
- Take screenshots for visual verification
- Run in both headed and headless modes
- Test keyboard navigation for accessibility

## Next Steps

1. **Add More Tests:**
   - Checkout flow
   - PDF generation
   - Story generation
   - Dashboard

2. **Visual Regression:**
   - Set up baseline screenshots
   - Run on every PR
   - Auto-detect UI breaks

3. **Performance:**
   - Add Lighthouse tests
   - Measure page load times
   - Check bundle sizes

4. **CI/CD:**
   - Run tests on every commit
   - Block merges if tests fail
   - Auto-comment on PRs with results
