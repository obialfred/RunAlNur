// FULL AUTOMATED DOWNLOAD - All lessons, all files
// 
// Instructions:
// 1. Go to the main Document Library page first
// 2. Open Developer Tools (F12)
// 3. Go to Console tab
// 4. Paste this entire script
// 5. Press Enter and wait - it will take a few minutes
//
// The script will:
// - Find all lesson links
// - Visit each lesson
// - Download all files from each
// - Move to the next lesson
// - Repeat until done

(async function downloadAllLessons() {
  console.log('🚀 Starting full document library download...\n');
  
  // Get all lesson links from the sidebar
  const lessonLinks = [...document.querySelectorAll('a[href*="/posts/"]')];
  const uniqueUrls = [...new Set(lessonLinks.map(a => a.href))];
  
  console.log(`📚 Found ${uniqueUrls.length} lessons to process\n`);
  
  let totalDownloads = 0;
  
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    console.log(`\n📖 Lesson ${i + 1}/${uniqueUrls.length}`);
    console.log(`   URL: ${url}`);
    
    // Navigate to the lesson
    window.location.href = url;
    
    // Wait for page to load
    await new Promise(resolve => {
      const checkLoaded = setInterval(() => {
        if (document.readyState === 'complete') {
          clearInterval(checkLoaded);
          setTimeout(resolve, 2000); // Extra 2s for dynamic content
        }
      }, 100);
    });
    
    // Find download links on this page
    const downloadLinks = document.querySelectorAll('a[href*="s3.amazonaws.com"], a[href*="/downloads/"]');
    console.log(`   📥 Found ${downloadLinks.length} files to download`);
    
    // Click each download link with a delay
    for (let j = 0; j < downloadLinks.length; j++) {
      const link = downloadLinks[j];
      const fileName = link.textContent.trim() || `File ${j + 1}`;
      console.log(`   ⬇️  Downloading: ${fileName}`);
      link.click();
      totalDownloads++;
      await new Promise(r => setTimeout(r, 800)); // 800ms between downloads
    }
    
    console.log(`   ✅ Lesson ${i + 1} complete`);
    
    // Wait before moving to next lesson
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n\n🎉 ALL DONE!`);
  console.log(`📊 Total files downloaded: ${totalDownloads}`);
  console.log(`📁 Check your Downloads folder`);
})();

// NOTE: Due to browser security, this script may need to be run in parts
// If it stops working, refresh the page and run again starting from where you left off
