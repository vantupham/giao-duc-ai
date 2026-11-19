import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import type { Net } from '../neuron/nn';
import { layoutNet } from './layout';

interface Network3DProps {
  net: Net;
  activations: number[][];
}

const POS = '#2f6fdb';
const NEG = '#e07a2f';

/** Mạng nơ-ron 3D: cạnh xanh là trọng số dương, cam là âm, càng dày càng lớn; nút sáng theo mức kích hoạt. */
export default function Network3D({ net, activations }: Network3DProps) {
  const { nodes, edges, names } = layoutNet(net);
  const maxW = Math.max(0.001, ...edges.map((e) => Math.abs(e.weight)));
  return (
    <>
    <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }} dpr={[1, 2]} style={{ height: 320, borderRadius: 12, background: 'var(--surface-2)' }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      {edges.map((e, i) => {
        const t = Math.abs(e.weight) / maxW;
        return (
          <Line
            key={i}
            points={[
              [e.from.x, e.from.y, 0],
              [e.to.x, e.to.y, 0],
            ]}
            color={e.weight >= 0 ? POS : NEG}
            lineWidth={0.6 + t * 4.5}
            transparent
            opacity={0.25 + t * 0.7}
          />
        );
      })}
      {nodes.flat().map((n) => {
        const a = activations[n.layer]?.[n.index] ?? 0;
        const isOut = n.layer === nodes.length - 1;
        const level = isOut ? a : (a + 1) / 2;
        return (
          <mesh key={`${n.layer}-${n.index}`} position={[n.x, n.y, 0]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color={level >= 0.5 ? POS : NEG} emissive={level >= 0.5 ? POS : NEG} emissiveIntensity={Math.abs(level - 0.5) * 1.6} roughness={0.35} />
          </mesh>
        );
      })}
      <OrbitControls enablePan={false} minDistance={4} maxDistance={12} />
    </Canvas>
    <div className="np-names" aria-hidden="true">
      {names.map((n) => (
        <span key={n}>{n}</span>
      ))}
    </div>
    </>
  );
}
