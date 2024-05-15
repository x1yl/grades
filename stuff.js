const puppeteer = require('puppeteer-extra')
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.json");

const { googleUsername, googlePassword, homeworkDiscordToken, discordUserId } = config;
let user; // Declare the user variable
let messages = []
const deleteAllMessages = async (channel) => {
  try {
    const fetchedMessages = await channel.messages.fetch();
    await Promise.all(fetchedMessages.map((message) => message.delete()));
    console.log("All messages deleted in the DM channel.");
  } catch (error) {
    console.error("Error deleting messages:", error);
  }
};

const processElements = async (page, i, j) => {
  const elementType = i ? 2 : 3;
  // Loop through li elements
  while (true) {
    const elementXPath = `/html/body/c-wiz[2]/div[2]/div/div[7]/div[2]/div[${elementType}]/div/div[2]/ol/li[${i || j}]/div/a/div/div[2]/div/div[1]/p[1]`;
    const elementXPath2 = `/html/body/c-wiz[2]/div[2]/div/div[7]/div[2]/div[${elementType}]/div/div[2]/ol/li[${i || j}]/div/a/div/div[2]/div/div[2]/p`;
    const no = `/html/body/c-wiz[2]/div[2]/div/div[7]/div[2]/div[${elementType}]/div/div[2]/ol/li[${i || j}]/div/a/div/div[2]/div/div[1]/p[2]`;

    const elementHandle = await page.waitForSelector(`xpath=${elementXPath}`, { timeout: 5000 }).catch(() => null);
    const elementHandle2 = await page.waitForSelector(`xpath=${elementXPath2}`, { timeout: 5000 }).catch(() => null);
    const elementHandleNo = await page.waitForSelector(`xpath=${no}`, { timeout: 5000 }).catch(() => null);


    const elementXPath3 = `/html/body/c-wiz[2]/div[2]/div/div[7]/div[2]/div[${elementType}]/div/div[2]/ol/li[${i || j}]/div/a`;
    let href = await page.evaluate((xpath) => {
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      return element ? element.getAttribute("href") : null;
    }, elementXPath3);

    if (href !== null) {
      href = "https://classroom.google.com/u/2" + href;
    }

    if (!elementHandle) {
      break;
    }

    const elementText = await page.evaluate((el) => el.textContent.trim(), elementHandle);
    const elementText2 = await page.evaluate((el) => el.textContent.trim(), elementHandle2);
    const elementTextNo = await page.evaluate((el) => el.textContent.trim(), elementHandleNo);

    if (elementTextNo !== "Stein Pd7,8 Algebra" && elementTextNo !== "Stein - Pd7,8 Geometry") {
      const message = `[${elementText} due at ${elementText2}](${href})`;
      messages.push(message); // Collect messages in the array
    }

    if (i) {
      i++;
    } else {
      j++;
    }
  }
};

(async () => {
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  puppeteer.use(StealthPlugin())
  const UserAgentOverride = require('puppeteer-extra-plugin-stealth/evasions/user-agent-override')
// Define custom UA and locale
  const ua = UserAgentOverride({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  })
  puppeteer.use(ua)
  // Set up Puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Navigate to the login page
  await page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fclassroom.google.com&ifkv=ASKXGp1ku950oKjWstt5PsT71iIaVFQyjXtT29Bf9qjzFkvWt1_nHtNbai_-cOSrB0qIiAUZhtHh6A&passive=true&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-1777564479%3A1704416528633926&theme=glif");

  // Set up Discord.js client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  await client.login(homeworkDiscordToken);

  user = await client.users.fetch(discordUserId);
  const dmChannel = await user.createDM();

  // Delete all messages in the DM channel
  await deleteAllMessages(dmChannel);

  // Input username
  const usernameInputXPath1 = '//*[@id="identifierId"]';
  await page.waitForSelector(`xpath=${usernameInputXPath1}`);
  const usernameInput1 = await page.$(`xpath=${usernameInputXPath1}`);
  await usernameInput1.type(googleUsername);

  const loginButtonXPath1 = "/html/body/div[1]/div[1]/div[2]/c-wiz/div/div[3]/div/div[1]/div/div/button"; // Replace with the actual login button XPath

  await page.waitForSelector(`xpath=${loginButtonXPath1}`);
  const loginButton1 = await page.$(`xpath=${loginButtonXPath1}`);
  await loginButton1.click();
  let test = '/html/body/main/div/div/div/div[2]/form/div[1]/input[1]'
  await page.waitForSelector(`xpath=${test}`);

  // Input username again
  if (test) {
    await page.waitForSelector(`xpath=${test}`);
    const usernameInput = await page.$(`xpath=${test}`);
    await usernameInput.type(googleUsername);

    // Input password
    const passwordInputXPath = '//*[@id="password-input"]';
    await page.waitForSelector(`xpath=${passwordInputXPath}`);
    const passwordInput = await page.$(`xpath=${passwordInputXPath}`);
    await passwordInput.type(googlePassword);

    // Click on the login button
    const loginButtonXPath = '//*[@id="login-button"]';
    await page.waitForSelector(`xpath=${loginButtonXPath}`);
    const loginButton = await page.$(`xpath=${loginButtonXPath}`);
    await loginButton.click();
  } else {
    await page.waitForNavigation();
  }
  // Click on the next week button
  const elementXPath = '//*[@id="view_container"]/div/div/div[2]/div/div[2]/div/div[1]/div/div/button/div[3]';
  const buttonHandle = await page.waitForSelector(`xpath=${elementXPath}`, { visible: true, timeout: 5000 }).catch(() => null);

  if (buttonHandle) {
    await buttonHandle.click();
  } else {
    console.log("Button not visible within the specified timeout");
  }

  const linkXPath = "/html/body/div[1]/nav[2]/div[2]/div/div[2]/a[1]";
  await page.waitForSelector(`xpath=${linkXPath}`);
  const linkHandle = await page.$(`xpath=${linkXPath}`);
  await linkHandle.click();

  // Wait for the content to load
  const djgnvfbfb = '//*[@id="NO_DUE_DATE"]/div[2]/ol/li[1]'
  await page.waitForSelector(`xpath=${djgnvfbfb}`);

  // Process elements for the first type
  await processElements(page, 1, 0);

  // Click on the next week button
  const elementXPathNextWeek = '//*[@id="NEXT_WEEK"]';
  const currentAriaExpandedNextWeek = await page.evaluate((xpath) => {
    const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return element ? element.getAttribute("aria-expanded") : null;
  }, elementXPathNextWeek);

  if (currentAriaExpandedNextWeek !== null) {
    await page.evaluate((xpath) => {
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        element.setAttribute("aria-expanded", "true");
      }
    }, elementXPathNextWeek);
  } else {
    console.log("Element not found or aria-expanded is null.");
  }

  const als = '//*[@id="NEXT_WEEK"]/div[2]/ol/li[1]'
  await page.waitForSelector(`xpath=${als}`);
  const nextWeekButtonXPath = '//*[@id="NEXT_WEEK"]/div[2]/div/div/button/span';
  const nextWeekButtonHandle = await page.waitForSelector(`xpath=${nextWeekButtonXPath}`, { timeout: 5000 }).catch(() => null);

  if (nextWeekButtonHandle) {
    await nextWeekButtonHandle.click();
  } else {
    console.log("Next week button not found within the specified timeout");
  }


  // Process elements for the second type
  await processElements(page, 0, 1);
  if (messages.length > 0) {
    const allMessages = messages.join('\n');
    user.send(allMessages).catch(console.error);
    console.log(allMessages);
  }

  // Take a screenshot
  await page.screenshot({ path: "screenshot.png" });

  // Close the browser
  client.destroy();
  await browser.close();
})();
