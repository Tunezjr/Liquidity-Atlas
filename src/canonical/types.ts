export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type CanonicalAssetId = Brand<string, "CanonicalAssetId">;
export type CanonicalProtocolId = Brand<string, "CanonicalProtocolId">;
export type CanonicalEntityId = Brand<string, "CanonicalEntityId">;
export type CanonicalPoolId = Brand<string, "CanonicalPoolId">;
export type CanonicalMarketId = Brand<string, "CanonicalMarketId">;
export type CanonicalVaultId = Brand<string, "CanonicalVaultId">;
export type CanonicalBridgeId = Brand<string, "CanonicalBridgeId">;
export type CanonicalValidatorId = Brand<string, "CanonicalValidatorId">;
export type ChainId = Brand<number, "ChainId">;
export type EvmAddress = Brand<`0x${string}`, "EvmAddress">;

export type CanonicalIdKind =
  | "asset"
  | "protocol"
  | "entity"
  | "pool"
  | "market"
  | "vault"
  | "bridge"
  | "validator";

export type AssetType =
  | "native"
  | "erc20"
  | "wrapped"
  | "bridged"
  | "lp_token"
  | "vault_share"
  | "lending_receipt"
  | "debt_token"
  | "staking_receipt"
  | "reward"
  | "nft_position"
  | "synthetic"
  | "unknown";

export type AssetStatus = "active" | "unverified" | "deprecated" | "blocked" | "spam" | "unknown";
export type ProtocolType = "dex" | "lending" | "vault" | "staking" | "bridge" | "nft" | "governance" | "oracle" | "other";
export type EntityType = "account" | "contract" | "protocol" | "pool" | "market" | "vault" | "bridge" | "validator" | "treasury" | "router" | "factory" | "unknown";

export interface SourceRef {
  readonly provider: string;
  readonly reference: string;
  readonly observedAt: string;
}

export interface CanonicalAsset {
  readonly id: CanonicalAssetId;
  readonly chainId: ChainId;
  readonly type: AssetType;
  readonly status: AssetStatus;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly contractAddress?: EvmAddress;
  readonly nativeAsset: boolean;
  readonly canonicalUnderlyingAssetId?: CanonicalAssetId;
  readonly wrappedFromAssetId?: CanonicalAssetId;
  readonly verified: boolean;
  readonly sourceRefs: readonly SourceRef[];
}

export interface CanonicalProtocol {
  readonly id: CanonicalProtocolId;
  readonly name: string;
  readonly slug: string;
  readonly type: ProtocolType;
  readonly chainId: ChainId;
  readonly verified: boolean;
  readonly sourceRefs: readonly SourceRef[];
}

export interface CanonicalEntity {
  readonly id: CanonicalEntityId;
  readonly chainId: ChainId;
  readonly type: EntityType;
  readonly label: string;
  readonly address?: EvmAddress;
  readonly protocolId?: CanonicalProtocolId;
  readonly confidence: number;
  readonly sourceRefs: readonly SourceRef[];
}

export interface CanonicalRegistry {
  readonly assets: ReadonlyMap<CanonicalAssetId, CanonicalAsset>;
  readonly protocols: ReadonlyMap<CanonicalProtocolId, CanonicalProtocol>;
  readonly entities: ReadonlyMap<CanonicalEntityId, CanonicalEntity>;
}
