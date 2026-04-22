import { Annotation } from "@langchain/langgraph";

export const JokeStateAnnotation = Annotation.Root({
	topic: Annotation<string>,
	baseJoke: Annotation<string | undefined>,
	relatedJokes: Annotation<string[]>({
		reducer: (_, right) => right,
		default: () => [],
	}),
	bestJoke: Annotation<string | undefined>,
	savedToDb: Annotation<boolean>({
		reducer: (_, right) => right,
		default: () => false,
	}),
});
