/**
 * A* Pathfinding Algorithm for Crowd-Aware Routing
 * 
 * Cost = Euclidean Distance + (Crowd Density Weight)
 */

export function findOptimizedPath(start, end, zones, crowdData) {
  // 1. Create a simplified graph of the temple area
  // We'll use the entry points and zone centers as nodes
  const nodes = [
    { id: 'start', lat: start[0], lng: start[1] },
    { id: 'end', lat: end[0], lng: end[1] },
    ...zones.map(z => ({ id: z.id, lat: z.lat, lng: z.lng, radius: z.radius }))
  ];

  // 2. Build adjacency list (connect everything to everything for simplicity in this small scale)
  // In a real scenario, we'd only connect adjacent areas
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = getDistance(nodes[i], nodes[j]);
      
      // Calculate crowd weight for this edge
      // If the edge passes through a zone, add its crowd count to the cost
      let crowdWeight = 0;
      const zone = nodes.find(n => n.radius && isPointNearNode(nodes[i], nodes[j], n));
      if (zone) {
        const density = crowdData.zones.find(z => z.id === zone.id)?.count || 0;
        crowdWeight = density * 2; // Weight factor: 2 meters per person delay
      }

      edges.push({ from: nodes[i].id, to: nodes[j].id, cost: dist + crowdWeight });
      edges.push({ from: nodes[j].id, to: nodes[i].id, cost: dist + crowdWeight });
    }
  }

  // 3. A* Algorithm
  const openSet = ['start'];
  const cameFrom = {};
  const gScore = { start: 0 };
  const fScore = { start: getDistance(nodes[0], nodes[1]) };

  while (openSet.length > 0) {
    // Get node with lowest fScore
    let currentId = openSet.reduce((a, b) => (fScore[a] < fScore[b] ? a : b));

    if (currentId === 'end') {
      return reconstructPath(cameFrom, currentId, nodes);
    }

    openSet.splice(openSet.indexOf(currentId), 1);

    const neighbors = edges.filter(e => e.from === currentId);
    for (const edge of neighbors) {
      const neighborId = edge.to;
      const tentativeGScore = gScore[currentId] + edge.cost;

      if (tentativeGScore < (gScore[neighborId] || Infinity)) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = gScore[neighborId] + getDistance(nodes.find(n => n.id === neighborId), nodes[1]);
        if (!openSet.includes(neighborId)) openSet.push(neighborId);
      }
    }
  }

  return null; // No path found
}

function getDistance(n1, n2) {
  const R = 6371e3; // metres
  const φ1 = n1.lat * Math.PI/180;
  const φ2 = n2.lat * Math.PI/180;
  const Δφ = (n2.lat-n1.lat) * Math.PI/180;
  const Δλ = (n2.lng-n1.lng) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isPointNearNode(p1, p2, node) {
  // Simple check: is the node center between p1 and p2?
  const d1 = getDistance(p1, node);
  const d2 = getDistance(p2, node);
  const dLine = getDistance(p1, p2);
  return (d1 + d2) < (dLine + 10); // Within 10m of the direct line
}

function reconstructPath(cameFrom, current, nodes) {
  const totalPath = [nodes.find(n => n.id === current)];
  while (cameFrom[current]) {
    current = cameFrom[current];
    totalPath.push(nodes.find(n => n.id === current));
  }
  return totalPath.reverse().map(n => [n.lat, n.lng]);
}
