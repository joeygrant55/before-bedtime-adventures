import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * These tests take screenshots of key pages and components.
 * Perfect for catching unintended UI changes without needing authentication.
 * 
 * Run with: npm run test:e2e tests/visual-regression.spec.ts
 * Update snapshots: npm run test:e2e tests/visual-regression.spec.ts -- --update-snapshots
 */

test.describe('Visual Regression - Public Pages', () => {
  test('landing page hero section', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of hero section
    const hero = page.locator('main').first();
    await expect(hero).toHaveScreenshot('landing-hero.png');
  });

  test('landing page full viewport', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('landing-full.png', {
      fullPage: true,
    });
  });

  test('landing page mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('landing-mobile.png', {
      fullPage: true,
    });
  });

  test('sign-in page', async ({ page }) => {
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('sign-in.png');
  });
});

test.describe('Visual Regression - Typography Showcase', () => {
  /**
   * These tests create a standalone HTML page with typography examples
   * and screenshot it - no backend needed!
   */
  
  test('typography fonts showcase', async ({ page }) => {
    // Create a simple HTML page showcasing the fonts
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Fredoka:wght@400;700&family=Chewy&family=Poppins:wght@400;600&family=Lora:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: system-ui;
            }
            .font-sample {
              background: white;
              padding: 40px;
              margin: 20px 0;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .font-name {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
              font-family: system-ui;
            }
            .title {
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 24px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="font-sample">
            <div class="font-name">Playfair Display - Classic & Elegant</div>
            <div class="title" style="font-family: 'Playfair Display', serif;">Our Summer Adventure</div>
            <div class="subtitle" style="font-family: 'Playfair Display', serif;">A Family Journey</div>
          </div>
          
          <div class="font-sample">
            <div class="font-name">Fredoka - Playful & Friendly</div>
            <div class="title" style="font-family: 'Fredoka', sans-serif;">Our Summer Adventure</div>
            <div class="subtitle" style="font-family: 'Fredoka', sans-serif;">A Family Journey</div>
          </div>
          
          <div class="font-sample">
            <div class="font-name">Chewy - Fun & Bubbly</div>
            <div class="title" style="font-family: 'Chewy', cursive;">Our Summer Adventure</div>
            <div class="subtitle" style="font-family: 'Chewy', cursive;">A Family Journey</div>
          </div>
          
          <div class="font-sample">
            <div class="font-name">Poppins - Modern & Clean</div>
            <div class="title" style="font-family: 'Poppins', sans-serif;">Our Summer Adventure</div>
            <div class="subtitle" style="font-family: 'Poppins', sans-serif;">A Family Journey</div>
          </div>
          
          <div class="font-sample">
            <div class="font-name">Lora - Warm & Readable</div>
            <div class="title" style="font-family: 'Lora', serif;">Our Summer Adventure</div>
            <div class="subtitle" style="font-family: 'Lora', serif;">A Family Journey</div>
          </div>
        </body>
      </html>
    `);
    
    // Wait for fonts to load
    await page.waitForTimeout(2000);
    
    // Screenshot the showcase
    await expect(page).toHaveScreenshot('typography-fonts-all.png', {
      fullPage: true,
    });
  });

  test('typography color presets', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 40px;
              background: #1a1a2e;
              font-family: system-ui;
            }
            .color-sample {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 60px;
              margin: 20px 0;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              text-align: center;
            }
            .color-name {
              font-size: 12px;
              color: rgba(255,255,255,0.6);
              margin-bottom: 20px;
              font-family: system-ui;
            }
            .title {
              font-size: 56px;
              font-weight: bold;
              font-family: 'Fredoka', sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="color-sample">
            <div class="color-name">White (#FFFFFF)</div>
            <div class="title" style="color: #FFFFFF;">Our Summer Adventure</div>
          </div>
          
          <div class="color-sample">
            <div class="color-name">Cream (#FFF8DC)</div>
            <div class="title" style="color: #FFF8DC;">Our Summer Adventure</div>
          </div>
          
          <div class="color-sample">
            <div class="color-name">Gold (#FFD700)</div>
            <div class="title" style="color: #FFD700;">Our Summer Adventure</div>
          </div>
          
          <div class="color-sample">
            <div class="color-name">Pink (#FFB6C1)</div>
            <div class="title" style="color: #FFB6C1;">Our Summer Adventure</div>
          </div>
          
          <div class="color-sample">
            <div class="color-name">Sky Blue (#87CEEB)</div>
            <div class="title" style="color: #87CEEB;">Our Summer Adventure</div>
          </div>
          
          <div class="color-sample">
            <div class="color-name">Mint (#98FF98)</div>
            <div class="title" style="color: #98FF98;">Our Summer Adventure</div>
          </div>
        </body>
      </html>
    `);
    
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('typography-colors-all.png', {
      fullPage: true,
    });
  });

  test('typography size variations', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .size-sample {
              background: white;
              padding: 40px;
              margin: 20px 0;
              border-radius: 12px;
              text-align: center;
            }
            .size-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
            }
            .title {
              font-family: 'Fredoka', sans-serif;
              font-weight: bold;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="size-sample">
            <div class="size-label">Size 1 (Small)</div>
            <div class="title" style="font-size: 24px;">Our Summer Adventure</div>
          </div>
          
          <div class="size-sample">
            <div class="size-label">Size 2</div>
            <div class="title" style="font-size: 32px;">Our Summer Adventure</div>
          </div>
          
          <div class="size-sample">
            <div class="size-label">Size 3 (Default)</div>
            <div class="title" style="font-size: 40px;">Our Summer Adventure</div>
          </div>
          
          <div class="size-sample">
            <div class="size-label">Size 4</div>
            <div class="title" style="font-size: 48px;">Our Summer Adventure</div>
          </div>
          
          <div class="size-sample">
            <div class="size-label">Size 5 (Large)</div>
            <div class="title" style="font-size: 56px;">Our Summer Adventure</div>
          </div>
        </body>
      </html>
    `);
    
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('typography-sizes-all.png', {
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },    // iPhone SE
    { name: 'tablet', width: 768, height: 1024 },   // iPad
    { name: 'desktop', width: 1920, height: 1080 }, // Full HD
  ];

  for (const viewport of viewports) {
    test(`landing page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`);
    });
  }
});
