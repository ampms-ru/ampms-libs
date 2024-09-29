import { FetchHttpClient } from "@effect/platform";
import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PriceHistoryError } from "../src/errors";
import {
  PriceHistory,
  Resolution,
  TradingViewHistory,
  TradingViewInfo,
} from "../src/schema";
import { BoerseFrankfurtService } from "../src/service";

const TestLayer = Layer.provide(
  BoerseFrankfurtService.Live,
  FetchHttpClient.layer,
);

layer(TestLayer)("BoerseFrankfurtService", (it) => {
  it.effect("should get trading view info", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result =
        yield* BoerseFrankfurtService.getTradingViewInfo("XETR:IE00BK5H8015");

      expect(result).toStrictEqual(
        new TradingViewInfo({
          data_status: "pulsed",
          description: "SPDR STOXX Europe 600 SRI UCITS ETF (Acc)",
          exchange: "XETR",
          expired: false,
          force_session_rebuild: false,
          has_daily: true,
          has_empty_bars: false,
          has_intraday: true,
          has_no_volume: false,
          has_seconds: true,
          has_weekly_and_monthly: true,
          listed_exchange: "XETR",
          minmov: 1,
          minmov2: 0,
          minmovement: 1,
          minmovement2: 0,
          name: "IE00BK5H8015",
          pointvalue: 1,
          pricescale: 1000,
          session: "0900-1730",
          supported_resolutions: [
            Resolution.Minute10,
            Resolution.Minute15,
            Resolution.Minute30,
            Resolution.Hour,
            Resolution.Day,
            Resolution.Week,
            Resolution.Month,
            Resolution.Quarter,
          ],
          ticker: "XETR:IE00BK5H8015",
          timezone: "Europe/Berlin",
          volume_precision: 0,
        }),
      );
    }),
  );

  it.effect("should get trading view history", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* BoerseFrankfurtService.getTradingViewRawHistory({
        symbol: "STOX:EU0009658145",
        resolution: Resolution.Day,
        from: new Date(1726760940),
        to: new Date(1727624940),
      });

      expect(result).toStrictEqual(
        new TradingViewHistory({
          s: "ok",
          t: [
            1726790400, 1727049600, 1727136000, 1727222400, 1727308800,
            1727395200,
          ],
          c: [4871.54, 4885.57, 4940.72, 4916.89, 5032.59, 5067.45],
          o: [4929.15, 4875.62, 4907.58, 4928.15, 4956.34, 5028.35],
          h: [4930.22, 4893.98, 4953.69, 4933.37, 5035.44, 5071.41],
          l: [4868.8, 4854.93, 4907.58, 4905.33, 4956.34, 5028.35],
          v: [null, null, null, null, null, null],
        }),
      );
    }),
  );

  it.effect("should get price history", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      const result = yield* BoerseFrankfurtService.getPriceHistory({
        symbol: "XETR:IE00BK5H8015",
        from: new Date("2024-09-16"),
        to: new Date("2024-09-18"),
      });

      expect(result).toStrictEqual({
        data: [
          new PriceHistory({
            close: 31.48,
            date: "2024-09-18",
            high: 31.645,
            low: 31.48,
            open: 31.645,
            turnoverEuro: 157494.62,
            turnoverPieces: 4993,
          }),
          new PriceHistory({
            close: 31.675,
            date: "2024-09-17",
            high: 31.805,
            low: 31.675,
            open: 31.725,
            turnoverEuro: 93586.29,
            turnoverPieces: 2948,
          }),
          new PriceHistory({
            close: 31.59,
            date: "2024-09-16",
            high: 31.72,
            low: 31.58,
            open: 31.59,
            turnoverEuro: 314417.95,
            turnoverPieces: 9937,
          }),
        ],
        isin: "IE00BK5H8015",
        totalCount: 3,
        tradedInPercent: false,
      });
    }),
  );

  it.effect("should fail with PriceHistoryError", () => {
    expect.assertions(1);

    return BoerseFrankfurtService.getPriceHistory({
      symbol: "????:invalid",
      from: new Date(),
      to: new Date(),
    }).pipe(
      Effect.catchAll((error) => {
        expect(error).toBeInstanceOf(PriceHistoryError);
        return Effect.void;
      }),
    );
  });
});
