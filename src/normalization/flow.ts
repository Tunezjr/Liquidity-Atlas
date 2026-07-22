import type { RawRecord } from "../acquisition/types.js";
import type { NormalizedFlowEvent, TokenTransferPayload } from "./types.js";

export function decimalFromRaw(amountRaw: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error(`Invalid decimals: ${decimals}`);
  const negative = amountRaw < 0n;
  const absolute = negative ? -amountRaw : amountRaw;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = absolute % scale;
  if (decimals === 0) return `${negative ? "-" : ""}${whole}`;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fractionText.length > 0 ? `.${fractionText}` : ""}`;
}

export function normalizeTokenTransfer(record: RawRecord<TokenTransferPayload>): NormalizedFlowEvent {
  if (record.blockNumber === undefined) throw new Error("Token transfer records require a block number.");
  const amountRaw = BigInt(record.payload.amountRaw);
  const event: NormalizedFlowEvent = {
    id: `flow:${record.chainId}:${record.payload.transactionHash}:${record.id}`,
    chainId: record.chainId,
    type: "transfer",
    source: record.source,
    blockNumber: record.blockNumber,
    transactionHash: record.payload.transactionHash,
    fromEntityId: record.payload.fromEntityId,
    toEntityId: record.payload.toEntityId,
    assetId: record.payload.assetId,
    amountRaw,
    amountDecimal: decimalFromRaw(amountRaw, record.payload.decimals),
    confidence: 1,
  };
  return record.address === undefined ? event : { ...event, contractAddress: record.address };
}
