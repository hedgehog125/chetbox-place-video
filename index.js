import "dotenv/config";
import {
	loadPage,
	loadState,
	panic,
	prepareGif,
	renderFrame,
} from "./src/subFns.js";
import { logWhenResolved } from "./src/lib.js";

const state = await loadState();
if (state.errorOccurredAt != null) {
	throw new Error("Exiting as an error previously occurred...");
}

let browser, page, pixels, paletteButtons;

function onUncaughtException(err) {
	process.removeListener("uncaughtException", onUncaughtException);
	panic(browser, state, err);
}
process.on("uncaughtException", onUncaughtException);

const timeoutTask = setTimeout(async () => {
	throw new Error("Timeout exceeded");
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
