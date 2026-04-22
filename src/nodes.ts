import {HumanMessage} from "@langchain/core/messages";
import {createChatModel} from "@/factory";
import {JokeStateAnnotation} from "@/joke.annotation";
import {saveRelatedJokes} from "@/db";

export async function generateBaseJoke(state: typeof JokeStateAnnotation.State) {
    const llm = createChatModel();

    const res = await llm.invoke([
        new HumanMessage(`Write one short joke about: ${state.topic}`),
    ]);

    return {baseJoke: String(res.content).trim()};
}

export async function generateRelatedJokes(state: typeof JokeStateAnnotation.State) {
    const llm = createChatModel();

    const res = await llm.invoke([
        new HumanMessage(
            `Based on this joke:\n${state.baseJoke}\n\nWrite exactly 3 related short jokes about ${state.topic}. Return one joke per line.`
        ),
    ]);

    const jokes = String(res.content)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 3);

    return {relatedJokes: jokes};
}

export async function saveRelatedJokesToDb(state: typeof JokeStateAnnotation.State) {
    if (!state.relatedJokes.length) {
        return { savedToDb: false };
    }

    saveRelatedJokes(state.topic, state.relatedJokes);

    return { savedToDb: true };
}

export function skipRelatedJokesPersistence() {
    return { savedToDb: false };
}

export async function pickBestJoke(state: typeof JokeStateAnnotation.State) {
    const llm = createChatModel();

    const candidates = [state.baseJoke, ...state.relatedJokes].filter(
        (x): x is string => Boolean(x)
    );

    const res = await llm.invoke([
        new HumanMessage(
            `Pick the funniest joke from this list and return only that joke:\n\n${candidates
                .map((j, i) => `${i + 1}. ${j}`)
                .join("\n")}`
        ),
    ]);

    return {bestJoke: String(res.content).trim()};
}
