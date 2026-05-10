// Test environment variables — mocks OpenAI key so tests never hit real API
process.env.OPENAI_API_KEY = "sk-test-mock-key-for-jest";
process.env.NODE_ENV = "test";

// Polyfill TextEncoder / TextDecoder for jsdom environment
import { TextEncoder, TextDecoder } from "util";
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// Polyfill ReadableStream for jsdom — wraps a string into a one-chunk stream
if (typeof globalThis.ReadableStream === "undefined") {
  class MockReadableStream {
    private _data: Uint8Array;
    constructor(init: { start(ctrl: { enqueue(v: Uint8Array): void; close(): void }): void }) {
      let data: Uint8Array = new Uint8Array();
      init.start({
        enqueue(v: Uint8Array) { data = v; },
        close() {},
      });
      this._data = data;
    }
    getReader() {
      let done = false;
      const data = this._data;
      return {
        read: async () => {
          if (!done) { done = true; return { value: data, done: false }; }
          return { value: undefined, done: true };
        },
      };
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ReadableStream = MockReadableStream;
}
