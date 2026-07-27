const data = await fetch('./prototype/data.json').then((response) => response.json());

const nodes = data.api.data.nodes;
const edges = data.api.data.edges;
const events = data.events;
const attributions = data.attributions;
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const state = { selectedId: nodes[0]?.id ?? '', kind: 'all', minWeight: 0, flowOnly: false };

const $ = (selector) => document.querySelector(selector);
const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const shortId = (value) => value.length > 22 ? `${value.slice(0, 14)}…${value.slice(-6)}` : value;
const getNode = (id) => nodeById.get(id) ?? { id, kind: 'entity', label: id };
const visualKind = (node) => {
  const signature = `${node.id} ${node.label}`.toLowerCase();
  if (node.kind === 'asset') return 'asset';
  if (signature.includes('bridge')) return 'bridge';
  if (signature.includes('pool')) return 'pool';
  if (signature.includes('vault')) return 'vault';
  if (signature.includes('reward') || signature.includes('distributor') || signature.includes('protocol') || signature.includes('exchange') || signature.includes('kuru') || signature.includes('ambient')) return 'protocol';
  if (signature.includes('lending') || signature.includes('market')) return 'market';
  if (signature.includes('validator')) return 'validator';
  return node.kind;
};
const edgeLabel = (edge) => `${getNode(edge.fromNodeId).label} → ${getNode(edge.toNodeId).label}`;

const kindColors = {
  asset: '#55f0a3',
  bridge: '#25c7ff',
  entity: '#a78bfa',
  pool: '#ffb86b',
  vault: '#ff5c9a',
  protocol: '#73fbd3',
  market: '#ffe66d',
  validator: '#8be9fd',
};

function layoutGraph(graphNodes) {
  const lanes = {
    bridge: { x: 100, y: 160 },
    entity: { x: 300, y: 320 },
    pool: { x: 520, y: 180 },
    vault: { x: 760, y: 340 },
    protocol: { x: 520, y: 480 },
    market: { x: 760, y: 160 },
    validator: { x: 980, y: 420 },
    asset: { x: 980, y: 140 },
  };
  const spreads = {
    bridge: 90,
    entity: 95,
    pool: 100,
    vault: 95,
    protocol: 90,
    market: 90,
    validator: 80,
    asset: 110,
  };
  const counts = new Map();
  return new Map(graphNodes.map((node) => {
    const kind = visualKind(node);
    const lane = lanes[kind] ?? lanes.entity;
    const index = counts.get(kind) ?? 0;
    counts.set(kind, index + 1);
    const spread = spreads[kind] ?? 90;
    const x = lane.x + Math.sin(index * 1.9) * 28;
    const y = lane.y + index * spread - (spread * 0.4);
    return [node.id, [Math.max(70, Math.min(1090, x)), Math.max(70, Math.min(610, y))]];
  }));
}

const positions = layoutGraph(nodes);

function renderStats() {
  const totalWeight = edges.reduce((sum, edge) => sum + edge.weight, 0);
  const uniqueAssets = events.reduce((set, event) => set.add(event.assetId), new Set()).size;
  $('#snapshot').textContent = `${data.snapshotId} · generated ${new Date(data.generatedAt).toUTCString()}`;
  $('#stats').innerHTML = [
    ['Graph nodes', data.viewModel.nodeCount, '+ deterministic'],
    ['Flow edges', data.viewModel.edgeCount, `${formatNumber.format(totalWeight)} weighted`],
    ['Canonical events', data.analytics.eventCount, `${uniqueAssets} assets observed`],
    ['Animated pipes', data.viewModel.animatedEdgeIds.length, 'live motion layer'],
  ].map(([label, value, note]) => `<article class="stat glass-card"><strong>${value}</strong><span>${label}</span><small>${note}</small></article>`).join('');
}

function populateControls() {
  const kinds = [...new Set(nodes.map(visualKind))].sort();
  $('#kind-filter').insertAdjacentHTML('beforeend', kinds.map((kind) => `<option value="${kind}">${kind}</option>`).join(''));
  $('#kind-filter').addEventListener('input', (event) => { state.kind = event.target.value; renderGraph(); });
  $('#weight-filter').addEventListener('input', (event) => { state.minWeight = Number(event.target.value); $('#weight-value').textContent = state.minWeight; renderGraph(); });
  $('#flow-filter').addEventListener('input', (event) => { state.flowOnly = event.target.checked; renderGraph(); });
}

function shouldShowEdge(edge) {
  const kindMatch = state.kind === 'all' || visualKind(getNode(edge.fromNodeId)) === state.kind || visualKind(getNode(edge.toNodeId)) === state.kind;
  return kindMatch && edge.weight >= state.minWeight && (!state.flowOnly || edge.kind === 'flow');
}

function curvePath(from, to, lift = 0) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mid = (x1 + x2) / 2;
  const tension = Math.max(90, Math.abs(x2 - x1) * 0.28);
  return `M ${x1} ${y1} C ${mid - tension} ${y1 - 110 + lift}, ${mid + tension} ${y2 + 110 - lift}, ${x2} ${y2}`;
}

function renderGraph() {
  const svg = $('#map');
  svg.innerHTML = `
    <defs>
      <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="pipe-gradient" x1="0" x2="1"><stop offset="0%" stop-color="#25c7ff"/><stop offset="48%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#55f0a3"/></linearGradient>
      <radialGradient id="node-fill"><stop offset="0%" stop-color="#213d75"/><stop offset="100%" stop-color="#07111f"/></radialGradient>
      <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(143,183,204,.08)" stroke-width="1"/></pattern>
    </defs>
    <rect width="1160" height="680" rx="28" fill="url(#grid)"></rect>
  `;

  const visibleEdges = edges.filter(shouldShowEdge);
  const connected = new Set(visibleEdges.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]));
  const visibleNodes = nodes.filter((node) => state.kind === 'all' ? connected.has(node.id) || visibleEdges.length === 0 : visualKind(node) === state.kind || connected.has(node.id));

  visibleEdges.forEach((edge, index) => {
    const from = positions.get(edge.fromNodeId) ?? [120, 120];
    const to = positions.get(edge.toNodeId) ?? [1020, 520];
    const id = `path-${edge.id.replaceAll(':', '-')}`;
    const width = Math.max(5, Math.min(18, edge.weight / 13));
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', id);
    path.setAttribute('class', `pipe ${state.selectedId === edge.id ? 'selected' : ''}`);
    path.setAttribute('d', curvePath(from, to, index % 2 ? 18 : -18));
    path.setAttribute('stroke-width', width);
    path.dataset.id = edge.id;
    path.addEventListener('click', () => selectEdge(edge));
    svg.append(path);

    const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    packet.setAttribute('class', 'packet');
    packet.setAttribute('r', String(Math.max(5, Math.min(15, edge.weight / 16))));
    packet.innerHTML = `<animateMotion dur="${Math.max(2.6, 8 - edge.weight / 34)}s" begin="${index * 0.23}s" repeatCount="indefinite"><mpath href="#${id}" /></animateMotion>`;
    svg.append(packet);
  });

  visibleNodes.forEach((node) => {
    const [x, y] = positions.get(node.id) ?? [140, 140];
    const degree = edges.filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id).length;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const kind = visualKind(node);
    group.setAttribute('class', `node ${kind} ${state.selectedId === node.id ? 'selected' : ''}`);
    group.setAttribute('transform', `translate(${x} ${y})`);
    group.dataset.id = node.id;
    group.innerHTML = `<circle class="halo" r="62"></circle><circle r="48" style="stroke:${kindColors[kind] ?? kindColors.entity}"></circle><text y="-4">${node.label}</text><text class="kind" y="19">${kind} · ${degree} links</text>`;
    group.addEventListener('click', () => selectNode(node));
    group.addEventListener('mouseenter', () => showNode(node));
    svg.append(group);
  });

  if (!visibleNodes.length) {
    svg.insertAdjacentHTML('beforeend', '<text x="580" y="350" class="empty-map">No graph elements match the current filters</text>');
  }
}

function selectNode(node) {
  state.selectedId = node.id;
  showNode(node);
  renderGraph();
}

function selectEdge(edge) {
  state.selectedId = edge.id;
  showEdge(edge);
  renderGraph();
}

function showNode(node) {
  const inbound = edges.filter((edge) => edge.toNodeId === node.id);
  const outbound = edges.filter((edge) => edge.fromNodeId === node.id);
  $('#detail-title').textContent = node.label;
  $('#details').innerHTML = `
    <div class="detail-chip" style="--chip:${kindColors[visualKind(node)] ?? kindColors.entity}">${visualKind(node)}</div>
    <dl>
      <dt>Canonical ID</dt><dd><code>${shortId(node.id)}</code></dd>
      <dt>Inbound flow</dt><dd>${formatNumber.format(inbound.reduce((sum, edge) => sum + edge.weight, 0))}</dd>
      <dt>Outbound flow</dt><dd>${formatNumber.format(outbound.reduce((sum, edge) => sum + edge.weight, 0))}</dd>
      <dt>Connections</dt><dd>${inbound.length + outbound.length}</dd>
    </dl>
    <div class="mini-list">${[...inbound, ...outbound].map((edge) => `<button data-edge="${edge.id}">${edgeLabel(edge)}<span>${edge.weight}</span></button>`).join('') || '<p>No connected edges.</p>'}</div>
  `;
  document.querySelectorAll('[data-edge]').forEach((button) => button.addEventListener('click', () => selectEdge(edges.find((edge) => edge.id === button.dataset.edge))));
}

function showEdge(edge) {
  $('#detail-title').textContent = 'Flow pathway';
  $('#details').innerHTML = `
    <div class="detail-chip" style="--chip:#25c7ff">${edge.kind}</div>
    <dl>
      <dt>Route</dt><dd>${edgeLabel(edge)}</dd>
      <dt>Weight</dt><dd>${formatNumber.format(edge.weight)}</dd>
      <dt>Event ID</dt><dd><code>${edge.eventId ?? 'derived'}</code></dd>
      <dt>Edge ID</dt><dd><code>${shortId(edge.id)}</code></dd>
    </dl>
  `;
}

function renderAttributions() {
  const rows = attributions.map((row) => ({ ...row, net: Number(row.netRaw), label: getNode(row.entityId).label }));
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.net)));
  $('#attributions').innerHTML = rows.map((row) => {
    const width = Math.max(4, Math.abs(row.net) / max * 100);
    const positive = row.net >= 0;
    return `<div class="bar-row"><span>${row.label}</span><div class="bar-track"><i class="${positive ? 'positive' : 'negative'}" style="width:${width}%"></i></div><strong>${positive ? '+' : ''}${formatNumber.format(row.net)}</strong></div>`;
  }).join('');
}

function renderEvents() {
  $('#events').innerHTML = events.map((event) => {
    const from = getNode(event.fromEntityId).label;
    const to = getNode(event.toEntityId).label;
    const asset = getNode(event.assetId).label;
    return `<button class="event-row"><span><strong>${event.amountDecimal} ${asset}</strong><em>${from} → ${to}</em></span><code>${event.transactionHash}</code></button>`;
  }).join('');
}

renderStats();
populateControls();
renderGraph();
renderAttributions();
renderEvents();
showNode(nodes[0]);

// About / Architecture modal
const aboutModal = document.getElementById('about-modal');
const aboutBtn = document.getElementById('about-btn');
if (aboutBtn && aboutModal) {
  aboutBtn.addEventListener('click', () => {
    aboutModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  aboutModal.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => {
      aboutModal.hidden = true;
      document.body.style.overflow = '';
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutModal.hidden) {
      aboutModal.hidden = true;
      document.body.style.overflow = '';
    }
  });
}
