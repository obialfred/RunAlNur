// Auto-download all files on the current lesson page
// Paste this into your browser console (F12 -> Console)

(function() {
  // Find all download links (they have "download icon" in the name and point to S3 or have download in href)
  const downloadLinks = document.querySelectorAll('a[href*="s3.amazonaws.com"], a[href*="/downloads/"]');
  
  console.log(`Found ${downloadLinks.length} download links`);
  
  let delay = 0;
  downloadLinks.forEach((link, i) => {
    setTimeout(() => {
      console.log(`Downloading ${i + 1}/${downloadLinks.length}: ${link.textContent.trim()}`);
      link.click();
    }, delay);
    delay += 1000; // 1 second between each download to avoid overwhelming
  });
  
  console.log(`All ${downloadLinks.length} downloads queued. They will start automatically.`);
})();
