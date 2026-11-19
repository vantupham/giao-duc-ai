import type { Net } from '../neuron/nn';

export interface NodePos {
  layer: number;
  index: number;
  x: number;
  y: number;
}

export interface EdgeInfo {
  from: NodePos;
  to: NodePos;
  weight: number;
}

const LAYER_NAMES = (n: number) => Array.from({ length: n }, (_, i) => (i === 0 ? 'Lớp vào' : i === n - 1 ? 'Lớp ra' : `Lớp ẩn ${i}`));

/** Toạ độ nút và cạnh của mạng, dùng chung cho hình 3D và hình 2D dự phòng. */
export function layoutNet(net: Net, width = 6, height = 4): { nodes: NodePos[][]; edges: EdgeInfo[]; names: string[] } {
  const L = net.sizes.length;
  const nodes = net.sizes.map((n, l) =>
    Array.from({ length: n }, (_, i) => ({
      layer: l,
      index: i,
      x: L === 1 ? 0 : (l / (L - 1) - 0.5) * width,
      y: n === 1 ? 0 : (0.5 - i / (n - 1)) * Math.min(height, n * 0.75),
    })),
  );
  const edges: EdgeInfo[] = [];
  net.weights.forEach((W, l) => W.forEach((row, j) => row.forEach((w, k) => edges.push({ from: nodes[l][k], to: nodes[l + 1][j], weight: w }))));
  return { nodes, edges, names: LAYER_NAMES(L) };
}
