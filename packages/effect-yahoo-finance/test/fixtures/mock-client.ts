import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  UrlParams,
} from "@effect/platform";
import { Effect, Layer } from "effect";
import chartAaplSuccess from "./chart-aapl-success.json";
import chartNotFound from "./chart-not-found.json";
import searchBadRequest from "./search-bad-request.json";
import searchMultipleQuotes from "./search-multiple-quotes.json";
import searchSingleQuote from "./search-single-quote.json";

const createMockResponse = (
  request: HttpClientRequest.HttpClientRequest,
  status: number,
  body: unknown,
): HttpClientResponse.HttpClientResponse => {
  return HttpClientResponse.fromWeb(
    request,
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

const handleMockRequest = (
  request: HttpClientRequest.HttpClientRequest,
): HttpClientResponse.HttpClientResponse => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Get URL params from the request
  const paramsString = UrlParams.toString(request.urlParams);
  const searchParams = new URLSearchParams(paramsString);

  // Search quotes - single
  if (
    path === "/v1/finance/search" &&
    searchParams.get("q") === "AAPL" &&
    searchParams.get("quotesCount") === "1"
  ) {
    return createMockResponse(request, 200, searchSingleQuote);
  }

  // Search quotes - multiple
  if (path === "/v1/finance/search" && searchParams.get("q") === "AAPL,TSLA") {
    return createMockResponse(request, 200, searchMultipleQuotes);
  }

  // Search quotes - bad request (empty query)
  if (path === "/v1/finance/search" && searchParams.get("q") === "") {
    return createMockResponse(request, 400, searchBadRequest);
  }

  // Chart data - success (AAPL)
  if (
    path === "/v8/finance/chart/AAPL" &&
    searchParams.get("period1") === "1726444800" &&
    searchParams.get("period2") === "1726617600"
  ) {
    return createMockResponse(request, 200, chartAaplSuccess);
  }

  // Chart data - not found
  if (path === "/v8/finance/chart/SPLK") {
    return createMockResponse(request, 404, chartNotFound);
  }

  // Default: return 404
  return createMockResponse(request, 404, {
    error: "Not mocked",
  });
};

const makeMockClient = Effect.sync((): HttpClient.HttpClient => {
  const execute = (
    request: HttpClientRequest.HttpClientRequest,
  ): Effect.Effect<HttpClientResponse.HttpClientResponse, never> => {
    return Effect.succeed(handleMockRequest(request));
  };

  // Don't apply filterStatusOk here - the real client does it in client.ts
  return HttpClient.make(execute);
});

export const MockHttpClient = Layer.effect(
  HttpClient.HttpClient,
  makeMockClient,
);
