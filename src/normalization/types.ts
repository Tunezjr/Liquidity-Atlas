import type { CanonicalAssetId, CanonicalEntityId, ChainId, EvmAddress, SourceRef } from "../canonical/types.js";

export type NormalizedEventType = "transfer" | "swap" | "deposit" | "withdraw" | "borrow" | "repay" | "stake" | "bridge" | "reward" | "unknown";

export interface NormalizedFlowEvent {
  readonly id: string;
  readonly chainId: ChainId;
  readonly type: NormalizedEventType;
  readonly source: SourceRef;
  readonly blockNumber: bigint;
  readonly transactionHash: `0x${string}`;
  readonly fromEntityId: CanonicalEntityId;
  readonly toEntityId: CanonicalEntityId;
  readonly assetId: CanonicalAssetId;
  readonly amountRaw: bigint;
  readonly amountDecimal: string;
  readonly contractAddress?: EvmAddress;
  readonly confidence: number;
}

export interface TokenTransferPayload {
  readonly transactionHash: `0x${string}`;
  readonly fromEntityId: CanonicalEntityId;
  readonly toEntityId: CanonicalEntityId;
  readonly assetId: CanonicalAssetId;
  readonly amountRaw: string;
  readonly decimals: number;
}
