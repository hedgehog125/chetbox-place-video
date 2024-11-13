// TODO: use gifuct-js?

import "dotenv/config";
import {
	loadPage,
	loadState,
	panic,
	prepareGif,
	renderFrame,
	saveState,
} from "./src/subFns.js";

[
	"SITE_URL",
	"MOUNT_PATH",
	"GIF_URL",
	"RENDER_X",
	"RENDER_Y",
	"CANVAS_WIDTH",
	"CANVAS_HEIGHT",
	"PLAYBACK_SPEED",
	"USE_NIXPACKS_PUPPETEER_ARGS",
	"MAX_INITIAL_WAIT",
	"IGNORE_ERRORS",
	"MAX_RETRIES",
].forEach((envVarName) => {
	if (!process.env.hasOwnProperty(envVarName)) {
		throw new Error(`Environment variable ${envVarName} has not been set.`);
	}
});

const state = await loadState();
if (state.completed) {
	throw new Error("Already completed playback");
}
if (state.errorOccurredAt != null && process.env.IGNORE_ERRORS !== "true") {
	throw new Error("Exiting as an error previously occurred...");
}

let browser, page, pixels, paletteButtons;

function onUncaughtException(err) {
	process.removeListener("uncaughtException", onUncaughtException);
	panic(browser, state, err);
}
process.on("uncaughtException", onUncaughtException);

console.log("Preparing GIF...");
const preparedGif = await prepareGif(state);
if (preparedGif == null) {
	await saveState(state);
	process.exit();
}

const { pixelIds, width } = preparedGif;

const timeoutTask = setTimeout(async () => {
	throw new Error("Timeout exceeded");
}, 150 * 1000);

let retries = 0;
while (true) {
	let failed = false;
	try {
		console.log("Loading page...");
		({ browser, page, pixels, paletteButtons } = await loadPage());

		console.log("Rendering...");
		const changedPixels = await renderFrame(
			pixelIds,
			width,
			pixels,
			paletteButtons,
			page
		);
		console.log(`Changed ${changedPixels} pixels`);
	} catch (error) {
		try {
			await browser.close();
		} catch {}

		console.log("An error occurred while loading and rendering the page:");
		console.error(error);
		failed = true;
	}

	if (!failed) break;
	retries++;
	if (retries > Number(process.env.MAX_RETRIES)) {
		throw new Error("Max retries exceeded");
	}
	console.log(`Starting retry ${retries} of ${process.env.MAX_RETRIES}...`);
}

await browser.close();
await saveState(state);
clearTimeout(timeoutTask);
