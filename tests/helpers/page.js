const puppeteer = require('puppeteer');

jest.setTimeout(30000);
console.log(process.env.NODE_ENV);

class CustomPage {  
  
  static async build() {   
    const browser_options = process.env.NODE_ENV !== "ci" ? { 
      slowMo: 100,
      headless: false
    } : { 
      headless: "new",
      args: ["--no-sandbox"]
    }; 

    const browser = await puppeteer.launch(browser_options);
    const page = await browser.newPage();
    if(process.env.NODE_ENV !== "ci") {
      await page.setViewport({
        width: 1480,
        height: 980,
        deviceScaleFactor: 1,
      });
    } 
    return { page, browser };
  }
}

module.exports = CustomPage;