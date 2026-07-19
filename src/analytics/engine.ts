import type { NormalizedFlowEvent } from "../normalization/types.js";

export interface FlowAnalyticsSummary {
  readonly eventCount: number;
  readonly totalRawByAsset: ReadonlyMap<string, bigint>;
}

export function summarizeFlows(events: readonly NormalizedFlowEvent[]): FlowAnalyticsSummary {
  const totalRawByAsset = new Map<string, bigint>();
  for (const event of events) {
    totalRawByAsset.set(event.assetId, (totalRawByAsset.get(event.assetId) ?? 0n) + event.amountRaw);
  }
  return { eventCount: events.length, totalRawByAsset };
}
