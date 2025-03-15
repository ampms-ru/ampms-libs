import { FetchHttpClient } from "@effect/platform";
import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { BadRequestError, NotFoundError } from "../src/errors";
import { YahooFinanceService } from "../src/service";

const TestLayer = Layer.provide(
  YahooFinanceService.Live,
  FetchHttpClient.layer,
);

layer(TestLayer)("YahooFinanceService", (it) => {
  it.effect("should search quotes", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.searchQuotes("AAPL");

      expect(result).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            symbol: "AAPL",
            shortname: "Apple Inc.",
          }),
        ]),
      );
    }),
  );

  it.effect("should fail with BadRequestError", () => {
    expect.assertions(1);

    return YahooFinanceService.searchQuotes("").pipe(
      Effect.catchAll((error) => {
        expect(error).toBeInstanceOf(BadRequestError);
        return Effect.void;
      }),
    );
  });

  it.effect("should get history", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* YahooFinanceService.getPriceHistory({
        symbol: "AAPL",
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

    return YahooFinanceService.getPriceHistory({
      symbol: "SPLK",
      from: new Date("2024-09-16"),
      to: new Date("2024-09-18"),
    }).pipe(
      Effect.catchAll((error) => {
        expect(error).toBeInstanceOf(NotFoundError);
        return Effect.void;
      }),
    );
  });
});
