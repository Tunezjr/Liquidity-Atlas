import type { ChainId, EvmAddress, SourceRef } from "../canonical/types.js";

export type RawRecordKind = "log" | "transaction" | "contract_call" | "provider_payload";

export interface RawRecord<TPayload = unknown> {
  readonly id: string;
  readonly kind: RawRecordKind;
  readonly chainId: ChainId;
  readonly source: SourceRef;
  readonly observedAt: string;
  readonly blockNumber?: bigint;
  readonly transactionHash?: `0x${string}`;
  readonly address?: EvmAddress;
  readonly payload: TPayload;
}

export interface AcquisitionCursor {
  readonly provider: string;
  readonly chainId: ChainId;
  readonly fromBlock: bigint;
  readonly toBlock: bigint;
}

export interface AcquisitionProvider<TPayload = unknown> {
  readonly name: string;
  fetch(cursor: AcquisitionCursor): Promise<readonly RawRecord<TPayload>[]>;
}
