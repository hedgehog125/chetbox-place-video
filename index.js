import puppeteer from "puppeteer";
import "dotenv/config";

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(process.env.SITE_URL, { timeout: 5000 });

	await page.waitForSelector("td", { timeout: 5000 });
	await page.click("td");

	await browser.close();
})();
