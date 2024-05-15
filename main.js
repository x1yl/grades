const puppeteer = require('puppeteer');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require("./config.json");

const { gradeDiscordToken, discordUserId, jupiterUsername, jupiterPassword } = config;

const fetchHomeworkData = async () => {
  const browser = await puppeteer.launch({ headless: `new` });
  const page = await browser.newPage();

  try {
    // Navigate to the login page
    await page.goto('https://login.jupitered.com/login/index.php?26489');

    // Input student ID
    const studentIdInputXPath = '//*[@id="text_studid1"]';
    await page.waitForSelector(`xpath=${studentIdInputXPath}`);
    const studentIdInput = await page.$(`xpath=${studentIdInputXPath}`);
    await studentIdInput.type(jupiterUsername);

    // Input password
    const passwordInputXPath = '//*[@id="text_password1"]';
    await page.waitForSelector(`xpath=${passwordInputXPath}`);
    const passwordInput = await page.$(`xpath=${passwordInputXPath}`);
    await passwordInput.type(jupiterPassword);

    // Click on the login button
    const loginButtonXPath = '//*[@id="loginbtn"]';
    await page.waitForSelector(`xpath=${loginButtonXPath}`);
    const loginButton = await page.$(`xpath=${loginButtonXPath}`);
    await loginButton.click();
    await page.waitForNavigation();

    // Click on an element (assuming this is a necessary step)
    const elementToClickXPath = '/html/body/form/div[6]/div/div[1]';
    await page.waitForSelector(`xpath=${elementToClickXPath}`);
    const elementToClick = await page.$(`xpath=${elementToClickXPath}`);
    await elementToClick.click();

    // Wait for the content to load
    const contentXPath = '/html/body/form/div[6]/div/div[3]/div[1]/table[1]/tbody/tr';
    await page.waitForSelector(`xpath=${contentXPath}`);

    const homeworkData = [];

    for (let i = 1; i <= 8; i++) {
      const divXPath = `/html/body/form/div[6]/div/div[3]/div[${i}]/table[1]/tbody/tr`;
      await page.waitForSelector(`xpath=${divXPath}`);
      const row = await page.$(`xpath=${divXPath}`);

      if (row) {
        const rowText = await page.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim(), row);
        console.log(rowText);
        homeworkData.push(rowText);
      } else {
        console.log(`Row at div[${i}] not found.`);
      }
    }

    return homeworkData.join('\n');
  } finally {
    // Close the browser
    await browser.close();
  }
};

const sendHomeworkToUser = async (text, userId) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("ready", async () => {
    try {
      // Fetch the user by ID
      const user = await client.users.fetch(userId);

      // Send the homework list
      await user.send(text);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    // Disconnect the bot after sending the message
    client.destroy();
  });

  // Replace 'YOUR_BOT_TOKEN' with your actual bot token
  client.login(gradeDiscordToken);
};

(async () => {
  const homeworkText = await fetchHomeworkData();
  await sendHomeworkToUser(homeworkText, discordUserId);
})();

