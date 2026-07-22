import type { NormalizedFlowEvent } from "../normalization/types.js";

export interface LiquidityAttribution {
  readonly entityId: string;
  readonly assetId: string;
  readonly inflowRaw: bigint;
  readonly outflowRaw: bigint;
  readonly netRaw: bigint;
}

export function attributeLiquidity(events: readonly NormalizedFlowEvent[]): readonly LiquidityAttribution[] {
  const rows = new Map<string, { entityId: string; assetId: string; inflowRaw: bigint; outflowRaw: bigint }>();
  const get = (entityId: string, assetId: string) => {
    const key = `${entityId}:${assetId}`;
    const existing = rows.get(key);
    if (existing !== undefined) return existing;
    const created = { entityId, assetId, inflowRaw: 0n, outflowRaw: 0n };
    rows.set(key, created);
    return created;
  };

  for (const event of events) {
    get(event.toEntityId, event.assetId).inflowRaw += event.amountRaw;
    get(event.fromEntityId, event.assetId).outflowRaw += event.amountRaw;
  }

  return [...rows.values()].map((row) => ({ ...row, netRaw: row.inflowRaw - row.outflowRaw }));
}
