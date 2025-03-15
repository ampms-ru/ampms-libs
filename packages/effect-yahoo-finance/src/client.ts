import { HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect } from "effect";

export const makeV1HttpClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return client.pipe(
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(
      HttpClientRequest.prependUrl("https://query2.finance.yahoo.com/v1"),
    ),
  );
});

export const makeV8HttpClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return client.pipe(
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(
      HttpClientRequest.prependUrl("https://query2.finance.yahoo.com/v8"),
    ),
  );
});
