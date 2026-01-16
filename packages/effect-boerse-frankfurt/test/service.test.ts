import { FetchHttpClient } from "@effect/platform";
import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
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
            Resolution.Minute15,
            Resolution.Hour,
            Resolution.Day,
            Resolution.Week,
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

  it.effect("should get mds token", () =>
    Effect.gen(function* () {
      expect.assertions(2);

      const result = yield* BoerseFrankfurtService.getMdsToken();

      expect(result).toStrictEqual({
        token: expect.any(String),
      });

      const decoded = JSON.parse(
        Buffer.from(result.token.split(".")[1], "base64").toString(),
      );

      expect(decoded).toStrictEqual(
        expect.objectContaining({
          iss: "token-service",
          sub: "mds-client",
          scope: "websocket",
          iat: expect.any(Number),
          exp: expect.any(Number),
        }),
      );
    }),
  );

  it.effect("should get price history", () =>
    Effect.gen(function* () {
      expect.assertions(1);

      // Use a recent date range to ensure data is available
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 7);

      const result = yield* BoerseFrankfurtService.getPriceHistory({
        symbol: "XETR:IE00BK5H8015",
        from: threeDaysAgo,
        to: today,
      });

      // Just verify the structure, not the exact values since they change daily
      expect(result).toStrictEqual({
        data: expect.any(Array),
        isin: "IE00BK5H8015",
        totalCount: expect.any(Number),
        tradedInPercent: false,
      });
    }),
  );
});
