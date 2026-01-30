// Syndication Superstars Download URL Extractor
// 
// Instructions:
// 1. Open the Document Library page in your browser
// 2. Press F12 to open Developer Tools
// 3. Go to the Console tab
// 4. Paste this entire script and press Enter
// 5. Wait for it to complete (it will visit each lesson)
// 6. Copy the output and save it

(async function() {
  console.log('Starting download URL extraction...');
  
  const allDownloads = [];
  const baseUrl = window.location.origin;
  
  // Find all lesson links (they have "text lesson icon" in the name)
  const lessonLinks = document.querySelectorAll('a[href*="/posts/"]');
  const uniqueUrls = [...new Set([...lessonLinks].map(a => a.href))];
  
  console.log(`Found ${uniqueUrls.length} lesson pages to scan...`);
  
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    console.log(`Scanning ${i + 1}/${uniqueUrls.length}: ${url}`);
    
    try {
      const response = await fetch(url, { credentials: 'include' });
      const html = await response.text();
      
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find the lesson title
      const titleEl = doc.querySelector('h1, .post-title, [class*="title"]');
      const lessonTitle = titleEl ? titleEl.textContent.trim() : 'Unknown';
      
      // Find download links - they typically point to S3 or have download in the URL
      const downloadLinks = doc.querySelectorAll('a[href*="s3.amazonaws.com"], a[href*="download"], a[href*=".pdf"], a[href*=".xlsx"], a[href*=".docx"], a[href*=".doc"], a[href*=".zip"]');
      
      for (const link of downloadLinks) {
        const href = link.href;
        const name = link.textContent.trim() || href.split('/').pop().split('?')[0];
        
        allDownloads.push({
          lesson: lessonTitle,
          lessonUrl: url,
          fileName: name,
          downloadUrl: href
        });
      }
      
      // Also look for data attributes that might contain download URLs
      const dataDownloads = doc.querySelectorAll('[data-download-url], [data-file-url]');
      for (const el of dataDownloads) {
        const href = el.getAttribute('data-download-url') || el.getAttribute('data-file-url');
        if (href) {
          allDownloads.push({
            lesson: lessonTitle,
            lessonUrl: url,
            fileName: el.textContent.trim(),
            downloadUrl: href
          });
        }
      }
      
    } catch (err) {
      console.error(`Error scanning ${url}:`, err);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n=== EXTRACTION COMPLETE ===\n');
  console.log(`Found ${allDownloads.length} total downloads\n`);
  
  // Group by lesson
  const byLesson = {};
  for (const d of allDownloads) {
    if (!byLesson[d.lesson]) byLesson[d.lesson] = [];
    byLesson[d.lesson].push(d);
  }
  
  // Output as JSON
  console.log('=== DOWNLOAD URLS (JSON) ===');
  console.log(JSON.stringify(allDownloads, null, 2));
  
  // Output as simple list
  console.log('\n=== DOWNLOAD URLS (SIMPLE LIST) ===');
  for (const [lesson, downloads] of Object.entries(byLesson)) {
    console.log(`\n### ${lesson}`);
    for (const d of downloads) {
      console.log(`${d.fileName}: ${d.downloadUrl}`);
    }
  }
  
  // Store in window for easy access
  window.extractedDownloads = allDownloads;
  console.log('\n✅ Results stored in window.extractedDownloads');
  console.log('You can copy by running: copy(JSON.stringify(window.extractedDownloads, null, 2))');
  
  return allDownloads;
})();
