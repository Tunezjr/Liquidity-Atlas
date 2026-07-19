import type { CanonicalAsset, CanonicalAssetId, CanonicalEntity, CanonicalEntityId, CanonicalProtocol, CanonicalProtocolId, CanonicalRegistry } from "./types.js";
import { assertValid, validateCanonicalAsset, validateCanonicalEntity, validateCanonicalProtocol } from "./validation.js";

export class InMemoryCanonicalRegistry implements CanonicalRegistry {
  readonly assets = new Map<CanonicalAssetId, CanonicalAsset>();
  readonly protocols = new Map<CanonicalProtocolId, CanonicalProtocol>();
  readonly entities = new Map<CanonicalEntityId, CanonicalEntity>();

  addAsset(asset: CanonicalAsset): this {
    assertValid(validateCanonicalAsset(asset));
    this.assertUnique(this.assets, asset.id, "asset");
    this.assets.set(asset.id, asset);
    return this;
  }

  addProtocol(protocol: CanonicalProtocol): this {
    assertValid(validateCanonicalProtocol(protocol));
    this.assertUnique(this.protocols, protocol.id, "protocol");
    this.protocols.set(protocol.id, protocol);
    return this;
  }

  addEntity(entity: CanonicalEntity): this {
    assertValid(validateCanonicalEntity(entity));
    this.assertUnique(this.entities, entity.id, "entity");
    this.entities.set(entity.id, entity);
    return this;
  }

  requireAsset(id: CanonicalAssetId): CanonicalAsset {
    const asset = this.assets.get(id);
    if (asset === undefined) throw new Error(`Unknown canonical asset: ${id}`);
    return asset;
  }

  requireProtocol(id: CanonicalProtocolId): CanonicalProtocol {
    const protocol = this.protocols.get(id);
    if (protocol === undefined) throw new Error(`Unknown canonical protocol: ${id}`);
    return protocol;
  }

  requireEntity(id: CanonicalEntityId): CanonicalEntity {
    const entity = this.entities.get(id);
    if (entity === undefined) throw new Error(`Unknown canonical entity: ${id}`);
    return entity;
  }

  private assertUnique<K, V>(map: ReadonlyMap<K, V>, id: K, kind: string): void {
    if (map.has(id)) throw new Error(`Duplicate canonical ${kind}: ${String(id)}`);
  }
}
