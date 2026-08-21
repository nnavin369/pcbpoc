const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://insight2.test.shellpointmortgageservicing.com/');
  await page.fill('#UserName', 'sahaya_gla_test');
  await page.fill('#Password', 'Happy123!');
  await page.click('#login-disable');
  await page.waitForURL('**/DataApi/Dashboard', { timeout: 60000 });
  await page.click('.search-by .dropdown-toggle');
  await page.locator('#loanid').click();
  await page.fill('.search-by input[type="text"]', '555835905');
  await page.click('.input-group-append');
  await page.waitForURL('**/Loans/Loan', { timeout: 60000 });
  await page.waitForTimeout(3000);

  // Click More
  const moreBtn = page.locator('a:has-text("More"), .dropdown-toggle:has-text("More")').first();
  await moreBtn.click();
  await page.waitForTimeout(1000);

  const menuInfo = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a, li, button, .dropdown-item, .nav-item'));
    return allLinks
      .filter(el => {
        const t = (el.innerText || '').trim();
        return t.includes('Tax') || t.includes('Flood') || t.includes('Payoff') || t.includes('Cut') || t.includes('More');
      })
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        href: el.getAttribute('href'),
        text: el.innerText.trim(),
        outerHTML: el.outerHTML
      }));
  });

  console.log('More Items Found:', JSON.stringify(menuInfo, null, 2));
  await browser.close();
})();
