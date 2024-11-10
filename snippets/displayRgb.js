const canvas = document.createElement("canvas");
canvas.width = 30;
canvas.height = 22;

const ctx = canvas.getContext("2d");
const pixelIds = prompt("Paste pixel ids").trim().split(",");
for (let i = 0; i < pixelIds.length; i++) {
	ctx.fillStyle = `rgba(${pixelIds[i].replaceAll("|", ",")})`;
	ctx.fillRect(i % canvas.width, Math.floor(i / canvas.width), 1, 1);
}

canvas.style.width = "1000px";
canvas.style.height = "auto";
document.body.appendChild(canvas);
