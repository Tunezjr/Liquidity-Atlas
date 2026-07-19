import type { CanonicalRegistry } from "../canonical/types.js";
import type { NormalizedFlowEvent } from "../normalization/types.js";
import type { LiquidityEdge, LiquidityGraphSnapshot, LiquidityNode } from "./types.js";

export class RelationshipGraphEngine {
  build(registry: CanonicalRegistry, events: readonly NormalizedFlowEvent[]): LiquidityGraphSnapshot {
    const nodes = new Map<string, LiquidityNode>();
    const edges: LiquidityEdge[] = [];

    for (const entity of registry.entities.values()) {
      nodes.set(entity.id, { id: entity.id, kind: "entity", label: entity.label });
    }
    for (const asset of registry.assets.values()) {
      nodes.set(asset.id, { id: asset.id, kind: "asset", label: asset.symbol });
    }
    for (const protocol of registry.protocols.values()) {
      nodes.set(protocol.id, { id: protocol.id, kind: "protocol", label: protocol.name });
    }

    for (const event of events) {
      edges.push({
        id: `edge:${event.id}`,
        kind: "flow",
        fromNodeId: event.fromEntityId,
        toNodeId: event.toEntityId,
        weight: Number(event.amountDecimal),
        eventId: event.id,
      });
    }

    return { nodes: [...nodes.values()], edges };
  }
}
