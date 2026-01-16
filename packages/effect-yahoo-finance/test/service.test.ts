import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Layer } from "effect";
import { ChartResult, QuoteSymbol } from "../src";
import { MockHttpClient } from "./fixtures/mock-client";
import { BadRequestError, NotFoundError } from "../src/errors";
import { YahooFinanceService } from "../src/service";

const TestLayer = Layer.provide(YahooFinanceService.Live, MockHttpClient);

layer(TestLayer)("YahooFinanceService", (it) => {
  it.effect("should search quotes", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.searchQuotes({
        q: "AAPL",
        quotesCount: 1,
        newsCount: 0,
        listsCount: 0,
      });

      expect(result).toStrictEqual({
        count: 1,
        quotes: [
          expect.objectContaining({
            symbol: "AAPL",
            shortname: "Apple Inc.",
          }),
        ],
        news: [],
        nav: [],
        researchReports: [],
      });
    }),
  );

  it.effect("should search multiple quotes", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.searchQuotes({
        q: "AAPL,TSLA",
        newsCount: 0,
        listsCount: 0,
      });

      expect(result).toStrictEqual({
        count: 3,
        quotes: [
          expect.objectContaining({
            symbol: "AAPL",
            shortname: "Apple Inc.",
          }),
          expect.objectContaining({
            symbol: "TSLA",
            shortname: "Tesla, Inc.",
          }),
        ],
        news: [],
        nav: [{ navType: "MULTIQUOTE", symbols: ["AAPL", "TSLA"] }],
        researchReports: [],
      });
    }),
  );

  it.effect("should fail with BadRequestError", () => {
    expect.assertions(1);

    return YahooFinanceService.searchQuotes({ q: "" }).pipe(
      Effect.catchAll((error) => {
        expect(error).toBeInstanceOf(BadRequestError);
        return Effect.void;
      }),
    );
  });

  it.effect("should get chart data", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.getChartData({
        symbol: QuoteSymbol.fromString("AAPL"),
        period1:
          DateTime.toEpochMillis(DateTime.unsafeMake("2024-09-16")) / 1000,
        period2:
          DateTime.toEpochMillis(DateTime.unsafeMake("2024-09-18")) / 1000,
        interval: "1d",
      });

      expect(result).toStrictEqual({
        chart: {
          error: null,
          result: [
            ChartResult.make({
              indicators: {
                adjclose: [
                  { adjclose: [215.84495544433594, 216.31390380859375] },
                ],
                quote: [
                  {
                    close: [216.32000732421875, 216.7899932861328],
                    high: [217.22000122070312, 216.89999389648438],
                    low: [213.9199981689453, 214.5],
                    open: [216.5399932861328, 215.75],
                    volume: [59357400, 45519300],
                  },
                ],
              },
              meta: {
                chartPreviousClose: 222.5,
                currency: "USD",
                dataGranularity: "1d",
                exchangeName: "NMS",
                exchangeTimezoneName: "America/New_York",
                firstTradeDate: 345479400,
                gmtoffset: -14400,
                instrumentType: "EQUITY",
                priceHint: 2,
                regularMarketPrice:
                  result.chart.result[0].meta.regularMarketPrice,
                regularMarketTime:
                  result.chart.result[0].meta.regularMarketTime,
                symbol: "AAPL",
                timezone: "EDT",
              },
              timestamp: [
                DateTime.unsafeMake("2024-09-16T13:30:00.000Z"),
                DateTime.unsafeMake("2024-09-17T13:30:00.000Z"),
              ],
            }),
          ],
        },
      });
    }),
  );

  it.effect("should get history", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.getPriceHistory({
        symbol: QuoteSymbol.fromString("AAPL"),
        from: new Date("2024-09-16"),
        to: new Date("2024-09-18"),
      });

      expect(result).toStrictEqual({
        meta: expect.objectContaining({
          symbol: "AAPL",
          exchangeName: "NMS",
        }),
        quotes: [
          {
            close: 215.84495544433594,
            high: 217.22000122070312,
            low: 213.9199981689453,
            open: 216.5399932861328,
            timestamp: "2024-09-16",
            volume: 59357400,
          },
          {
            close: 216.31390380859375,
            high: 216.89999389648438,
            low: 214.5,
            open: 215.75,
            timestamp: "2024-09-17",
            volume: 45519300,
          },
        ],
      });
    }),
  );

  it.effect("should fail with NotFoundError", () => {
    expect.assertions(1);

    return YahooFinanceService.getChartData({
      symbol: QuoteSymbol.fromString("SPLK"),
      period1: DateTime.toEpochMillis(DateTime.unsafeMake("2024-09-16")) / 1000,
      period2: DateTime.toEpochMillis(DateTime.unsafeMake("2024-09-18")) / 1000,
      interval: "1d",
      events: [],
    }).pipe(
      Effect.catchAll((error) => {
        expect(error).toBeInstanceOf(NotFoundError);
        return Effect.void;
      }),
    );
  });
});
