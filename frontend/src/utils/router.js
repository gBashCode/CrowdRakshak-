/**
 * A* Pathfinding Algorithm for Crowd-Aware Routing
 * 
 * Cost = Euclidean Distance + (Crowd Density Weight)
 */

export function findOptimizedPath(start, end, zones = [], crowdData = { zones: [] }) {
  try {
    if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) return null;

    // 1. Create nodes
    const nodes = [
      { id: 'start', lat: start[0], lng: start[1] },
      { id: 'end', lat: end[0], lng: end[1] },
      ...zones.map(z => ({ id: String(z.id), lat: z.lat, lng: z.lng, radius: z.radius }))
    ];

    const endNode = nodes[1];

    // 2. Build edges
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dist = getDistance(n1, n2);
        
        let crowdWeight = 0;
        // Check if this path segment is obstructed by a high-density zone
        zones.forEach(z => {
          if (isPointNearNode(n1, n2, z)) {
            const zData = crowdData.zones.find(dz => String(dz.id) === String(z.id));
            const count = zData?.count || 0;
            // Higher penalty for crowded zones
            crowdWeight += count * 5; 
          }
        });

        const cost = dist + crowdWeight;
        edges.push({ from: n1.id, to: n2.id, cost });
        edges.push({ from: n2.id, to: n1.id, cost });
      }
    }

    // 3. A* Algorithm
    const openSet = ['start'];
    const cameFrom = {};
    const gScore = { start: 0 };
    const fScore = { start: getDistance(nodes[0], endNode) };

    let iterations = 0;
    while (openSet.length > 0 && iterations < 500) {
      iterations++;
      
      // Get node with lowest fScore
      let currentId = openSet[0];
      let minF = fScore[currentId] ?? Infinity;
      
      for (let i = 1; i < openSet.length; i++) {
        const id = openSet[i];
        const f = fScore[id] ?? Infinity;
        if (f < minF) {
          minF = f;
          currentId = id;
        }
      }

      if (currentId === 'end') {
        return reconstructPath(cameFrom, currentId, nodes);
      }

      openSet.splice(openSet.indexOf(currentId), 1);

      const neighbors = edges.filter(e => e.from === currentId);
      for (const edge of neighbors) {
        const neighborId = edge.to;
        const tentativeGScore = gScore[currentId] + edge.cost;

        if (tentativeGScore < (gScore[neighborId] ?? Infinity)) {
          cameFrom[neighborId] = currentId;
          gScore[neighborId] = tentativeGScore;
          
          const neighborNode = nodes.find(n => n.id === neighborId);
          fScore[neighborId] = gScore[neighborId] + getDistance(neighborNode, endNode);
          
          if (!openSet.includes(neighborId)) openSet.push(neighborId);
        }
      }
    }

    return null;
  } catch (err) {
    console.error("A* Routing Error:", err);
    return null;
  }
}

function getDistance(n1, n2) {
  if (!n1 || !n2) return 0;
  const R = 6371e3; 
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
  const d1 = getDistance(p1, node);
  const d2 = getDistance(p2, node);
  const dLine = getDistance(p1, p2);
  // If sum of distances to point is close to distance between endpoints, it's roughly on the line
  return (d1 + d2) < (dLine + 5); 
}

function reconstructPath(cameFrom, current, nodes) {
  const path = [];
  let curr = current;
  while (curr) {
    const node = nodes.find(n => n.id === curr);
    if (node) path.push([node.lat, node.lng]);
    curr = cameFrom[curr];
    if (path.length > 100) break; // Safety break
  }
  return path.reverse();
}
