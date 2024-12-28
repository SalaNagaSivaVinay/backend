const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');

// List of domains to crawl
const domains = [
  'https://etsy.com',
  'https://walmart.com',
  'https://shopify.com',
  'https://flipkart.com',
  'https://ebay.com',
  'https://target.com',
  'https://amazon.com',
];

// Function to fetch product URLs using axios (for static content)
async function fetchUrlsWithAxios(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3' },
      maxRedirects: 5, // Limit redirects
    });
    const productUrls = extractProductUrls(response.data);
    return productUrls;
  } catch (error) {
    console.log(`Error while crawling ${url}:`, error.response ? error.response.status : error.message);
    return [];
  }
}

// Function to extract product URLs (you'll need to update this based on actual DOM structure)
function extractProductUrls(pageContent) {
  // Example: find all anchor tags with a certain class (update as needed)
  const regex = /href="(\/product\/[a-zA-Z0-9\-]+)"/g; // Adjust the regex for your target site
  let match;
  const productUrls = [];
  while ((match = regex.exec(pageContent)) !== null) {
    productUrls.push(match[1]);
  }
  return productUrls;
}

// Function to fetch product URLs using Puppeteer (for dynamic content)
async function fetchUrlsWithPuppeteer(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const productUrls = await page.evaluate(() => {
    // Example: Extract product links from page (modify the selector as needed)
    const links = Array.from(document.querySelectorAll('a.product-link')); // Update this selector
    return links.map(link => link.href);
  });

  await browser.close();
  return productUrls;
}

// Function to crawl a list of domains
async function crawlDomains(domains) {
  const results = {};
  
  for (const domain of domains) {
    console.log(`Crawling ${domain}...`);
    let productUrls = [];
    
    // Try fetching with axios first (for static sites)
    productUrls = await fetchUrlsWithAxios(domain);
    
    // If no product URLs found or dynamic content is detected, use Puppeteer
    if (productUrls.length === 0) {
      console.log(`Using Puppeteer for dynamic content on ${domain}`);
      productUrls = await fetchUrlsWithPuppeteer(domain);
    }

    // Save the result for the domain
    results[domain] = productUrls;
  }

  return results;
}

// Main execution
async function main() {
  const productUrlsByDomain = await crawlDomains(domains);
  
  // Save to file
  fs.writeFileSync('productUrls.json', JSON.stringify(productUrlsByDomain, null, 2));
  console.log('Crawling complete. Product URLs saved to productUrls.json');
}

main();
