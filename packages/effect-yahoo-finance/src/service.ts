import { HttpClientResponse } from "@effect/platform";
import { Effect, Layer, Match, Schema } from "effect";
import { getUnixTime } from "date-fns";
import { makeV1HttpClient, makeV8HttpClient } from "./client";
import { BadRequestError, NotFoundError, YahooFinanceError } from "./errors";
import {
  GetHistoryError,
  GetHistoryResponse,
  GetPriceHistoryOptions,
  SearchQuotesError,
  SearchQuotesResponse,
} from "./schema";

const makeService = Effect.gen(function* () {
  const clientV1 = yield* makeV1HttpClient;
  const clientV8 = yield* makeV8HttpClient;

  const searchQuotes = (q: string) =>
    clientV1.get("/finance/search", { urlParams: { q } }).pipe(
      Effect.andThen(HttpClientResponse.schemaBodyJson(SearchQuotesResponse)),
      Effect.andThen(({ quotes }) => quotes),
      Effect.catchTag("ResponseError", ({ response }) =>
        response.json.pipe(
          Effect.andThen(Schema.decodeUnknown(SearchQuotesError)),
          Effect.andThen(({ finance }) =>
            Match.value(finance.error).pipe(
              Match.tag(
                "BadRequestError",
                (error) => new BadRequestError(error),
              ),
              Match.orElse((error) => new YahooFinanceError(error)),
            ),
          ),
        ),
      ),
      Effect.scoped,
    );

  const getPriceHistory = (options: GetPriceHistoryOptions) =>
    clientV8
      .get(`/finance/chart/${options.symbol}`, {
        urlParams: {
          period1: getUnixTime(options.from),
          period2: getUnixTime(options.to),
          interval: "1d",
          events: ["div", "splits", "capitalGains"],
        },
      })
      .pipe(
        Effect.andThen(HttpClientResponse.schemaBodyJson(GetHistoryResponse)),
        Effect.andThen(({ chart }) => chart.result[0]),
        Effect.catchTag("ResponseError", ({ response }) =>
          response.json.pipe(
            Effect.andThen(Schema.decodeUnknown(GetHistoryError)),
            Effect.andThen(({ chart }) =>
              Match.value(chart.error).pipe(
                Match.tag("NotFoundError", (error) => new NotFoundError(error)),
                Match.orElse((error) => new YahooFinanceError(error)),
              ),
            ),
          ),
        ),
        Effect.scoped,
      );

  return {
    searchQuotes,
    getPriceHistory,
  };
});

export class YahooFinanceService extends Effect.Tag(
  "@ampms-libs/effect-yahoo-finance/YahooFinanceService",
)<YahooFinanceService, Effect.Effect.Success<typeof makeService>>() {
  static Live = Layer.effect(this, makeService);
}
