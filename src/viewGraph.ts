import * as fs from "node:fs/promises";
import { jokeGraph } from "./jokeGraph";

async function saveGraphImage() {
	const drawableGraph = await jokeGraph.getGraphAsync();
	const image = await drawableGraph.drawMermaidPng();
	const imageBuffer = new Uint8Array(await image.arrayBuffer());

	await fs.writeFile("graph.png", imageBuffer);
	console.log("Saved graph to graph.png");
}

saveGraphImage().catch(console.error);
