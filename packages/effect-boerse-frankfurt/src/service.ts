import { HttpClientResponse } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect, Layer, String } from "effect";
import { makeBoerseFrankfurtHttpClient } from "./client";
import { PriceHistoryError } from "./errors";
import {
  GetPriceHistoryError,
  GetPriceHistoryOptions,
  GetPriceHistoryResponse,
  GetTradingViewHistoryOptions,
  PriceHistory,
  Ticker,
  TradingViewHistory,
  TradingViewInfo,
} from "./schema";

const makeService = Effect.gen(function* () {
  const client = yield* makeBoerseFrankfurtHttpClient;

  const getTradingViewInfo = (symbol: Ticker) =>
    client
      .get("/tradingview/symbols", { urlParams: { symbol } })
      .pipe(
        Effect.andThen(HttpClientResponse.schemaBodyJson(TradingViewInfo)),
        Effect.scoped,
      );

  const getTradingViewRawHistory = (options: GetTradingViewHistoryOptions) =>
    client
      .get("/tradingview/history", {
        urlParams: {
          symbol: options.symbol,
          resolution: options.resolution,
          from: options.from.getTime(),
          to: options.to.getTime(),
        },
      })
      .pipe(
        Effect.andThen(HttpClientResponse.schemaBodyJson(TradingViewHistory)),
        Effect.scoped,
      );

  const getTradingViewHistory = (options: GetTradingViewHistoryOptions) =>
    getTradingViewRawHistory(options).pipe(
      Effect.andThen(
        Schema.decode(
          Schema.transform(TradingViewHistory, Schema.Array(PriceHistory), {
            decode: (h) =>
              h.t.map((timestamp, index) => ({
                date: new Date(timestamp * 1000).toISOString().split("T")[0],
                open: h.o[index],
                high: h.h[index],
                low: h.l[index],
                close: h.c[index],
                turnoverEuro: 0,
                turnoverPieces: h.v[index] ?? 0,
              })),
            encode: (h) => ({
              s: "ok",
              t: h.map((p) => new Date(p.date).getTime()),
              c: h.map((p) => p.close),
              o: h.map((p) => p.open),
              h: h.map((p) => p.high),
              l: h.map((p) => p.low),
              v: h.map((p) => p.turnoverPieces),
            }),
          }),
        ),
      ),
    );

  const getPriceHistory = (options: GetPriceHistoryOptions) => {
    const [mic, isin] = String.split(options.symbol, ":");

    return client
      .get("/data/price_history", {
        urlParams: {
          isin: isin.toUpperCase(),
          mic: mic.toUpperCase(),
          minDate: options.from.toISOString().split("T")[0],
          maxDate: options.to.toISOString().split("T")[0],
          limit: options.limit,
          offset: options.offset,
        },
      })
      .pipe(
        Effect.andThen(
          HttpClientResponse.schemaBodyJson(GetPriceHistoryResponse),
        ),
        Effect.catchTag("ResponseError", ({ response }) =>
          response.json.pipe(
            Effect.andThen(Schema.decodeUnknown(GetPriceHistoryError)),
            Effect.andThen((res) => new PriceHistoryError(res)),
          ),
        ),
        Effect.scoped,
      );
  };

  return {
    getTradingViewInfo,
    getTradingViewRawHistory,
    getTradingViewHistory,
    getPriceHistory,
  };
});

export class BoerseFrankfurtService extends Effect.Tag(
  "@ampms-libs/effect-boerse-frankfurt/BoerseFrankfurtService",
)<BoerseFrankfurtService, Effect.Effect.Success<typeof makeService>>() {
  static Live = Layer.effect(this, makeService);
}
