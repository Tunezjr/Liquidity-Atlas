import type { LiquidityGraphSnapshot } from "../graph/types.js";

export interface ApiResponse<T> {
  readonly data: T;
  readonly meta: { readonly generatedAt: string; readonly version: "v1" };
}

export function graphResponse(graph: LiquidityGraphSnapshot, generatedAt: string): ApiResponse<LiquidityGraphSnapshot> {
  return { data: graph, meta: { generatedAt, version: "v1" } };
}
