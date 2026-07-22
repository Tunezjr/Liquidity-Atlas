diff --git a/README.md b/README.md
index c5d62efbb02ad37436c921c2090739e7875ffb69..72609c4712fd528bcd578396f5d5bdb9afb9c07d 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,207 @@
-# BuildAnything-Hackathon
\ No newline at end of file
+# BuildAnything Hackathon
+
+## Monad Liquidity Map
+
+This project is a graph-based liquidity intelligence layer for Monad. It is designed to turn raw on-chain and provider data into a visual liquidity map where users can understand how value moves across wallets, assets, pools, bridges, lending markets, vaults, staking systems, rewards, and protocols.
+
+The product metaphor is water flow:
+
+- **Nodes** represent assets, positions, protocols, accounts, pools, markets, vaults, bridges, validators, and other liquidity containers.
+- **Edges** represent liquidity flow, ownership, dependency, collateralization, wrapping, lending, borrowing, staking, bridging, and other value-transfer relationships.
+- **Snapshots** represent the state of liquidity at a reproducible point in time.
+- **Flow events** represent observed movement between entities.
+
+## Architecture Principles
+
+The implementation is guided by accepted Engineering Decision Records:
+
+1. **Graph-Based Liquidity Attribution Engine** — liquidity is represented as a directed graph rather than a tree.
+2. **Canonical Asset Identity** — every asset receives a canonical identity while preserving wrapper, derivative, bridge, and protocol-specific metadata.
+3. **Protocol Adapter Architecture** — protocol-specific retrieval and transformation logic is isolated behind adapters.
+4. **Immutable Snapshot Model** — indexing cycles produce immutable snapshots, and corrections create new snapshots instead of mutating existing records.
+5. **Multi-Stage Indexing Pipeline** — ingestion is separated into fetch, normalize, validate, resolve identities, build graph, compute metrics, and persist stages.
+6. **Deterministic Calculation Engine** — identical inputs must produce identical outputs.
+7. **Separation of Raw and Derived Data** — raw observations are stored independently from derived metrics and graph outputs.
+8. **Documentation as a First-Class Artifact** — architecture documents, ADRs, design specs, implementation guides, and operational docs are version controlled.
+
+## Build Order
+
+The platform should be built in the following order:
+
+### 1. Canonical Data Layer
+
+Define the internal source of truth for platform identifiers and data contracts.
+
+Initial scope:
+
+- Canonical asset identities.
+- Canonical protocol identities.
+- Canonical entity identities.
+- Canonical pool, market, vault, bridge, and validator identities.
+- Raw-versus-derived storage boundaries.
+- Shared schema contracts used by every downstream engine.
+
+### 2. Data Acquisition
+
+Create adapters and ingestion paths for raw observations.
+
+Initial scope:
+
+- Monad RPC and WebSocket ingestion.
+- Explorer and provider ingestion where useful.
+- Protocol registry ingestion.
+- Token, pool, transaction, log, and metadata acquisition.
+- Provider configuration, retry rules, rate limits, and fallback behavior.
+
+### 3. Data Normalization Engine
+
+Convert raw source-specific records into canonical platform records.
+
+Initial scope:
+
+- Event decoding.
+- Token amount normalization.
+- Address normalization.
+- Asset identity resolution.
+- Protocol adapter outputs.
+- Validation rules and confidence metadata.
+
+### 4. Relationship Graph Engine
+
+Build the directed graph that models liquidity state and relationships.
+
+Initial scope:
+
+- Node creation for assets, accounts, pools, protocols, wrappers, markets, and positions.
+- Edge creation for transfers, swaps, deposits, withdrawals, borrows, repays, collateral links, staking links, bridge links, ownership, and dependency.
+- Cycle detection.
+- Path traversal utilities.
+- Incremental graph update boundaries.
+
+### 5. Liquidity Attribution Engine
+
+Interpret graph relationships into economic liquidity movement and exposure.
+
+Initial scope:
+
+- Flow attribution from decoded events.
+- Ownership and exposure attribution.
+- Wrapper and derivative attribution.
+- Collateral and borrow attribution.
+- LP and vault share attribution.
+- Confidence scoring for inferred relationships.
+
+### 6. Snapshot & Historical Data Engine
+
+Persist reproducible point-in-time state and historical flow records.
+
+Initial scope:
+
+- Immutable snapshots.
+- Versioned correction snapshots.
+- Historical liquidity and TVL records.
+- Finality and reconciliation windows.
+- Snapshot lineage and source metadata.
+
+### 7. Analytics & Calculation Engine
+
+Compute metrics from canonical records, graph outputs, and snapshots.
+
+Initial scope:
+
+- TVL and liquidity depth.
+- Net inflow and outflow.
+- Volume by protocol, pool, asset, route, and entity.
+- Liquidity concentration.
+- Path and dependency analysis.
+- Deterministic replay calculations.
+
+### 8. Public API Layer
+
+Expose stable interfaces for the frontend and external consumers.
+
+Initial scope:
+
+- Liquidity graph endpoints.
+- Flow event endpoints.
+- Snapshot endpoints.
+- Asset, protocol, entity, and pool lookup endpoints.
+- Analytics endpoints.
+- API versioning and response contracts.
+
+### 9. Frontend Application
+
+Render the liquidity map and supporting product experience.
+
+Initial scope:
+
+- Visual liquidity map.
+- Water-flow animations.
+- Entity and protocol detail panels.
+- Time-range controls.
+- Asset and protocol filters.
+- Snapshot playback.
+- Confidence and stale-data indicators.
+
+### 10. Observability & Operations
+
+Make the system debuggable, measurable, and operable.
+
+Initial scope:
+
+- Pipeline stage metrics.
+- Adapter health checks.
+- Provider latency and failure tracking.
+- Indexing lag monitoring.
+- Snapshot generation monitoring.
+- Data-quality alerts.
+- Operational runbooks.
+
+### 11. Testing, Validation & Production Hardening
+
+Validate correctness, reliability, and operational readiness.
+
+Initial scope:
+
+- Unit tests for schemas, adapters, normalization, graph construction, and calculations.
+- Fixture-based deterministic replay tests.
+- Integration tests for acquisition and API layers.
+- Data reconciliation tests against secondary providers.
+- Load tests for graph and API endpoints.
+- Reorg, retry, backfill, and provider-failure testing.
+- Security and production-readiness checks.
+
+## Implementation Rule
+
+Build each layer so downstream layers depend only on canonical internal contracts, not directly on third-party providers. External data sources may enrich, validate, or backfill the map, but the authoritative liquidity-flow layer should be generated from normalized on-chain observations and deterministic internal processing.
+
+## Current Implementation
+
+The repository now includes working foundations for build layers 1 through 10. These modules are intentionally small, deterministic, and fixture-friendly so production adapters and storage can be added without changing downstream contracts.
+
+Implemented capabilities by layer:
+
+1. **Canonical Data Layer** — branded TypeScript identifiers, canonical asset/protocol/entity contracts, validation, deterministic ID creation, EVM address normalization, and an in-memory canonical registry.
+2. **Data Acquisition** — acquisition provider interfaces, raw record contracts, block-range cursors, and a static fixture provider for deterministic tests.
+3. **Data Normalization Engine** — token-transfer payload contracts, raw-to-decimal conversion, and normalized flow-event creation.
+4. **Relationship Graph Engine** — graph node/edge contracts and a graph builder that turns registry records and normalized flow events into a liquidity graph snapshot.
+5. **Liquidity Attribution Engine** — inflow, outflow, and net raw-amount attribution by entity and asset.
+6. **Snapshot & Historical Data Engine** — immutable content-addressed snapshot creation with deterministic SHA-256 hashes and version metadata.
+7. **Analytics & Calculation Engine** — deterministic flow summaries and raw totals grouped by asset.
+8. **Public API Layer** — versioned API response envelopes for graph payloads.
+9. **Frontend Application** — liquidity-map view-model projection for node counts, edge counts, and animated flow edges.
+10. **Observability & Operations** — pipeline metric contracts and an in-memory metrics collector for stage-level observability.
+
+Run the current checks with:
+
+```bash
+npm run check
+```
+
+Run the working prototype locally with:
+
+```bash
+npm run prototype:serve
+```
+
+The prototype serves a static web application from `public/`, generates deterministic fixture data at `public/prototype/data.json`, and renders animated liquidity pipes from bridge, wallet, pool, vault, and reward-distributor entities. A captured preview is stored at `public/screenshots/prototype.png`; regenerate it while the prototype server is running with `npm run prototype:screenshot`.
