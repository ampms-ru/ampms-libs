import { Coercible } from "@effect/platform/UrlParams";
import { DateTime, Number, Schema } from "effect";

export interface SearchQuotesOptions
  extends Readonly<Record<string, Coercible>> {
  readonly q: string;
  readonly quotesCount?: number;
  readonly newsCount?: number;
  readonly listsCount?: number;
  readonly enableResearchReports?: boolean;
  readonly researchReportsCount?: number;
  readonly quotesQueryId?: "tss_match_phrase_query" | string;
  readonly multiQuoteQueryId?: "multi_quote_single_token_query" | string;
  readonly newsQueryId?: "news_ss_symbols" | "news_cie_vespa" | string;
  readonly enableNavLinks?: boolean;
  readonly enableFuzzyQuery?: boolean;
  readonly enableEnhancedTrivialQuery?: boolean;
  readonly enableCb?: boolean;
  readonly lang?: "en-US" | string;
  readonly region?: "US" | string;
}

export class QuoteSymbol extends Schema.Uppercased.pipe(
  Schema.brand("QuoteSymbol"),
) {
  static fromString(s: string): QuoteSymbol {
    return Schema.decodeSync(this)(s) as any;
  }
}

export class SearchQuote extends Schema.Class<SearchQuote>("SearchQuote")({
  quoteType: Schema.String,
  shortname: Schema.optional(Schema.String),
  longname: Schema.optional(Schema.String),
  symbol: QuoteSymbol,
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

const DateTimeUtcFromUnixTimestamp = Schema.transform(
  Schema.Number,
  Schema.DateTimeUtcFromNumber,
  {
    strict: true,
    decode: Number.multiply(1000),
    encode: Number.unsafeDivide(1000),
  },
);

export class SearchNews extends Schema.Class<SearchNews>("SearchNews")({
  uuid: Schema.UUID,
  title: Schema.String,
  publisher: Schema.String,
  link: Schema.URL,
  providerPublishTime: DateTimeUtcFromUnixTimestamp,
  type: Schema.Uppercased,
  thumbnail: Schema.optional(
    Schema.Struct({
      resolutions: Schema.Array(
        Schema.Struct({
          url: Schema.URL,
          width: Schema.Number,
          height: Schema.Number,
          tag: Schema.String,
        }),
      ),
    }),
  ),
  relatedTickers: Schema.Array(QuoteSymbol),
}) {}

export class ResearchReport extends Schema.Class<ResearchReport>(
  "ResearchReport",
)({
  id: Schema.String,
  author: Schema.String,
  provider: Schema.String,
  reportDate: Schema.DateTimeUtcFromNumber,
  reportHeadline: Schema.String,
}) {}

export const SearchQuotesResponse = Schema.Struct({
  count: Schema.Number,
  quotes: Schema.Array(SearchQuote),
  news: Schema.Array(SearchNews),
  nav: Schema.Array(
    Schema.Struct({
      navType: Schema.Literal("MULTIQUOTE"),
      symbols: Schema.Array(QuoteSymbol),
    }),
  ),
  researchReports: Schema.Array(ResearchReport),
});

export const BadRequestFinanceError = Schema.Struct({
  code: Schema.Literal("Bad Request"),
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "BadRequestError"));
export type BadRequestFinanceError = Schema.Schema.Type<
  typeof BadRequestFinanceError
>;

export const NotFoundFinanceError = Schema.Struct({
  code: Schema.Literal("Not Found"),
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "NotFoundError"));
export type NotFoundFinanceError = Schema.Schema.Type<
  typeof NotFoundFinanceError
>;

export const UnprocessableEntityFinanceError = Schema.Struct({
  code: Schema.Literal("Unprocessable Entity"),
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "UnprocessableEntityError"));
export type UnprocessableEntityFinanceError = Schema.Schema.Type<
  typeof UnprocessableEntityFinanceError
>;

export const UnknownFinanceError = Schema.Struct({
  code: Schema.String,
  description: Schema.String,
}).pipe(Schema.attachPropertySignature("_tag", "UnknownError"));
export type UnknownFinanceError = Schema.Schema.Type<
  typeof UnknownFinanceError
>;

export const SearchQuotesError = Schema.Struct({
  finance: Schema.Struct({
    result: Schema.Null,
    error: Schema.Union(BadRequestFinanceError, UnknownFinanceError),
  }),
});

export interface GetChartDataOptions {
  readonly symbol: QuoteSymbol;
  readonly period1: number;
  readonly period2: number;
  readonly interval:
    | "1m"
    | "2m"
    | "5m"
    | "15m"
    | "30m"
    | "90m"
    | "1h"
    | "1d"
    | "5d"
    | "1wk"
    | "1mo"
    | "3mo";
  readonly events?: ("div" | "splits" | "capitalGains")[];
}

export interface GetPriceHistoryOptions {
  readonly symbol: QuoteSymbol;
  readonly from: Date;
  readonly to: Date;
}

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

export class ChartResult extends Schema.Class<ChartResult>("ChartResult")({
  indicators: Schema.Struct({
    adjclose: Schema.optional(
      Schema.Array(
        Schema.Struct({
          adjclose: Schema.optional(Schema.Array(Schema.NullOr(Schema.Number))),
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
  timestamp: Schema.optional(Schema.Array(DateTimeUtcFromUnixTimestamp)),
  meta: ChartMeta,
}) {}

export const PriceHistory = Schema.transform(
  Schema.typeSchema(ChartResult),
  Schema.Struct({
    quotes: Schema.Array(
      Schema.Struct({
        timestamp: Schema.transform(Schema.DateTimeUtcFromSelf, Schema.String, {
          strict: true,
          decode: (d) => DateTime.formatIsoDate(d),
          encode: (d) => DateTime.unsafeMake(d),
        }),
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
    strict: true,
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
export type PriceHistory = Schema.Schema.Type<typeof PriceHistory>;

export const GetChartDataResponse = Schema.Struct({
  chart: Schema.Struct({
    result: Schema.Array(ChartResult),
    error: Schema.Null,
  }),
});

export const GetHistoryError = Schema.Struct({
  chart: Schema.Struct({
    result: Schema.Null,
    error: Schema.Union(
      BadRequestFinanceError,
      NotFoundFinanceError,
      UnprocessableEntityFinanceError,
      UnknownFinanceError,
    ),
  }),
});
