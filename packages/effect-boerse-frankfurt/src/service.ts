import crypto from "node:crypto";

import { HttpClientResponse, Socket } from "@effect/platform";
import { NodeSocket } from "@effect/platform-node";
import {
  Chunk,
  Effect,
  Layer,
  Order,
  Queue,
  Schema,
  Stream,
  String,
} from "effect";
import { makeBoerseFrankfurtHttpClient } from "./client";
import { UnauthorizedError } from "./errors";
import {
  CompletionMessage,
  GetMdsTokenResponse,
  GetPriceHistoryOptions,
  GetTradingViewHistoryOptions,
  ListTimeseriesMessage,
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
                turnoverPieces: 0,
                turnoverEuro: h.v[index] ?? 0,
              })),
            encode: (h) => ({
              s: "ok",
              t: h.map((p) => new Date(p.date).getTime()),
              c: h.map((p) => p.close),
              o: h.map((p) => p.open),
              h: h.map((p) => p.high),
              l: h.map((p) => p.low),
              v: h.map((p) => p.turnoverEuro),
            }),
          }),
        ),
      ),
    );

  const getMdsToken = () => {
    const tokenPath = "/mdstokenservice/token";
    const clientDate = new Date().toISOString();
    const tracingId = "ea65e63f-b88f-414f-b1a9-e035263c8b0f";

    return client
      .get(tokenPath, {
        headers: {
          "X-Request-Datetime": clientDate,
          "X-Request-Trace-Id": crypto
            .createHash("sha256")
            .update(`${tokenPath}@${clientDate}W${tracingId}`)
            .digest("hex"),
        },
      })
      .pipe(
        Effect.andThen(HttpClientResponse.schemaBodyJson(GetMdsTokenResponse)),
        Effect.catchTag("ParseError", () => new UnauthorizedError()),
        Effect.scoped,
      );
  };

  const getPriceHistoryWs = (options: GetPriceHistoryOptions) =>
    Effect.gen(function* () {
      const [mic, isin] = String.split(options.symbol, ":");
      const micToMdsSourceId = new Map([
        ["XFRA", "FRA"],
        ["XETR", "ETR"],
        ["STOX", "STX"],
        ["XEUR", "EUR"],
        ["EZB", "ECB"],
      ]);
      const socket = yield* Socket.makeWebSocket(
        "wss://mds.ariva-services.de/api/v1/marketstates/ws",
      );
      const auth = yield* getMdsToken();
      const messages = yield* Queue.unbounded<string | Uint8Array>();
      yield* Effect.fork(socket.runRaw((_) => messages.offer(_)));
      yield* Effect.gen(function* () {
        const write = yield* socket.writer;
        yield* write(
          new TextEncoder().encode(
            JSON.stringify({
              subscribeAuthentication: auth,
              requestId: "request-0",
            }),
          ),
        );
        yield* write(
          new TextEncoder().encode(
            JSON.stringify({
              listTimeseries: {
                resolution: "1D",
                marketstateId: `REALTIME[${isin}@${micToMdsSourceId.get(mic)}]`,
                start: options.from.toISOString().split("T")[0],
                end: options.to.toISOString().split("T")[0],
                quality: "REALTIME",
              },
              requestId: "request-1",
            }),
          ),
        );
      }).pipe(Effect.scoped);

      return Stream.fromQueue(messages).pipe(
        Stream.flatMap(Schema.decodeUnknownOption(Schema.parseJson())),
        Stream.takeUntil(Schema.is(CompletionMessage)),
        Stream.filterMap(Schema.decodeUnknownOption(ListTimeseriesMessage)),
        Stream.map((msg) => msg.dataTimeseries),
      );
    }).pipe(Stream.unwrap);

  const getPriceHistory = (options: GetPriceHistoryOptions) =>
    getPriceHistoryWs(options).pipe(
      Stream.map(
        (dt) =>
          new PriceHistory({
            ...dt,
            turnoverPieces: dt.quantity,
            turnoverEuro: dt.turnover,
          }),
      ),
      Stream.runCollect,
      Effect.map(
        Chunk.sort(Order.reverse(Order.struct({ date: Order.string }))),
      ),
      Effect.map((ph) => ({
        data: Chunk.toArray(ph),
        isin: String.split(options.symbol, ":")[1],
        totalCount: ph.length,
        tradedInPercent: false,
      })),
      Effect.provide(NodeSocket.layerWebSocketConstructor),
    );

  return {
    getTradingViewInfo,
    getTradingViewRawHistory,
    getTradingViewHistory,
    getMdsToken,
    getPriceHistory,
  };
});

export class BoerseFrankfurtService extends Effect.Tag(
  "@ampms-libs/effect-boerse-frankfurt/BoerseFrankfurtService",
)<BoerseFrankfurtService, Effect.Effect.Success<typeof makeService>>() {
  static Live = Layer.effect(this, makeService);
}
