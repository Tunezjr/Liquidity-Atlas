export type LiquidityNodeKind = "asset" | "entity" | "protocol" | "pool" | "market" | "vault" | "bridge" | "validator";
export type LiquidityEdgeKind = "flow" | "ownership" | "dependency" | "collateral" | "wrapper" | "route";

export interface LiquidityNode {
  readonly id: string;
  readonly kind: LiquidityNodeKind;
  readonly label: string;
}

export interface LiquidityEdge {
  readonly id: string;
  readonly kind: LiquidityEdgeKind;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly weight: number;
  readonly eventId?: string;
}

export interface LiquidityGraphSnapshot {
  readonly nodes: readonly LiquidityNode[];
  readonly edges: readonly LiquidityEdge[];
}
