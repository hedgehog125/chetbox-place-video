const COLORS = [
	[255, 255, 255],
	[228, 228, 228],
	[136, 136, 136],
	[34, 34, 34],
	[244, 168, 209],
	[211, 18, 19],
	[217, 149, 25],
	[152, 106, 68],
	[225, 217, 32],
	[161, 223, 73],
	[78, 189, 18],
	[94, 210, 220],
	[61, 131, 198],
	[38, 15, 232],
	[197, 112, 227],
	[121, 10, 127],
];

const canvas = document.createElement("canvas");
canvas.width = 30;
canvas.height = 22;

const ctx = canvas.getContext("2d");
const pixelIds = prompt("Paste pixel ids").trim().split(",");
for (let i = 0; i < pixelIds.length; i++) {
	ctx.fillStyle = `rgba(${COLORS[pixelIds[i]]})`;
	ctx.fillRect(i % canvas.width, Math.floor(i / canvas.width), 1, 1);
}

canvas.style.width = "1000px";
canvas.style.height = "auto";
document.body.appendChild(canvas);
