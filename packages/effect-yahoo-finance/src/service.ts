import { HttpClientResponse } from "@effect/platform";
import { DateTime, Effect, Layer, Match, Schema } from "effect";
import { makeV1HttpClient, makeV8HttpClient } from "./client";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  UnknownYahooFinanceError,
} from "./errors";
import {
  BadRequestFinanceError,
  GetChartDataOptions,
  GetChartDataResponse,
  GetHistoryError,
  GetPriceHistoryOptions,
  NotFoundFinanceError,
  PriceHistory,
  SearchQuotesError,
  SearchQuotesOptions,
  SearchQuotesResponse,
  UnknownFinanceError,
  UnprocessableEntityFinanceError,
} from "./schema";

export const handleErrors = Match.type<
  | BadRequestFinanceError
  | NotFoundFinanceError
  | UnprocessableEntityFinanceError
  | UnknownFinanceError
>().pipe(
  Match.tag("BadRequestError", (error) => new BadRequestError(error)),
  Match.tag("NotFoundError", (error) => new NotFoundError(error)),
  Match.tag(
    "UnprocessableEntityError",
    (error) => new UnprocessableEntityError(error),
  ),
  Match.orElse((error) => new UnknownYahooFinanceError(error)),
);

const makeService = Effect.gen(function* () {
  const clientV1 = yield* makeV1HttpClient;
  const clientV8 = yield* makeV8HttpClient;

  const searchQuotes = (options: SearchQuotesOptions) =>
    clientV1.get("/finance/search", { urlParams: options }).pipe(
      Effect.andThen(HttpClientResponse.schemaBodyJson(SearchQuotesResponse)),
      Effect.catchTag("ResponseError", ({ response }) =>
        response.json.pipe(
          Effect.andThen(Schema.decodeUnknown(SearchQuotesError)),
          Effect.andThen(({ finance }) => handleErrors(finance.error)),
        ),
      ),
      Effect.scoped,
    );

  const getChartData = ({ symbol, ...options }: GetChartDataOptions) =>
    clientV8.get(`/finance/chart/${symbol}`, { urlParams: options }).pipe(
      Effect.andThen(HttpClientResponse.schemaBodyJson(GetChartDataResponse)),
      Effect.catchTag("ResponseError", ({ response }) =>
        response.json.pipe(
          Effect.andThen(Schema.decodeUnknown(GetHistoryError)),
          Effect.andThen(({ chart }) => handleErrors(chart.error)),
        ),
      ),
      Effect.scoped,
    );

  const getPriceHistory = (options: GetPriceHistoryOptions) =>
    getChartData({
      symbol: options.symbol,
      period1: DateTime.toEpochMillis(DateTime.unsafeMake(options.from)) / 1000,
      period2: DateTime.toEpochMillis(DateTime.unsafeMake(options.to)) / 1000,
      interval: "1d",
      events: ["div", "splits", "capitalGains"],
    }).pipe(
      Effect.andThen(({ chart }) => chart.result[0]),
      Effect.andThen(Schema.decode(PriceHistory)),
    );

  return {
    searchQuotes,
    getChartData,
    getPriceHistory,
  };
});

export class YahooFinanceService extends Effect.Tag(
  "@ampms-libs/effect-yahoo-finance/YahooFinanceService",
)<YahooFinanceService, Effect.Effect.Success<typeof makeService>>() {
  static Live = Layer.effect(this, makeService);
}
