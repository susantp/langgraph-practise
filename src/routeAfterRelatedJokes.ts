import { JokeStateAnnotation } from "@/joke.annotation";

export default function routeAfterRelatedJokes(
	state: typeof JokeStateAnnotation.State,
) {
	if (state.relatedJokes.length > 0) {
		return "saveRelatedJokesToDb";
	}

	return "skipRelatedJokesPersistence";
}
