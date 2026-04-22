// src/app.ts
import { Elysia, sse, t } from "elysia";
import { jokeGraph } from "./jokeGraph";
import openapi from "@elysiajs/openapi";
import { renderLiveTracePage } from "./liveTracePage";
import { getAllRelatedJokes } from "@/db";

export const app = new Elysia()
	.use(openapi())
	.get("/", () => ({
		ok: true,
		routes: [
			"/joke",
			"/joke/debug",
			"/graph/png",
			"/joke/live",
			"/joke/live/stream?topic=programmers",
			"/jokes/db",
		],
	}))
	.post(
		"/joke",
		async ({ body }) => {
			const result = await jokeGraph.invoke({
				topic: body.topic,
				relatedJokes: [],
			});

			return {
				topic: result.topic,
				baseJoke: result.baseJoke,
				relatedJokes: result.relatedJokes,
				bestJoke: result.bestJoke,
			};
		},
		{
			body: t.Object({
				topic: t.String({ minLength: 1 }),
			}),
		},
	)
	.get("/graph/png", async () => {
		const drawable = await jokeGraph.getGraphAsync();
		const image = await drawable.drawMermaidPng();
		const arrayBuffer = await image.arrayBuffer();

		return new Response(arrayBuffer, {
			headers: {
				"content-type": "image/png",
				"cache-control": "no-store",
			},
		});
	})
	.post(
		"/joke/debug",
		async ({ body }) => {
			const chunks: unknown[] = [];

			for await (const chunk of await jokeGraph.stream(
				{
					topic: body.topic,
					relatedJokes: [],
				},
				{
					streamMode: "debug",
				},
			)) {
				chunks.push(chunk);
			}

			return {
				topic: body.topic,
				trace: chunks,
			};
		},
		{
			body: t.Object({
				topic: t.String({ minLength: 1 }),
			}),
		},
	)

	.get("/joke/live", ({ query }) => {
		const initialTopic =
			typeof query.topic === "string" && query.topic.trim().length > 0
				? query.topic.trim()
				: "programmers";

		const html = renderLiveTracePage(initialTopic);

		return new Response(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		});
	})

	.get(
		"/joke/live/stream",
		async function* ({ query, set }) {
			const topic =
				typeof query.topic === "string" && query.topic.trim().length > 0
					? query.topic.trim()
					: "programmers";

			set.headers["cache-control"] = "no-store";

			yield sse({
				event: "start",
				data: JSON.stringify({
					topic,
					mode: "updates + values",
				}),
			});

			try {
				const stream = await jokeGraph.stream(
					{
						topic,
						relatedJokes: [],
					},
					{
						streamMode: ["updates", "values"],
					},
				);

				for await (const chunk of stream) {
					const [mode, data] = chunk as [string, unknown];

					if (mode === "updates") {
						const updateObject =
							typeof data === "object" && data !== null
								? (data as Record<string, unknown>)
								: {};

						for (const [node, update] of Object.entries(updateObject)) {
							yield sse({
								event: "node",
								data: JSON.stringify({ node, update }),
							});

							yield sse({
								event: "node_done",
								data: JSON.stringify({ node }),
							});
						}
					}

					if (mode === "values") {
						yield sse({
							event: "state",
							data: JSON.stringify(data),
						});
					}
				}

				yield sse({
					event: "done",
					data: JSON.stringify({
						ok: true,
						topic,
					}),
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";

				yield sse({
					event: "error_event",
					data: JSON.stringify({
						ok: false,
						message,
					}),
				});
			}
		},
		{
			query: t.Object({
				topic: t.Optional(t.String()),
			}),
		},
	)
	.get("/jokes/db", () => {
		return {
			rows: getAllRelatedJokes(),
		};
	});
