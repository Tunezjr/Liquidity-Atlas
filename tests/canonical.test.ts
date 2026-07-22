import { describe, expect, it } from "vitest";
import {
  InMemoryCanonicalRegistry,
  asChainId,
  makeCanonicalId,
  normalizeEvmAddress,
  validateCanonicalAsset,
  type CanonicalAsset,
  type CanonicalAssetId,
  type CanonicalEntity,
  type CanonicalEntityId,
  type CanonicalProtocol,
  type CanonicalProtocolId,
} from "../src/index.js";

const monad = asChainId(143);
const observedAt = "2026-07-18T00:00:00.000Z";

describe("canonical ids", () => {
  it("creates deterministic ids scoped by kind and Monad chain id", () => {
    const assetId = makeCanonicalId<CanonicalAssetId>("asset", monad, "mon");
    const protocolId = makeCanonicalId<CanonicalProtocolId>("protocol", monad, "example-dex");

    expect(assetId).toBe("asset:monad-143:mon");
    expect(protocolId).toBe("protocol:monad-143:example-dex");
  });

  it("rejects invalid slugs, chain ids, and EVM addresses", () => {
    expect(() => makeCanonicalId<CanonicalAssetId>("asset", monad, "Bad Symbol")).toThrow(/Invalid canonical asset slug/);
    expect(() => asChainId(0)).toThrow(/Invalid chain id/);
    expect(() => normalizeEvmAddress("0x123")).toThrow(/Invalid EVM address/);
  });

  it("normalizes EVM addresses to lowercase", () => {
    expect(normalizeEvmAddress("0xA000000000000000000000000000000000000001")).toBe("0xa000000000000000000000000000000000000001");
  });
});

describe("canonical asset validation", () => {
  it("accepts the native MON asset without a contract address", () => {
    const asset: CanonicalAsset = {
      id: makeCanonicalId<CanonicalAssetId>("asset", monad, "mon"),
      chainId: monad,
      type: "native",
      status: "active",
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      nativeAsset: true,
      verified: true,
      sourceRefs: [{ provider: "internal", reference: "genesis-native-asset", observedAt }],
    };

    expect(validateCanonicalAsset(asset)).toEqual({ valid: true, errors: [] });
  });

  it("requires normal ERC-20 assets to have a contract address", () => {
    const asset: CanonicalAsset = {
      id: makeCanonicalId<CanonicalAssetId>("asset", monad, "example-token"),
      chainId: monad,
      type: "erc20",
      status: "unverified",
      symbol: "EX",
      name: "Example Token",
      decimals: 18,
      nativeAsset: false,
      verified: false,
      sourceRefs: [],
    };

    expect(validateCanonicalAsset(asset).errors).toContain("Non-native assets must define a contract address unless synthetic or unknown.");
  });
});

describe("in-memory canonical registry", () => {
  it("stores and retrieves canonical assets, protocols, and entities", () => {
    const protocolId = makeCanonicalId<CanonicalProtocolId>("protocol", monad, "example-dex");
    const entityId = makeCanonicalId<CanonicalEntityId>("entity", monad, "example-router");
    const assetId = makeCanonicalId<CanonicalAssetId>("asset", monad, "example-token");
    const address = normalizeEvmAddress("0xa000000000000000000000000000000000000001");

    const protocol: CanonicalProtocol = {
      id: protocolId,
      name: "Example DEX",
      slug: "example-dex",
      type: "dex",
      chainId: monad,
      verified: true,
      sourceRefs: [{ provider: "internal", reference: "fixture", observedAt }],
    };

    const entity: CanonicalEntity = {
      id: entityId,
      chainId: monad,
      type: "router",
      label: "Example Router",
      address,
      protocolId,
      confidence: 1,
      sourceRefs: [{ provider: "internal", reference: "fixture", observedAt }],
    };

    const asset: CanonicalAsset = {
      id: assetId,
      chainId: monad,
      type: "erc20",
      status: "active",
      symbol: "EX",
      name: "Example Token",
      decimals: 18,
      contractAddress: address,
      nativeAsset: false,
      verified: true,
      sourceRefs: [{ provider: "internal", reference: "fixture", observedAt }],
    };

    const registry = new InMemoryCanonicalRegistry()
      .addProtocol(protocol)
      .addEntity(entity)
      .addAsset(asset);

    expect(registry.requireProtocol(protocolId)).toBe(protocol);
    expect(registry.requireEntity(entityId)).toBe(entity);
    expect(registry.requireAsset(assetId)).toBe(asset);
  });

  it("rejects duplicate canonical records", () => {
    const asset: CanonicalAsset = {
      id: makeCanonicalId<CanonicalAssetId>("asset", monad, "mon"),
      chainId: monad,
      type: "native",
      status: "active",
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      nativeAsset: true,
      verified: true,
      sourceRefs: [{ provider: "internal", reference: "fixture", observedAt }],
    };

    const registry = new InMemoryCanonicalRegistry().addAsset(asset);
    expect(() => registry.addAsset(asset)).toThrow(/Duplicate canonical asset/);
  });
});
