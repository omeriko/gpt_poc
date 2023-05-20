const Page = require('./helpers/page');

let page, browser;

describe("Test moods/chat.html page", () => {

    beforeAll(async () => {  
      ({ page, browser } = await Page.build());
      await page.goto('http://localhost:8000/chat_next_mood');
    });
    
    afterAll(async () => {
        await browser.close();
    });

    test("when the page loads the validator is hidden.", async () => {
      const display = await page.$eval('#validator', el => window.getComputedStyle(el).display);
      expect(display).toEqual("none");      
    });
    
    test("if the user clicks send without checking any item - the validator appears", async () => {
      await page.click('#btn-next');
      const display = await page.$eval('#validator', el => window.getComputedStyle(el).display);
      expect(display).toEqual("block");      
    });

    test("Send request and validate response", async () => {
        await page.evaluate(() => {
          document.querySelectorAll(".series .form-check:nth-child(1)").forEach(item => item.querySelector(".form-check-input").checked = true);
        });

        await page.evaluate(() => {
          document.querySelectorAll(".moods .form-check:nth-child(1)").forEach(item => item.querySelector(".form-check-input").checked = true);
        });

        await page.click('#btn-next');
        
        let display = await page.$eval('#spinner-next', el => window.getComputedStyle(el).display);
        expect(display).toEqual("block");

        await page.waitForSelector(".chat-item-assistant", { visible: true });
        const assistant_answer = await page.$eval('.chat-item-assistant', el => el.innerText);    
        expect(assistant_answer).toEqual("GPT-3.5 answer: WW2 in color, The Handmaid's Tale");
        
        display = await page.$eval('#spinner-next', el => window.getComputedStyle(el).display);
        expect(display).toEqual("none");
        await page.waitForSelector("#btn-clear", { visible: true });

       display = await page.$eval('#response-usage', el => window.getComputedStyle(el).display);
       expect(display).toEqual("block");
    }); 
    
    test("Click clear button, all series and moods checkboxes are cleared", async () => {
      await page.click('#btn-clear');

      let is_series_checked = await page.evaluate(() => {
        const arr = [...document.querySelectorAll(".series .form-check-inline > input")];
        let is_checked = false;  
        for(let i = 0 ; i < arr.length; i++) {
          is_checked = arr[i].checked;
          if(is_checked === true) {
            break;
          } 
        }
        return is_checked;
        
      });
      expect(is_series_checked).toEqual(false);

      let is_moods_checked = await page.evaluate(() => {
        const arr = [...document.querySelectorAll(".moods .form-check-inline > input")];
        let is_checked = false;  
        for(let i = 0 ; i < arr.length; i++) {
          is_checked = arr[i].checked;
          if(is_checked === true) {
            break;
          } 
        }
        return is_checked;
        
      });
      expect(is_moods_checked).toEqual(false);
      
      let display = await page.$eval('#response-usage', el => window.getComputedStyle(el).display);
      expect(display).toEqual("none");

      await page.waitForSelector(".chat-item-assistant", { hidden: true });
      
      display = await page.$eval('#btn-clear', el => window.getComputedStyle(el).display);
      expect(display).toEqual("none");
    });
});



