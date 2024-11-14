import { createWriteStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

import { COLORS, GIF_FILENAME } from "./constants.js";

// This is a bit dumb so apply the palette to the input first
export function getColorId(channels) {
	const differences = COLORS.map((outputColor) =>
		outputColor.reduce(
			(acc, outputChannel, channelIndex) =>
				Math.abs(outputChannel - channels[channelIndex]) + acc,
			0
		)
	);

	let lowestID = -1;
	let lowest = Infinity;
	for (let i = 0; i < differences.length; i++) {
		if (differences[i] < lowest) {
			lowest = differences[i];
			lowestID = i;
		}
	}
	return lowestID;
}

export async function downloadGif() {
	const filePath = path.join(process.env.MOUNT_PATH, GIF_FILENAME);
	if (await fileExists(filePath)) return;
	console.log("Downloading GIF...");

	const resp = await fetch(process.env.GIF_URL);
	if (!(resp.ok && resp.body)) {
		throw new Error("HTTP response for GIF was a non-ok or had no body");
	}
	const writeStream = createWriteStream(filePath);
	Readable.fromWeb(resp.body).pipe(writeStream);
	await new Promise((resolve, reject) => {
		writeStream.on("finish", () => resolve());
		writeStream.on("error", (err) => reject(err));
	});
}
export async function generatePixelIds(gifData, state) {
	let pixelIds = new Array(gifData.width * gifData.height).fill(0);
	let currentFrameID;
	for (
		currentFrameID = 0;
		currentFrameID < gifData.frames.length;
		currentFrameID++
	) {
		const scaledElapsed =
			(Date.now() - state.startTime) * Number(process.env.PLAYBACK_SPEED);
		const frame = gifData.frames[currentFrameID];
		if (frame.timeCode > scaledElapsed) {
			if (currentFrameID === state.lastFrame) {
				const timeToWait =
					(frame.timeCode - scaledElapsed) /
					Number(process.env.PLAYBACK_SPEED);
				if (timeToWait > parseInt(process.env.MAX_INITIAL_WAIT)) {
					console.log(
						`Time to next frame (${timeToWait}ms) is longer than MAX_INITIAL_WAIT, exiting and waiting for next rerun...`
					);
					return null;
				}

				console.log(`Waiting ${timeToWait}ms for frame to advance`);
				await wait(timeToWait);
			} else {
				const lastFrameTimestamp =
					gifData.frames[currentFrameID - 1]?.timeCode ?? 0;

				console.log(
					`Rendering frame id ${currentFrameID - 1}, ${
						(scaledElapsed - lastFrameTimestamp) /
						Number(process.env.PLAYBACK_SPEED)
					}ms late`
				);
				break;
			}
		}

		for (let i = 0; i < frame.data.length; i += 4) {
			if (frame.data[i + 3] === 255) {
				// pixelIds[i / 4] = frame.data.slice(i, i + 3).join("|");
				pixelIds[i / 4] = getColorId(frame.data.slice(i, i + 3));
			}
		}
	}
	if (currentFrameID === gifData.frames.length) {
		state.completed = true;
		console.log("Rendering last frame");
	}
	state.lastFrame = currentFrameID;
	return pixelIds;
}

export async function fileExists(filePath) {
	try {
		await stat(filePath);
	} catch (err) {
		return false;
	}
	return true;
}

export async function logWhenResolved(promise, message) {
	const output = await promise;
	console.log(message);
	return output;
}

export function wait(delay) {
	return new Promise((resolve) => setTimeout(() => resolve(), delay));
}
export async function timeoutRace(promise, maxTime) {
	let timeoutTask;
	const output = await Promise.race([
		promise,
		new Promise((_, reject) => {
			timeoutTask = setTimeout(() => {
				reject("Timeout exceeded");
			}, maxTime);
		}),
	]);
	clearTimeout(timeoutTask);
	return output;
}

export function randomString(
	len,
	characters = "abcdefghijklmnopqrstuvwxyz0123456789"
) {
	return Array.from(new Array(len), () =>
		randomItemOfString(characters)
	).join("");
}
export function randomItemOfString(str) {
	return str[Math.floor(Math.random() * str.length)];
}
