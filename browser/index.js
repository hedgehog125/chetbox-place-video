import puppeteer from "puppeteer";

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(process.env.URL);

	await page.click("td");

	await browser.close();
})();
