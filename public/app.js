const coordinates = {
  "entity:monad-143:monad-bridge": [120, 210],
  "entity:monad-143:wallet-a": [320, 310],
  "entity:monad-143:ambient-mon-usdc-pool": [540, 210],
  "entity:monad-143:yield-vault": [760, 310],
  "entity:monad-143:rewards-distributor": [540, 450],
  "asset:monad-143:mon": [825, 120],
  "asset:monad-143:usdc": [925, 220],
};

const data = await fetch('./prototype/data.json').then((response) => response.json());
document.querySelector('#snapshot').textContent = `${data.snapshotId} · generated ${data.generatedAt}`;
document.querySelector('#stats').innerHTML = [
  ['Nodes', data.viewModel.nodeCount],
  ['Flow edges', data.viewModel.edgeCount],
  ['Events', data.analytics.eventCount],
  ['Animated pipes', data.viewModel.animatedEdgeIds.length],
].map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');

const svg = document.querySelector('#map');
const nodeById = new Map(data.api.data.nodes.map((node) => [node.id, node]));
for (const edge of data.api.data.edges) {
  const [x1, y1] = coordinates[edge.fromNodeId] ?? [100, 100];
  const [x2, y2] = coordinates[edge.toNodeId] ?? [900, 420];
  const pathId = `path-${edge.id.replaceAll(':', '-')}`;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('id', pathId);
  path.setAttribute('class', 'pipe');
  path.setAttribute('d', `M ${x1} ${y1} C ${(x1+x2)/2} ${y1-120}, ${(x1+x2)/2} ${y2+120}, ${x2} ${y2}`);
  svg.append(path);
  const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  packet.setAttribute('class', 'packet');
  packet.setAttribute('r', String(Math.max(7, Math.min(18, edge.weight / 12))));
  packet.innerHTML = `<animateMotion dur="${Math.max(3, 8 - edge.weight / 30)}s" repeatCount="indefinite"><mpath href="#${pathId}" /></animateMotion>`;
  svg.append(packet);
}
for (const node of data.api.data.nodes) {
  const [x, y] = coordinates[node.id] ?? [80 + Math.random() * 800, 120 + Math.random() * 320];
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', `node ${node.kind}`);
  group.setAttribute('transform', `translate(${x} ${y})`);
  group.innerHTML = `<circle r="52"></circle><text y="-2">${node.label}</text><text class="kind" y="20">${node.kind}</text>`;
  svg.append(group);
}

document.querySelector('#events').innerHTML = data.events.map((event) => {
  const from = nodeById.get(event.fromEntityId)?.label ?? event.fromEntityId;
  const to = nodeById.get(event.toEntityId)?.label ?? event.toEntityId;
  const asset = nodeById.get(event.assetId)?.label ?? event.assetId;
  return `<div class="event-row"><span><strong>${event.amountDecimal} ${asset}</strong> flowed from ${from} to ${to}</span><code>${event.transactionHash}</code></div>`;
}).join('');
