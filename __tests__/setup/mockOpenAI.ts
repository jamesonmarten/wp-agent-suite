// Shared mock for OpenAI streaming — returns a predictable streamed response
// without ever calling the real API.
// This file runs via setupFilesAfterEnv so `jest` globals are available.

function makeMockOpenAI() {
  const chunks = ["mocked", "AI", "response", "text", "for", "testing"].map((word) => ({
    choices: [{ delta: { content: word + " " } }],
  }));

  const asyncIterator = {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < chunks.length) return { value: chunks[i++], done: false as const };
          return { value: undefined as never, done: true as const };
        },
      };
    },
  };

  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(asyncIterator),
      },
    },
  };
}

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => makeMockOpenAI());
});
