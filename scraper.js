const puppeteer = require('puppeteer');
const fs = require('fs');

/* Async literal delay before next line */
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

/* Check the purchase button on the 14 and 16 inch macbooks
Returns false if can't buy, true if can buy */
const scrape = async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({
      width: 1920,
      height: 1080,
  });

  /* Check if a login session is already created */
  const cookiesFilePath = 'cookies.json';
  const previousSession = fs.existsSync(cookiesFilePath)
  
  /* If previous session exists, load the cookies */
  /* If not login */
  if (previousSession) {
    const cookiesString = fs.readFileSync(cookiesFilePath);
    const parsedCookies = JSON.parse(cookiesString);
    if (parsedCookies.length !== 0) {
      for (let cookie of parsedCookies) {
        await page.setCookie(cookie)
      }
      console.log('Session has been loaded in the browser')
    }
  
  } else {
    await page.goto('https://www.linkedin.com/login?fromSignIn=true');
    await page.waitForSelector('#username');
    await page.type('#username', 'test');
    await page.type('#password', 'test');
    await page.keyboard.press('Enter')
    await delay(4000);

    // Save Session Cookies
    const cookiesObject = await page.cookies()
    // Write cookies to temp file to be used in other profile pages
    fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject),
    function(err) { 
      if (err) {
      console.log('The file could not be written.', err)
      }
      console.log('Session has been successfully saved')
    })
  }

  /* LinkedIn Profile to scrape */
  await page.goto('test');
  
  await page.waitForSelector('#experience');
  await delay(2000);
  const data = await page.evaluate(() => {
    // Search for content in between xxx and xxx, g for match all instances
    const titleRegex = /<span aria-hidden="true"><!---->(.*?)<!----><\/span><span class="visually-hidden"><!---->/g;
    const cleanRegex = /<!---->(.*?)<!---->/
    const chunks = Array.from(document.querySelectorAll('.artdeco-list__item'));
    const placeWorked = chunks.map((p) => {

      const d =  p.innerHTML.match(titleRegex);
      return {title: cleanRegex.exec(d[0])[1], desc: cleanRegex.exec(d[1])[1]}

    });
    return placeWorked;
  })

  console.log(data)
  await page.screenshot({path: 'loginpage.jpg'});
  // browser.close();
  return ;
}

/* Sample to run locally */
scrape().then(result => {
  console.log(result);
});

/* Export scraper function */
module.exports = scrape;