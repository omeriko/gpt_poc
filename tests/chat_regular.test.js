const Page = require('./helpers/page');

let page, browser;

describe("Test chat.html page", () => {

    beforeAll(async () => {  
      ({ page, browser } = await Page.build());
      await page.goto('http://localhost:8000/chat');
    });
    
    afterAll(async () => {
        await browser.close();
    });

    
    test("The header has the right title", async () => {
      const title = await page.$eval('h2 > .title', el => el.innerText);
      expect(title).toEqual('Chat');
    });

    test("The prepare message to the API is correct", async () => {
      const prepare = await page.$eval('#prepare-txt', el => el.innerText);
      expect(prepare).toEqual("Hi there, I'm a helpful assistant that specializes in recommending TV series to viewers.");
    });

    test("The token-usage section is hidden on page load", async () => {
      const display = await page.$eval('#response-usage', el => window.getComputedStyle(el).display);
      expect(display).toEqual("none");
    });          
});

describe("Test the input validator behavior", () => {
  beforeEach(async () => {  
    ({ page, browser } = await Page.build());
    await page.goto('http://localhost:8000/chat');
  });
  
  afterEach(async () => {
      await browser.close();
  });

  test("The prompt text box validator is hidden on page load", async () => {
    const display = await page.$eval('#validator', el => window.getComputedStyle(el).display);
    expect(display).toEqual("none");      
  });

  test("The prompt text box validator appears if the user clicked Send without inputing a prompt", async () => {      
    await page.click('#btn');
    const display = await page.$eval('#validator', el => window.getComputedStyle(el).display);
    expect(display).toEqual("block");      
  }); 

  test("The prompt text box validator appears if the user clicked Send without inputing a prompt", async () => {
    await page.click('#btn');
    await page.type('#txt', 'My prompt');
    const display = await page.$eval('#validator', el => window.getComputedStyle(el).display);
    expect(display).toEqual("none");
  });
});

describe("Test Behavior when sending a prompt to the server", () => {  
  
  let prompt = '';
  
  beforeAll(async () => {  
    ({ page, browser } = await Page.build());
    await page.goto('http://localhost:8000/chat');
    prompt = 'I enjoyed watching the series "The Crown" and "Game of Thrones". 1. Please recommend me 2 other series that I may also like. 2. Just provide their names, without adding their description 3. Recommend only from the series in the following comma separated list:';
    
    await page.$eval('#txt', (el, prompt) => { 
        el.value = prompt; 
      }, prompt);  

    await page.click('#btn');      
  });
  
  afterAll(async () => {
      await browser.close();
  });

  /*test("The send icon is hidden and the progress icon appears", async () => {
    await page.waitForSelector("#btn", { hidden: true });    
    const display = await page.$eval('#spinner', el => window.getComputedStyle(el).display);
    expect(display).toEqual("block");
  });*/

  test("the user's prompt appears in the chat history", async () => { 
    const user_prompt = await page.$eval('.chat-item-user', el => el.innerText);
    expect(user_prompt).toEqual("User: " + prompt);
  });
  
  test("The server response appears in the chat history", async () => {    
    await page.waitForSelector(".chat-item-assistant", { visible: true });
    const assistant_answer = await page.$eval('.chat-item-assistant > .response-txt', el => el.innerText);    
    expect(assistant_answer).toEqual("GPT-3.5 answer: WW2 in color, The Handmaid's Tale");
  });

  test("The token usage section is visible", async () => {
    const display = await page.$eval('#response-usage', el => window.getComputedStyle(el).display);
    expect(display).toEqual("block");
  });    
});

