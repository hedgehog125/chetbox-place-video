// TODO: use gifuct-js?

import "dotenv/config";
import {
	loadPage,
	loadState,
	panic,
	prepareGif,
	renderFrame,
	saveState,
	shutdownBrowserWithTimeout,
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
	"MAX_ERRORS",
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
if (state.errorCount > Number(process.env.MAX_ERRORS)) {
	throw new Error(
		`Exiting as MAX_ERRORS (${process.env.MAX_ERRORS}) has been reached. Last panic was at ${state.errorOccurredAt}`
	);
}

let browser, page, pixels, paletteButtons, errorEventPromise;

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
		({ browser, page, pixels, paletteButtons, errorEventPromise } =
			await loadPage());

		console.log("Rendering...");
		const changedPixels = await Promise.race([
			renderFrame(pixelIds, width, pixels, paletteButtons, page),
			errorEventPromise,
		]);
		console.log(`Changed ${changedPixels} pixels`);
	} catch (error) {
		try {
			await shutdownBrowserWithTimeout(browser);
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

console.log("Shutting down...");
await shutdownBrowserWithTimeout(browser);
await saveState(state);
clearTimeout(timeoutTask);

process.exit(); // Should help stop it hanging even if I do something silly like forget to cancel a timeout?
