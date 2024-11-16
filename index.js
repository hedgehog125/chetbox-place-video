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
import { timeoutRace, wrapToReturnError } from "./src/lib.js";

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

const state = await timeoutRace(loadState(), 10 * 1000);
if (state.completed) {
	throw new Error("Already completed playback");
}
if (state.errorCount > Number(process.env.MAX_ERRORS)) {
	throw new Error(
		`Exiting as MAX_ERRORS (${process.env.MAX_ERRORS}) has been reached. Last panic was at ${state.errorOccurredAt}`
	);
}

let browser, page, pixels, paletteButtons, errorEventPromise;

let panicking = false;
process.once("uncaughtException", (err) => {
	if (panicking) {
		console.error(
			`Another uncaught error occurred after the panic started:`
		);
		console.error(err);
		return;
	}
	panicking = true;

	panic(browser, state, err);
});

console.log("Preparing GIF...");
const preparedGif = await prepareGif(state);
if (preparedGif == null) {
	await saveState(state);
	console.log("Done");
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
		const [changedPixels, error] = await Promise.race([
			wrapToReturnError(
				renderFrame(pixelIds, width, pixels, paletteButtons, page)
			),
			wrapToReturnError(errorEventPromise),
		]);
		if (error) throw error; // renderFrame often throws during the browser shutdown in the catch, this means those errors are ignored

		console.log(`Changed ${changedPixels} pixels`);
	} catch (error) {
		console.log("An error occurred while loading and rendering the page:");
		console.error(error);
		try {
			await shutdownBrowserWithTimeout(browser);
		} catch {}

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
if (browser?.connected) {
	throw new Error("The browser is still connected. This shouldn't happen!");
}
console.log("Done");
