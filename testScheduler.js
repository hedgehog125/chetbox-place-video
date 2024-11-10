import { spawn } from "child_process";

function tick() {
	const process = spawn("node", ["index.js"]);

	process.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
	});
	process.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});
	process.on("close", (code) => {
		console.log(`Process exited with code ${code}`);
	});
}
setInterval(tick, 60 * 1000);
tick();
