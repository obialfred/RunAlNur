#!/usr/bin/env node
/**
 * Icon Generation Script
 * Generates all required PWA icons from the source SVG
 * 
 * Usage: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_SVG = path.join(__dirname, '../public/icons/icon-512x512.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');
const SPLASH_DIR = path.join(__dirname, '../public/splash');

// PWA Icon sizes required by manifest.json
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Apple Touch Icon sizes
const APPLE_ICON_SIZES = [120, 152, 167, 180];

// iOS Splash screen sizes (width x height)
const SPLASH_SCREENS = [
  // iPhone SE, iPod touch
  { width: 640, height: 1136, name: 'splash-640x1136' },
  // iPhone 8, 7, 6s, 6
  { width: 750, height: 1334, name: 'splash-750x1334' },
  // iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
  // iPhone X, Xs, 11 Pro
  { width: 1125, height: 2436, name: 'splash-1125x2436' },
  // iPhone Xs Max, 11 Pro Max
  { width: 1242, height: 2688, name: 'splash-1242x2688' },
  // iPhone XR, 11
  { width: 828, height: 1792, name: 'splash-828x1792' },
  // iPhone 12 mini, 13 mini
  { width: 1080, height: 2340, name: 'splash-1080x2340' },
  // iPhone 12, 12 Pro, 13, 13 Pro, 14
  { width: 1170, height: 2532, name: 'splash-1170x2532' },
  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  { width: 1284, height: 2778, name: 'splash-1284x2778' },
  // iPhone 14 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556' },
  // iPhone 14 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796' },
  // iPhone 15, 15 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556-15' },
  // iPhone 15 Pro Max, 15 Plus
  { width: 1290, height: 2796, name: 'splash-1290x2796-15' },
  // iPad Mini, Air
  { width: 1536, height: 2048, name: 'splash-1536x2048' },
  // iPad Pro 10.5"
  { width: 1668, height: 2224, name: 'splash-1668x2224' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388' },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732' },
];

async function generateIcons() {
  console.log('🎨 Generating PWA Icons...\n');
  
  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(SPLASH_DIR)) {
    fs.mkdirSync(SPLASH_DIR, { recursive: true });
  }

  // Check if source SVG exists
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Source SVG not found:', SOURCE_SVG);
    console.log('\nCreating a placeholder icon...');
    await createPlaceholderIcon();
  }

  // Generate PWA icons
  console.log('📱 Generating PWA icons...');
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    try {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  ✓ icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${size}x${size}:`, err.message);
    }
  }

  // Generate Apple Touch Icons
  console.log('\n🍎 Generating Apple Touch Icons...');
  for (const size of APPLE_ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `apple-touch-icon-${size}x${size}.png`);
    try {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  ✓ apple-touch-icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`  ✗ Failed to generate apple-touch-icon ${size}x${size}:`, err.message);
    }
  }

  // Generate main apple-touch-icon.png (180x180 is standard)
  const mainAppleIcon = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  try {
    await sharp(SOURCE_SVG)
      .resize(180, 180)
      .png()
      .toFile(mainAppleIcon);
    console.log('  ✓ apple-touch-icon.png (180x180)');
  } catch (err) {
    console.error('  ✗ Failed to generate main apple-touch-icon:', err.message);
  }

  // Generate favicon.ico (32x32)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  try {
    await sharp(SOURCE_SVG)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    console.log('\n🔖 Generated favicon.png (32x32)');
    // Note: For a proper .ico, you'd need a different library, but .png works for most browsers
  } catch (err) {
    console.error('  ✗ Failed to generate favicon:', err.message);
  }

  console.log('\n✅ Icon generation complete!');
}

async function generateSplashScreens() {
  console.log('\n📱 Generating iOS Splash Screens...\n');

  // Create a splash screen with centered logo on dark background
  for (const screen of SPLASH_SCREENS) {
    const outputPath = path.join(SPLASH_DIR, `${screen.name}.png`);
    
    // Calculate logo size (about 30% of the smaller dimension)
    const logoSize = Math.min(screen.width, screen.height) * 0.3;
    
    try {
      // Create dark background with centered icon
      const background = await sharp({
        create: {
          width: screen.width,
          height: screen.height,
          channels: 4,
          background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
        }
      }).png().toBuffer();

      // Resize logo
      const logo = await sharp(SOURCE_SVG)
        .resize(Math.round(logoSize), Math.round(logoSize))
        .png()
        .toBuffer();

      // Composite logo onto background (centered)
      await sharp(background)
        .composite([{
          input: logo,
          top: Math.round((screen.height - logoSize) / 2),
          left: Math.round((screen.width - logoSize) / 2),
        }])
        .png()
        .toFile(outputPath);

      console.log(`  ✓ ${screen.name}.png (${screen.width}x${screen.height})`);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${screen.name}:`, err.message);
    }
  }

  console.log('\n✅ Splash screen generation complete!');
}

async function createPlaceholderIcon() {
  // Create a simple placeholder SVG if none exists
  const placeholderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="64" fill="url(#bg)"/>
  <text x="256" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="180" font-weight="700" fill="#ffffff" text-anchor="middle">RN</text>
  <text x="256" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="500" fill="#666666" text-anchor="middle">EMPIRE OS</text>
</svg>`;

  fs.writeFileSync(SOURCE_SVG, placeholderSvg.trim());
  console.log('✓ Created placeholder icon SVG');
}

async function main() {
  try {
    await generateIcons();
    await generateSplashScreens();
    
    console.log('\n🎉 All assets generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated icons in public/icons/');
    console.log('2. Review splash screens in public/splash/');
    console.log('3. Deploy to Vercel: vercel --prod');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
