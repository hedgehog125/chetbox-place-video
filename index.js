import "dotenv/config";
import { loadPage, prepareGif, renderFrame } from "./src/subFns.js";
import { logWhenResolved } from "./src/lib.js";

let browser, page, pixels, paletteButtons;
const timeoutTask = setTimeout(async () => {
	await browser?.close();
	process.abort();
}, 45 * 1000);
console.log("Loading page and preparing GIF...");

let pixelIds, width;
[{ browser, page, pixels, paletteButtons }, { pixelIds, width }] =
	await Promise.all([
		logWhenResolved(loadPage(), "Loaded page"),
		logWhenResolved(prepareGif(), "Prepared GIF"),
	]);
console.log("Rendering...");
const changedPixels = await renderFrame(
	pixelIds,
	width,
	pixels,
	paletteButtons,
	page
);
console.log(`Changed ${changedPixels} pixels`);

await browser.close();
clearTimeout(timeoutTask);
