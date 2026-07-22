import { describe, expect, it } from "vitest";
import {
  InMemoryCanonicalRegistry,
  MetricsCollector,
  RelationshipGraphEngine,
  StaticAcquisitionProvider,
  asChainId,
  attributeLiquidity,
  createSnapshot,
  graphResponse,
  makeCanonicalId,
  normalizeEvmAddress,
  normalizeTokenTransfer,
  summarizeFlows,
  toLiquidityMapViewModel,
  type CanonicalAsset,
  type CanonicalAssetId,
  type CanonicalEntity,
  type CanonicalEntityId,
  type RawRecord,
  type TokenTransferPayload,
} from "../src/index.js";

const chainId = asChainId(143);
const observedAt = "2026-07-18T00:00:00.000Z";
const assetId = makeCanonicalId<CanonicalAssetId>("asset", chainId, "mon");
const source = { provider: "fixture-rpc", reference: "block-range-1-10", observedAt };

function registryFixture(): InMemoryCanonicalRegistry {
  const wallet = makeCanonicalId<CanonicalEntityId>("entity", chainId, "wallet-a");
  const pool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "pool-a");
  const asset: CanonicalAsset = {
    id: assetId,
    chainId,
    type: "native",
    status: "active",
    symbol: "MON",
    name: "Monad",
    decimals: 18,
    nativeAsset: true,
    verified: true,
    sourceRefs: [source],
  };
  const walletEntity: CanonicalEntity = {
    id: wallet,
    chainId,
    type: "account",
    label: "Wallet A",
    address: normalizeEvmAddress("0xa000000000000000000000000000000000000001"),
    confidence: 1,
    sourceRefs: [source],
  };
  const poolEntity: CanonicalEntity = {
    id: pool,
    chainId,
    type: "pool",
    label: "Pool A",
    address: normalizeEvmAddress("0xb000000000000000000000000000000000000001"),
    confidence: 1,
    sourceRefs: [source],
  };
  return new InMemoryCanonicalRegistry().addAsset(asset).addEntity(walletEntity).addEntity(poolEntity);
}

describe("liquidity map pipeline layers 2 through 10", () => {
  it("acquires, normalizes, graphs, attributes, snapshots, analyzes, exposes, projects, and observes flow data", async () => {
    const wallet = makeCanonicalId<CanonicalEntityId>("entity", chainId, "wallet-a");
    const pool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "pool-a");
    const record: RawRecord<TokenTransferPayload> = {
      id: "log-1",
      kind: "log",
      chainId,
      source,
      observedAt,
      blockNumber: 10n,
      transactionHash: "0xabc",
      payload: {
        transactionHash: "0xabc",
        fromEntityId: wallet,
        toEntityId: pool,
        assetId,
        amountRaw: "1500000000000000000",
        decimals: 18,
      },
    };

    const provider = new StaticAcquisitionProvider("fixture-rpc", [record]);
    const rawRecords = await provider.fetch({ provider: "fixture-rpc", chainId, fromBlock: 1n, toBlock: 10n });
    const events = rawRecords.map(normalizeTokenTransfer);
    const registry = registryFixture();
    const graph = new RelationshipGraphEngine().build(registry, events);
    const attributions = attributeLiquidity(events);
    const snapshot = createSnapshot({ graph, attributions }, { createdAt: observedAt });
    const analytics = summarizeFlows(events);
    const api = graphResponse(graph, observedAt);
    const viewModel = toLiquidityMapViewModel(api.data);
    const metrics = new MetricsCollector();
    metrics.record({ stage: "acquisition", name: "records", value: rawRecords.length, recordedAt: observedAt });
    metrics.record({ stage: "graph", name: "edges", value: graph.edges.length, recordedAt: observedAt });

    expect(events[0]?.amountDecimal).toBe("1.5");
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(1);
    expect(attributions.find((row) => row.entityId === pool)?.netRaw).toBe(1500000000000000000n);
    expect(attributions.find((row) => row.entityId === wallet)?.netRaw).toBe(-1500000000000000000n);
    expect(snapshot.id).toMatch(/^snapshot:1:/);
    expect(analytics.totalRawByAsset.get(assetId)).toBe(1500000000000000000n);
    expect(api.meta.version).toBe("v1");
    expect(viewModel.animatedEdgeIds).toEqual(["edge:flow:143:0xabc:log-1"]);
    expect(metrics.latest("graph", "edges")?.value).toBe(1);
  });
});
