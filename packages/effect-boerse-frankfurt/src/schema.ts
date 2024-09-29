import { Schema } from "@effect/schema";

const MicCode = Schema.String.pipe(Schema.length(4));

export enum Resolution {
  Minute10 = "10",
  Minute15 = "15",
  Minute30 = "30",
  Hour = "60",
  Day = "1D",
  Week = "1W",
  Month = "1M",
  Quarter = "3M",
}

export const Ticker = Schema.TemplateLiteral(Schema.String, ":", Schema.String);
export type Ticker = Schema.Schema.Type<typeof Ticker>;

// =============== Get Trading View Info ===============

export class TradingViewInfo extends Schema.Class<TradingViewInfo>(
  "TradingViewInfo",
)({
  data_status: Schema.String,
  description: Schema.String,
  exchange: MicCode,
  expired: Schema.Boolean,
  force_session_rebuild: Schema.Boolean,
  has_daily: Schema.Boolean,
  has_empty_bars: Schema.Boolean,
  has_intraday: Schema.Boolean,
  has_no_volume: Schema.Boolean,
  has_seconds: Schema.Boolean,
  has_weekly_and_monthly: Schema.Boolean,
  listed_exchange: MicCode,
  minmov: Schema.Number,
  minmov2: Schema.Number,
  minmovement: Schema.Number,
  minmovement2: Schema.Number,
  name: Schema.String,
  pointvalue: Schema.Number,
  pricescale: Schema.Number,
  session: Schema.String,
  supported_resolutions: Schema.Array(Schema.Enums(Resolution)),
  ticker: Ticker,
  timezone: Schema.String,
  volume_precision: Schema.Number,
}) {}

// =============== Get Trading View History ===============

export interface GetTradingViewHistoryOptions {
  readonly symbol: Ticker;
  readonly resolution: Resolution;
  readonly from: Date;
  readonly to: Date;
}

export class TradingViewHistory extends Schema.Class<TradingViewHistory>(
  "TradingViewHistory",
)({
  s: Schema.String,
  t: Schema.Array(Schema.Number),
  c: Schema.Array(Schema.Number),
  o: Schema.Array(Schema.Number),
  h: Schema.Array(Schema.Number),
  l: Schema.Array(Schema.Number),
  v: Schema.Array(Schema.NullOr(Schema.Number)),
}) {}

// =============== Get Price History ===============

export interface GetPriceHistoryOptions {
  readonly symbol: Ticker;
  readonly from: Date;
  readonly to: Date;
  readonly limit?: number;
  readonly offset?: number;
}

export class PriceHistory extends Schema.Class<PriceHistory>("PriceHistory")({
  date: Schema.String,
  open: Schema.Number,
  high: Schema.Number,
  low: Schema.Number,
  close: Schema.Number,
  turnoverEuro: Schema.Number,
  turnoverPieces: Schema.Number,
}) {}

export const GetPriceHistoryResponse = Schema.Struct({
  data: Schema.Array(PriceHistory),
  isin: Schema.String,
  totalCount: Schema.Number,
  tradedInPercent: Schema.NullOr(Schema.Boolean),
});

export const GetPriceHistoryError = Schema.Struct({
  messages: Schema.Array(Schema.String),
});
