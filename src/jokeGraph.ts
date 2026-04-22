import { END, START, StateGraph } from "@langchain/langgraph";
import {
	generateBaseJoke,
	generateRelatedJokes,
	pickBestJoke,
	saveRelatedJokesToDb,
	skipRelatedJokesPersistence,
} from "@/nodes";
import { JokeStateAnnotation } from "@/joke.annotation";
import routeAfterRelatedJokes from "@/routeAfterRelatedJokes";

export const jokeGraph = new StateGraph(JokeStateAnnotation)
	.addNode("generateBaseJoke", generateBaseJoke)
	.addNode("generateRelatedJokes", generateRelatedJokes)
	.addNode("saveRelatedJokesToDb", saveRelatedJokesToDb)
	.addNode("skipRelatedJokesPersistence", skipRelatedJokesPersistence)
	.addNode("pickBestJoke", pickBestJoke)
	.addEdge(START, "generateBaseJoke")
	.addEdge("generateBaseJoke", "generateRelatedJokes")
	.addConditionalEdges("generateRelatedJokes", routeAfterRelatedJokes)
	.addEdge("saveRelatedJokesToDb", "pickBestJoke")
	.addEdge("skipRelatedJokesPersistence", "pickBestJoke")
	.addEdge("pickBestJoke", END)
	.compile();
