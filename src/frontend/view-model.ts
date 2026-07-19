import type { LiquidityGraphSnapshot } from "../graph/types.js";

export interface LiquidityMapViewModel {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly animatedEdgeIds: readonly string[];
}

export function toLiquidityMapViewModel(graph: LiquidityGraphSnapshot): LiquidityMapViewModel {
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    animatedEdgeIds: graph.edges.filter((edge) => edge.kind === "flow" && edge.weight > 0).map((edge) => edge.id),
  };
}
