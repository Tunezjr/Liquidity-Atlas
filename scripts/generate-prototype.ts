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
const weth = makeCanonicalId<CanonicalAssetId>("asset", chainId, "weth");
const stmon = makeCanonicalId<CanonicalAssetId>("asset", chainId, "stmon");

const walletA = makeCanonicalId<CanonicalEntityId>("entity", chainId, "wallet-a");
const whaleTreasury = makeCanonicalId<CanonicalEntityId>("entity", chainId, "whale-treasury");
const protocolTreasury = makeCanonicalId<CanonicalEntityId>("entity", chainId, "protocol-treasury");

const monadBridge = makeCanonicalId<CanonicalEntityId>("entity", chainId, "monad-bridge");
const layerZeroBridge = makeCanonicalId<CanonicalEntityId>("entity", chainId, "layerzero-bridge");
const wormholeBridge = makeCanonicalId<CanonicalEntityId>("entity", chainId, "wormhole-bridge");

const monUsdcPool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "ambient-mon-usdc-pool");
const monWethPool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "mon-weth-pool");
const usdcWethPool = makeCanonicalId<CanonicalEntityId>("entity", chainId, "usdc-weth-pool");

const yieldVault = makeCanonicalId<CanonicalEntityId>("entity", chainId, "yield-vault");
const stakedMonVault = makeCanonicalId<CanonicalEntityId>("entity", chainId, "staked-mon-vault");
const aaveMarket = makeCanonicalId<CanonicalEntityId>("entity", chainId, "aave-lending-market");

const rewards = makeCanonicalId<CanonicalEntityId>("entity", chainId, "rewards-distributor");
const ambientProtocol = makeCanonicalId<CanonicalEntityId>("entity", chainId, "ambient-protocol");
const kuruExchange = makeCanonicalId<CanonicalEntityId>("entity", chainId, "kuru-exchange");
const validatorSet = makeCanonicalId<CanonicalEntityId>("entity", chainId, "validator-set");

function asset(
  id: CanonicalAssetId,
  symbol: string,
  name: string,
  decimals: number,
  nativeAsset = false,
  address?: `0x${string}`,
): CanonicalAsset {
  return {
    id,
    chainId,
    type: nativeAsset ? "native" : "erc20",
    status: "active",
    symbol,
    name,
    decimals,
    nativeAsset,
    contractAddress: nativeAsset ? undefined : normalizeEvmAddress(address ?? "0xd000000000000000000000000000000000000001"),
    verified: true,
    sourceRefs: [source],
  };
}

function entity(
  id: CanonicalEntityId,
  type: CanonicalEntity["type"],
  label: string,
  address: `0x${string}`,
  confidence = 0.95,
): CanonicalEntity {
  return {
    id,
    chainId,
    type,
    label,
    address: normalizeEvmAddress(address),
    confidence,
    sourceRefs: [source],
  };
}

const registry = new InMemoryCanonicalRegistry()
  .addAsset(asset(mon, "MON", "Monad", 18, true))
  .addAsset(asset(usdc, "USDC", "USD Coin", 6, false, "0xc000000000000000000000000000000000000001"))
  .addAsset(asset(weth, "WETH", "Wrapped Ether", 18, false, "0xc000000000000000000000000000000000000002"))
  .addAsset(asset(stmon, "stMON", "Staked MON", 18, false, "0xc000000000000000000000000000000000000003"))
  .addEntity(entity(walletA, "account", "Wallet A", "0xa000000000000000000000000000000000000001", 1))
  .addEntity(entity(whaleTreasury, "account", "Whale Treasury", "0xa000000000000000000000000000000000000002", 0.98))
  .addEntity(entity(protocolTreasury, "treasury", "Protocol Treasury", "0xa000000000000000000000000000000000000003", 0.95))
  .addEntity(entity(monadBridge, "bridge", "Monad Bridge", "0xb000000000000000000000000000000000000001"))
  .addEntity(entity(layerZeroBridge, "bridge", "LayerZero Bridge", "0xb000000000000000000000000000000000000005"))
  .addEntity(entity(wormholeBridge, "bridge", "Wormhole Bridge", "0xb000000000000000000000000000000000000006"))
  .addEntity(entity(monUsdcPool, "pool", "MON / USDC Pool", "0xb000000000000000000000000000000000000002"))
  .addEntity(entity(monWethPool, "pool", "MON / WETH Pool", "0xb000000000000000000000000000000000000007"))
  .addEntity(entity(usdcWethPool, "pool", "USDC / WETH Pool", "0xb000000000000000000000000000000000000008"))
  .addEntity(entity(yieldVault, "vault", "Yield Vault", "0xb000000000000000000000000000000000000003", 0.9))
  .addEntity(entity(stakedMonVault, "vault", "Staked MON Vault", "0xb000000000000000000000000000000000000009", 0.9))
  .addEntity(entity(aaveMarket, "market", "Aave Lending Market", "0xb00000000000000000000000000000000000000a", 0.92))
  .addEntity(entity(rewards, "treasury", "Rewards Distributor", "0xb000000000000000000000000000000000000004", 0.9))
  .addEntity(entity(ambientProtocol, "protocol", "Ambient Protocol", "0xb00000000000000000000000000000000000000b", 0.93))
  .addEntity(entity(kuruExchange, "protocol", "Kuru Exchange", "0xb00000000000000000000000000000000000000c", 0.93))
  .addEntity(entity(validatorSet, "validator", "Validator Set", "0xb00000000000000000000000000000000000000d", 0.97));

const records: readonly RawRecord<TokenTransferPayload>[] = [
  // Bridge inflows
  flow("log-1", monadBridge, walletA, mon, "250000000000000000000", 18, 100n, "0xaaa1"),
  flow("log-2", layerZeroBridge, whaleTreasury, weth, "1800000000000000000", 18, 100n, "0xbbb1"),
  flow("log-3", wormholeBridge, protocolTreasury, usdc, "920000000", 6, 100n, "0xccc1"),
  // Into pools
  flow("log-4", walletA, monUsdcPool, mon, "120000000000000000000", 18, 101n, "0xaaa2"),
  flow("log-5", walletA, monUsdcPool, usdc, "450000000", 6, 101n, "0xaaa2"),
  flow("log-6", whaleTreasury, monWethPool, weth, "1100000000000000000", 18, 102n, "0xbbb2"),
  flow("log-7", whaleTreasury, usdcWethPool, usdc, "640000000", 6, 102n, "0xbbb3"),
  flow("log-8", protocolTreasury, monUsdcPool, usdc, "380000000", 6, 103n, "0xccc2"),
  // Pool → vault / lending
  flow("log-9", monUsdcPool, yieldVault, usdc, "250000000", 6, 104n, "0xaaa3"),
  flow("log-10", monWethPool, stakedMonVault, mon, "520000000000000000000", 18, 105n, "0xddd1"),
  flow("log-11", usdcWethPool, aaveMarket, usdc, "410000000", 6, 106n, "0xeee1"),
  flow("log-12", monUsdcPool, aaveMarket, usdc, "175000000", 6, 107n, "0xfff1"),
  // Protocol / rewards / staking
  flow("log-13", rewards, walletA, mon, "12000000000000000000", 18, 108n, "0xaaa4"),
  flow("log-14", ambientProtocol, rewards, mon, "85000000000000000000", 18, 109n, "0xggg1"),
  flow("log-15", kuruExchange, monWethPool, mon, "290000000000000000000", 18, 110n, "0xhhh1"),
  flow("log-16", stakedMonVault, validatorSet, stmon, "480000000000000000000", 18, 111n, "0xiii1"),
  flow("log-17", protocolTreasury, stakedMonVault, mon, "310000000000000000000", 18, 112n, "0xjjj1"),
];

function flow(
  id: string,
  fromEntityId: CanonicalEntityId,
  toEntityId: CanonicalEntityId,
  assetId: CanonicalAssetId,
  amountRaw: string,
  decimals: number,
  blockNumber: bigint,
  transactionHash: `0x${string}`,
): RawRecord<TokenTransferPayload> {
  return {
    id,
    kind: "log",
    chainId,
    source,
    observedAt: generatedAt,
    blockNumber,
    transactionHash,
    payload: { transactionHash, fromEntityId, toEntityId, assetId, amountRaw, decimals },
  };
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
  events: events.map((event) => ({
    ...event,
    amountRaw: event.amountRaw.toString(),
    blockNumber: event.blockNumber.toString(),
  })),
  attributions: attributions.map((row) => ({
    ...row,
    inflowRaw: row.inflowRaw.toString(),
    outflowRaw: row.outflowRaw.toString(),
    netRaw: row.netRaw.toString(),
  })),
  analytics: {
    eventCount: analytics.eventCount,
    totalRawByAsset: Object.fromEntries(
      [...analytics.totalRawByAsset.entries()].map(([key, value]) => [key, value.toString()]),
    ),
  },
};

await mkdir("public/prototype", { recursive: true });
await writeFile("public/prototype/data.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated public/prototype/data.json with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);
