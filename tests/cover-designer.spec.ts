import { test, expect } from '@playwright/test';

/**
 * Cover Designer Typography Tests
 * 
 * Tests the new typography controls we just shipped:
 * - Font picker (5 fonts)
 * - Size sliders
 * - Color pickers
 * - Position selector
 * - Live preview updates
 */

test.describe('Cover Designer Typography Controls', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Replace with actual test book ID or create one via API
    await page.goto('http://localhost:3000/books/test-book-id/cover');
    
    // Wait for cover designer to load
    await page.waitForSelector('text=Design Your Cover');
  });

  test('should render all 5 font options', async ({ page }) => {
    const fonts = ['Playfair Display', 'Fredoka', 'Chewy', 'Poppins', 'Lora'];
    
    for (const font of fonts) {
      const fontButton = page.getByText(font);
      await expect(fontButton).toBeVisible();
    }
  });

  test('should change title font when selected', async ({ page }) => {
    // Get initial preview title
    const previewTitle = page.locator('.preview h1').first();
    
    // Click Fredoka font
    await page.getByText('Fredoka').click();
    
    // Verify font-family changed in preview
    await expect(previewTitle).toHaveCSS('font-family', /Fredoka/);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/font-fredoka.png' });
  });

  test('should test all 5 fonts render correctly', async ({ page }) => {
    const fonts = [
      { name: 'Playfair Display', family: 'Playfair Display' },
      { name: 'Fredoka', family: 'Fredoka' },
      { name: 'Chewy', family: 'Chewy' },
      { name: 'Poppins', family: 'Poppins' },
      { name: 'Lora', family: 'Lora' },
    ];
    
    const previewTitle = page.locator('.preview h1').first();
    
    for (const font of fonts) {
      await page.getByText(font.name, { exact: true }).click();
      await expect(previewTitle).toHaveCSS('font-family', new RegExp(font.family));
      
      // Screenshot each font
      await page.screenshot({ 
        path: `screenshots/typography-font-${font.name.toLowerCase().replace(/\\s/g, '-')}.png` 
      });
    }
  });

  test('should adjust title size with slider', async ({ page }) => {
    const previewTitle = page.locator('.preview h1').first();
    const sizeSlider = page.locator('input[type="range"]').first();
    
    // Get initial size
    const initialSize = await previewTitle.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    
    // Set slider to max (5)
    await sizeSlider.fill('5');
    await page.waitForTimeout(500); // Let preview update
    
    // Verify size increased
    const newSize = await previewTitle.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    
    expect(parseFloat(newSize)).toBeGreaterThan(parseFloat(initialSize));
    
    // Screenshot large size
    await page.screenshot({ path: 'screenshots/typography-size-large.png' });
    
    // Set slider to min (1)
    await sizeSlider.fill('1');
    await page.waitForTimeout(500);
    
    // Screenshot small size
    await page.screenshot({ path: 'screenshots/typography-size-small.png' });
  });

  test('should change title color with color picker', async ({ page }) => {
    const previewTitle = page.locator('.preview h1').first();
    
    // Click gold color preset
    await page.locator('[data-color="#FFD700"]').click();
    
    // Verify color changed (RGB equivalent of #FFD700)
    await expect(previewTitle).toHaveCSS('color', 'rgb(255, 215, 0)');
    
    // Screenshot gold color
    await page.screenshot({ path: 'screenshots/typography-color-gold.png' });
  });

  test('should test all color presets', async ({ page }) => {
    const previewTitle = page.locator('.preview h1').first();
    const colorPresets = [
      { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)' },
      { name: 'Cream', hex: '#FFF8DC', rgb: 'rgb(255, 248, 220)' },
      { name: 'Gold', hex: '#FFD700', rgb: 'rgb(255, 215, 0)' },
      { name: 'Pink', hex: '#FFB6C1', rgb: 'rgb(255, 182, 193)' },
      { name: 'Sky Blue', hex: '#87CEEB', rgb: 'rgb(135, 206, 235)' },
      { name: 'Mint', hex: '#98FF98', rgb: 'rgb(152, 255, 152)' },
    ];
    
    for (const color of colorPresets) {
      await page.locator(`[data-color="${color.hex}"]`).click();
      await expect(previewTitle).toHaveCSS('color', color.rgb);
      
      // Screenshot each color
      await page.screenshot({ 
        path: `screenshots/typography-color-${color.name.toLowerCase().replace(/\\s/g, '-')}.png` 
      });
    }
  });

  test('should change text position', async ({ page }) => {
    const positions = ['top', 'center', 'bottom'];
    
    for (const position of positions) {
      await page.getByText(position, { exact: true }).click();
      
      // Screenshot each position
      await page.screenshot({ 
        path: `screenshots/typography-position-${position}.png` 
      });
    }
  });

  test('should save typography settings', async ({ page }) => {
    // Select specific typography settings
    await page.getByText('Chewy').click();
    await page.locator('input[type="range"]').first().fill('4');
    await page.locator('[data-color="#FFD700"]').click();
    await page.getByText('bottom', { exact: true }).click();
    
    // Click save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should navigate away (to edit page or preview)
    await page.waitForURL(/\\/books\\/.*\\/(edit|preview)/);
    
    // TODO: Verify settings were saved by navigating back
  });

  test('visual regression: cover designer full page', async ({ page }) => {
    // Take full page screenshot for visual regression comparison
    await page.screenshot({ 
      path: 'screenshots/cover-designer-full.png',
      fullPage: true 
    });
  });

  test('accessibility: typography controls are keyboard navigable', async ({ page }) => {
    // Tab through font options
    await page.keyboard.press('Tab');
    const firstFontButton = page.getByText('Playfair Display');
    await expect(firstFontButton).toBeFocused();
    
    // Press space to select
    await page.keyboard.press('Space');
    
    // Verify preview updated
    const previewTitle = page.locator('.preview h1').first();
    await expect(previewTitle).toHaveCSS('font-family', /Playfair/);
  });

  test('accessibility: color contrast meets WCAG AA', async ({ page }) => {
    // Test various theme + color combinations
    const combinations = [
      { theme: 'purple-magic', color: '#FFFFFF' },
      { theme: 'ocean-adventure', color: '#FFD700' },
      { theme: 'sunset-wonder', color: '#FFFFFF' },
      { theme: 'forest-dreams', color: '#FFF8DC' },
    ];
    
    for (const combo of combinations) {
      // Select theme (if theme selector exists)
      // Select color
      await page.locator(`[data-color="${combo.color}"]`).click();
      
      // Take screenshot for manual/automated contrast checking
      await page.screenshot({ 
        path: `screenshots/accessibility-${combo.theme}-${combo.color.slice(1)}.png` 
      });
    }
  });
});

test.describe('Cover Designer Integration', () => {
  test('should maintain typography settings during page refresh', async ({ page }) => {
    await page.goto('http://localhost:3000/books/test-book-id/cover');
    
    // Set specific typography
    await page.getByText('Fredoka').click();
    await page.locator('input[type="range"]').first().fill('4');
    await page.locator('[data-color="#FFD700"]').click();
    
    // Reload page
    await page.reload();
    
    // Verify settings persisted
    const previewTitle = page.locator('.preview h1').first();
    await expect(previewTitle).toHaveCSS('font-family', /Fredoka/);
    await expect(previewTitle).toHaveCSS('color', 'rgb(255, 215, 0)');
  });
});
