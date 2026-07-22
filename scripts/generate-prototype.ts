import { mkdir, writeFile } from "node:fs/promises";
import {
  InMemoryCanonicalRegistry,
  RelationshipGraphEngine,
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
const generatedAt = "2026-07-18T00:00:00.000Z";
const source = { provider: "prototype-fixture", reference: "demo-liquidity-flows", observedAt: generatedAt };

const mon = makeCanonicalId<CanonicalAssetId>("asset", chainId, "mon");
const usdc = makeCanonicalId<CanonicalAssetId>("asset", chainId, "usdc");
const walletA = makeCanonicalId<CanonicalEntityId>("entity", chainId, "wallet-a");
const bridge = makeCanonicalId<CanonicalEntityId>("entity", chainId, "monad-bridge");
const dexPool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "ambient-mon-usdc-pool");
const vault = makeCanonicalId<CanonicalEntityId>("entity", chainId, "yield-vault");
const rewards = makeCanonicalId<CanonicalEntityId>("entity", chainId, "rewards-distributor");

function asset(id: CanonicalAssetId, symbol: string, name: string, decimals: number, nativeAsset = false): CanonicalAsset {
  return {
    id,
    chainId,
    type: nativeAsset ? "native" : "erc20",
    status: "active",
    symbol,
    name,
    decimals,
    nativeAsset,
    contractAddress: nativeAsset ? undefined : normalizeEvmAddress(symbol === "USDC" ? "0xc000000000000000000000000000000000000001" : "0xd000000000000000000000000000000000000001"),
    verified: true,
    sourceRefs: [source],
  };
}

const registry = new InMemoryCanonicalRegistry()
  .addAsset(asset(mon, "MON", "Monad", 18, true))
  .addAsset(asset(usdc, "USDC", "USD Coin", 6))
  .addEntity({ id: walletA, chainId, type: "account", label: "Wallet A", address: normalizeEvmAddress("0xa000000000000000000000000000000000000001"), confidence: 1, sourceRefs: [source] })
  .addEntity({ id: bridge, chainId, type: "bridge", label: "Monad Bridge", address: normalizeEvmAddress("0xb000000000000000000000000000000000000001"), confidence: 0.95, sourceRefs: [source] })
  .addEntity({ id: dexPool, chainId, type: "pool", label: "MON / USDC Pool", address: normalizeEvmAddress("0xb000000000000000000000000000000000000002"), confidence: 0.95, sourceRefs: [source] })
  .addEntity({ id: vault, chainId, type: "vault", label: "Yield Vault", address: normalizeEvmAddress("0xb000000000000000000000000000000000000003"), confidence: 0.9, sourceRefs: [source] })
  .addEntity({ id: rewards, chainId, type: "treasury", label: "Rewards Distributor", address: normalizeEvmAddress("0xb000000000000000000000000000000000000004"), confidence: 0.9, sourceRefs: [source] });

const records: readonly RawRecord<TokenTransferPayload>[] = [
  flow("log-1", bridge, walletA, mon, "250000000000000000000", 18, 100n, "0xaaa1"),
  flow("log-2", walletA, dexPool, mon, "120000000000000000000", 18, 101n, "0xaaa2"),
  flow("log-3", walletA, dexPool, usdc, "450000000", 6, 101n, "0xaaa2"),
  flow("log-4", dexPool, vault, usdc, "250000000", 6, 102n, "0xaaa3"),
  flow("log-5", rewards, walletA, mon, "12000000000000000000", 18, 103n, "0xaaa4"),
];

function flow(id: string, fromEntityId: CanonicalEntityId, toEntityId: CanonicalEntityId, assetId: CanonicalAssetId, amountRaw: string, decimals: number, blockNumber: bigint, transactionHash: `0x${string}`): RawRecord<TokenTransferPayload> {
  return { id, kind: "log", chainId, source, observedAt: generatedAt, blockNumber, transactionHash, payload: { transactionHash, fromEntityId, toEntityId, assetId, amountRaw, decimals } };
}

const events = records.map(normalizeTokenTransfer);
const graph = new RelationshipGraphEngine().build(registry, events);
const attributions = attributeLiquidity(events);
const analytics = summarizeFlows(events);
const snapshot = createSnapshot({ graph, attributions, eventCount: analytics.eventCount }, { createdAt: generatedAt });
const api = graphResponse(graph, generatedAt);
const viewModel = toLiquidityMapViewModel(graph);

const payload = {
  generatedAt,
  snapshotId: snapshot.id,
  api,
  viewModel,
  events: events.map((event) => ({ ...event, amountRaw: event.amountRaw.toString(), blockNumber: event.blockNumber.toString() })),
  attributions: attributions.map((row) => ({ ...row, inflowRaw: row.inflowRaw.toString(), outflowRaw: row.outflowRaw.toString(), netRaw: row.netRaw.toString() })),
  analytics: { eventCount: analytics.eventCount, totalRawByAsset: Object.fromEntries([...analytics.totalRawByAsset.entries()].map(([key, value]) => [key, value.toString()])) },
};

await mkdir("public/prototype", { recursive: true });
await writeFile("public/prototype/data.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated public/prototype/data.json with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);
