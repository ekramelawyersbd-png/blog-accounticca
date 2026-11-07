const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generateIcons() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const logoBase64 = fs.readFileSync(path.join(__dirname, '../public/logo.png')).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // Helper to render and screenshot an icon
  async function makeIcon(size, filename, isMaskable = false) {
    await page.setViewport({ width: size, height: size });
    
    // For maskable, logo is placed with 15% padding on all sides inside a brand circle/square
    const padding = isMaskable ? Math.round(size * 0.15) : 0;
    const contentSize = size - (padding * 2);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${size}px; height: ${size}px; overflow: hidden; background: #064e3b; display: flex; align-items: center; justify-content: center; }
            .container {
              width: ${contentSize}px;
              height: ${contentSize}px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${logoDataUri}" />
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);
    const dest = path.join(__dirname, '../public', filename);
    await page.screenshot({ path: dest, omitBackground: false });
    console.log(`Generated: ${filename} (${size}x${size})`);
  }

  try {
    await makeIcon(180, 'apple-touch-icon.png', false);
    await makeIcon(192, 'pwa-192x192.png', false);
    await makeIcon(512, 'pwa-512x512.png', false);
    await makeIcon(512, 'pwa-maskable-512x512.png', true);
    console.log('All icons generated successfully!');
  } finally {
    await browser.close();
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
