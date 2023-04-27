const puppeteer = require('puppeteer');

jest.setTimeout(30000);
console.log(process.env.NODE_ENV);

class CustomPage {  
  
  static async build() {   
    const browser_options = process.env.NODE_ENV !== "ci" ? { 
      slowMo: 200,
      headless: false
    } : { 
      headless: true,
      args: ["--no-sandbox"]
    }; 

    const browser = await puppeteer.launch(browser_options);
    const page = await browser.newPage();    
    return { page, browser };
  }
}

module.exports = CustomPage;