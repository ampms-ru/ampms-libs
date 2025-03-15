import { formatISO, fromUnixTime, getUnixTime } from "date-fns";
import { Schema } from "effect";

export class SearchQuote extends Schema.Class<SearchQuote>("SearchQuote")({
  quoteType: Schema.String,
  shortname: Schema.optional(Schema.String),
  longname: Schema.optional(Schema.String),
  symbol: Schema.String,
  index: Schema.String,
  score: Schema.Number,
  typeDisp: Schema.String,
  exchange: Schema.String,
  exchDisp: Schema.String,
  sector: Schema.optional(Schema.String),
  sectorDisp: Schema.optional(Schema.String),
  industry: Schema.optional(Schema.String),
  industryDisp: Schema.optional(Schema.String),
  dispSecIndFlag: Schema.optional(Schema.Boolean),
  isYahooFinance: Schema.Boolean,
}) {}

export const SearchQuotesResponse = Schema.Struct({
  count: Schema.Number,
  quotes: Schema.Array(SearchQuote),
});

const BadRequestFinanceError = Schema.Struct({
  code: Schema.Literal("Bad Request"),
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "BadRequestError"));

const AnyFinanceError = Schema.Struct({
  code: Schema.String,
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "AnyError"));

export const SearchQuotesError = Schema.Struct({
  finance: Schema.Struct({
    result: Schema.Null,
    error: Schema.Union(BadRequestFinanceError, AnyFinanceError),
  }),
});

export interface GetPriceHistoryOptions {
  readonly symbol: string;
  readonly from: Date;
  readonly to: Date;
}

const FormattedDateFromUnix = Schema.transform(Schema.Number, Schema.String, {
  decode: (n) => formatISO(fromUnixTime(n), { representation: "date" }),
  encode: (s) => getUnixTime(new Date(s)),
});

const ChartMeta = Schema.Struct({
  chartPreviousClose: Schema.Number,
  currency: Schema.String,
  dataGranularity: Schema.String,
  exchangeName: Schema.String,
  exchangeTimezoneName: Schema.String,
  firstTradeDate: Schema.Number,
  gmtoffset: Schema.Number,
  instrumentType: Schema.String,
  priceHint: Schema.Number,
  regularMarketPrice: Schema.Number,
  regularMarketTime: Schema.Number,
  symbol: Schema.String,
  timezone: Schema.String,
});

export const ChartResult = Schema.transform(
  Schema.Struct({
    indicators: Schema.Struct({
      adjclose: Schema.optional(
        Schema.Array(
          Schema.Struct({
            adjclose: Schema.optional(
              Schema.Array(Schema.NullOr(Schema.Number)),
            ),
          }),
        ),
      ),
      quote: Schema.Array(
        Schema.Struct({
          close: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
          high: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
          low: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
          open: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
          volume: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
        }),
      ),
    }),
    timestamp: Schema.optional(Schema.Array(FormattedDateFromUnix)),
    meta: ChartMeta,
  }),
  Schema.Struct({
    quotes: Schema.Array(
      Schema.Struct({
        timestamp: Schema.typeSchema(FormattedDateFromUnix),
        close: Schema.NullOr(Schema.Number),
        high: Schema.NullOr(Schema.Number),
        low: Schema.NullOr(Schema.Number),
        open: Schema.NullOr(Schema.Number),
        volume: Schema.NullOr(Schema.Number),
      }),
    ),
    meta: ChartMeta,
  }),
  {
    decode: (r) => ({
      quotes: (r.timestamp ?? []).map((timestamp, i) => ({
        timestamp,
        open: r.indicators.quote[0].open![i],
        low: r.indicators.quote[0].low![i],
        high: r.indicators.quote[0].high![i],
        close:
          r.indicators.adjclose?.[0].adjclose?.[i] ??
          r.indicators.quote[0].close![i],
        volume: r.indicators.quote[0].volume![i],
      })),
      meta: r.meta,
    }),
    encode: (r) => ({
      timestamp: r.quotes.map((q) => q.timestamp),
      indicators: {
        quote: [
          {
            open: r.quotes.map((q) => q.open),
            low: r.quotes.map((q) => q.low),
            high: r.quotes.map((q) => q.high),
            close: r.quotes.map((q) => q.close),
            volume: r.quotes.map((q) => q.volume),
          },
        ],
      },
      meta: r.meta,
    }),
  },
);
export type ChartResult = Schema.Schema.Type<typeof ChartResult>;

export const GetHistoryResponse = Schema.Struct({
  chart: Schema.Struct({
    result: Schema.Array(ChartResult),
    error: Schema.Null,
  }),
});

const NotFoundChartError = Schema.Struct({
  code: Schema.Literal("Not Found"),
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "NotFoundError"));

const AnyChartError = Schema.Struct({
  code: Schema.String,
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "AnyError"));

export const GetHistoryError = Schema.Struct({
  chart: Schema.Struct({
    result: Schema.Null,
    error: Schema.Union(NotFoundChartError, AnyChartError),
  }),
});
