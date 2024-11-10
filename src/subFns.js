import puppeteer from "puppeteer";
import path from "path";
import { downloadGif, generatePixelIds, wait } from "./lib.js";
import { COLORS, GIF_FILENAME } from "./constants.js";
import { readFile } from "fs/promises";
import decodeGif from "decode-gif";

export async function loadPage() {
	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();
		await page.goto(process.env.SITE_URL);

		await page.waitForSelector("td");
		while (true) {
			const pixels = await page.$$("td");
			if (
				pixels.length ===
				parseInt(process.env.CANVAS_WIDTH) *
					parseInt(process.env.CANVAS_HEIGHT)
			) {
				const paletteButtons = await page.$$("#palette > span");
				if (paletteButtons.length !== COLORS.length) {
					await browser.close();
					throw new Error(
						`Found ${paletteButtons.length} palette buttons instead of expected ${COLORS.length}`
					);
				}

				return { page, browser, pixels, paletteButtons };
			}
			await wait(100);
		}
	} catch (error) {
		await browser.close();
		throw error;
	}
}
export async function prepareGif() {
	await downloadGif();
	const gifData = decodeGif(
		await readFile(path.join(process.env.MOUNT_PATH, GIF_FILENAME))
	);
	// TODO: take into account varying frame lengths
	const frameId = 0;
	return {
		pixelIds: generatePixelIds(gifData, frameId),
		width: gifData.width,
		height: gifData.height,
	};
}
export async function renderFrame(
	pixelIds,
	width,
	outputPixels,
	paletteButtons,
	page
) {
	const canvasWidth = parseInt(process.env.CANVAS_WIDTH);
	const offsetX = parseInt(process.env.RENDER_X);
	const offsetY = parseInt(process.env.RENDER_Y);
	if (isNaN(canvasWidth) || isNaN(offsetX) || isNaN(offsetY)) {
		throw new Error("Invalid environment variables for renderFrame");
	}

	let totalUpdated = 0;
	for (
		let colorIdToDraw = 0;
		colorIdToDraw < COLORS.length;
		colorIdToDraw++
	) {
		await paletteButtons[colorIdToDraw].click();
		await wait(50);

		for (let i = 0; i < pixelIds.length; i++) {
			if (pixelIds[i] === colorIdToDraw) {
				const drawPosX = (i % width) + offsetX;
				const drawPosY = Math.floor(i / width) + offsetY;

				const drawPosIndex = drawPosY * canvasWidth + drawPosX;

				const pixelClassList = await page.evaluate(
					(element) => [...element.classList],
					outputPixels[drawPosIndex]
				);
				const colorClassName = pixelClassList.find((className) =>
					className.startsWith("color-")
				);
				if (colorClassName == null) {
					throw new Error("Couldn't find current colour of pixel");
				}
				const currentPixelColorId = parseInt(
					colorClassName.split("color-")[1],
					16
				);
				if (isNaN(currentPixelColorId)) {
					throw new Error("currentPixelColorId is NaN");
				}
				if (
					currentPixelColorId < 0 ||
					currentPixelColorId >= COLORS.length
				) {
					throw new Error(
						`currentPixelColorId is out of range: ${currentPixelColorId}`
					);
				}

				if (currentPixelColorId !== pixelIds[i]) {
					outputPixels[drawPosIndex].click();
					totalUpdated++;
					await wait(25);
				}
			}
		}
	}

	await wait(1000);
	return totalUpdated;
}
