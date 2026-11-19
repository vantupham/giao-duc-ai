import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PARTS, BIN_LABEL, type PartKey, type Bin } from './stationData';

interface StationSceneProps {
  selected: PartKey | null;
  goalChanged: boolean;
  screenText: string;
  activeBin: Bin | null;
  onSelect: (k: PartKey) => void;
}

const color = (k: PartKey) => PARTS.find((p) => p.key === k)!.color;

/** Vị trí của 5 thành phần trong cảnh; dòng dữ liệu chạy qua chúng theo vòng khép kín. */
const ANCHOR: Record<PartKey, [number, number, number]> = {
  data: [-3.2, 0.9, -1.2],
  algorithm: [-1.4, 0.9, -2.2],
  model: [0.4, 1.3, 0.2],
  output: [0.4, 2.35, 0.62],
  feedback: [1.35, 1.25, 0.62],
};

function Pulse({ k, selected, goalChanged, children }: { k: PartKey; selected: PartKey | null; goalChanged: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const part = PARTS.find((p) => p.key === k)!;
  useFrame(({ clock }) => {
    if (!group.current) return;
    const on = selected === k || (goalChanged && part.change.must);
    const s = on ? 1 + Math.sin(clock.elapsedTime * 4) * 0.04 : 1;
    group.current.scale.setScalar(s);
  });
  return <group ref={group}>{children}</group>;
}

/** Độ lệch nhãn so với bộ phận, tránh các nhãn chồng lên nhau. */
const LABEL_OFFSET: Record<PartKey, [number, number, number]> = {
  data: [-0.2, 0.55, 0],
  algorithm: [-0.3, 1.25, 0],
  model: [-0.9, -0.55, 0.6],
  output: [0, 0.75, 0],
  feedback: [0.9, 1.05, 0],
};

function Label({ k, selected, goalChanged, onSelect }: { k: PartKey; selected: PartKey | null; goalChanged: boolean; onSelect: (k: PartKey) => void }) {
  const part = PARTS.find((p) => p.key === k)!;
  const [x, y, z] = ANCHOR[k];
  const [dx, dy, dz] = LABEL_OFFSET[k];
  const tag = goalChanged ? (part.change.must ? ' ✗ đổi' : ' ✓ giữ') : '';
  return (
    <Html position={[x + dx, y + dy, z + dz]} center zIndexRange={[10, 0]}>
      <button
        type="button"
        onClick={() => onSelect(k)}
        className={`st-tag ${selected === k ? 'is-on' : ''} ${goalChanged ? (part.change.must ? 'is-must' : 'is-keep') : ''}`}
        style={{ ['--c' as string]: part.color }}
      >
        {part.name}
        {tag}
      </button>
    </Html>
  );
}

function FlowParticles() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [ANCHOR.data, ANCHOR.algorithm, ANCHOR.model, ANCHOR.output, ANCHOR.feedback, [0, 0.4, 2], [-2.6, 0.5, 0.8]].map((p) => new THREE.Vector3(...p)),
        true,
      ),
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const COUNT = 18;
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = (clock.elapsedTime * 0.06 + i / COUNT) % 1;
      m.position.copy(curve.getPointAt(t));
    });
  });
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <mesh key={i} ref={(m) => (refs.current[i] = m)}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
      ))}
    </>
  );
}

function Gears() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (a.current) a.current.rotation.z += dt * 0.9;
    if (b.current) b.current.rotation.z -= dt * 1.3;
  });
  const c = color('algorithm');
  return (
    <group position={ANCHOR.algorithm}>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.5, 32]} />
        <meshStandardMaterial color="#d9d4ea" />
      </mesh>
      <mesh ref={a} position={[-0.2, 0.15, 0]}>
        <torusGeometry args={[0.33, 0.1, 8, 10]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh ref={b} position={[0.33, 0.45, 0]}>
        <torusGeometry args={[0.22, 0.08, 8, 8]} />
        <meshStandardMaterial color={c} />
      </mesh>
    </group>
  );
}

const BIN_COLORS: Record<Bin, string> = { 'tai-che': '#2e8b57', 'huu-co': '#8d6e3f', 'con-lai': '#6b7280', 'nguy-hai': '#c0392b' };

function Bins({ goalChanged, activeBin }: { goalChanged: boolean; activeBin: Bin | null }) {
  const bins: Bin[] = goalChanged ? ['tai-che', 'huu-co', 'con-lai', 'nguy-hai'] : ['tai-che', 'huu-co', 'con-lai'];
  return (
    <group position={[2.9, 0, 0.6]}>
      {bins.map((b, i) => (
        <group key={b} position={[(i - (bins.length - 1) / 2) * 0.85, 0.5, 0]}>
          <RoundedBox args={[0.7, 1, 0.7]} radius={0.06}>
            <meshStandardMaterial color={BIN_COLORS[b]} emissive={BIN_COLORS[b]} emissiveIntensity={activeBin === b ? 0.8 : 0} />
          </RoundedBox>
          <Html position={[0, 0.75, 0]} center>
            <span className="st-bin">{BIN_LABEL[b]}</span>
          </Html>
        </group>
      ))}
    </group>
  );
}

export default function StationScene({ selected, goalChanged, screenText, activeBin, onSelect }: StationSceneProps) {
  return (
    <Canvas camera={{ position: [1.5, 3.2, 7.2], fov: 45 }} dpr={[1, 2]} style={{ height: 420, borderRadius: 14, background: 'linear-gradient(#dfeef3, #f6f3ea)' }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial color="#e9e4d8" />
      </mesh>

      {/* Dữ liệu: chồng ảnh đã gán nhãn */}
      <Pulse k="data" selected={selected} goalChanged={goalChanged}>
        <group position={ANCHOR.data} onClick={(e) => (e.stopPropagation(), onSelect('data'))}>
          {Array.from({ length: goalChanged ? 9 : 7 }, (_, i) => (
            <mesh key={i} position={[((i * 37) % 5) * 0.04 - 0.08, -0.6 + i * 0.09, ((i * 53) % 7) * 0.03]} rotation={[0, (i % 3) * 0.2 - 0.2, 0]}>
              <boxGeometry args={[1.1, 0.06, 0.8]} />
              <meshStandardMaterial color={i >= 7 ? '#c0392b' : i % 2 ? '#bcd3f5' : color('data')} />
            </mesh>
          ))}
        </group>
      </Pulse>

      {/* Thuật toán: bánh răng của "phòng học" */}
      <Pulse k="algorithm" selected={selected} goalChanged={goalChanged}>
        <group onClick={(e) => (e.stopPropagation(), onSelect('algorithm'))}>
          <Gears />
        </group>
      </Pulse>

      {/* Thân trạm, mô hình (chip phát sáng), màn hình đầu ra, nút phản hồi */}
      <group position={[0.4, 0, 0]}>
        <RoundedBox args={[1.6, 2.9, 1.1]} radius={0.12} position={[0, 1.45, 0]}>
          <meshStandardMaterial color="#f4f6f8" transparent opacity={0.55} />
        </RoundedBox>
        <mesh position={[0, 2.95, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      <Pulse k="model" selected={selected} goalChanged={goalChanged}>
        <mesh position={ANCHOR.model} onClick={(e) => (e.stopPropagation(), onSelect('model'))}>
          <boxGeometry args={[0.7, 0.18, 0.7]} />
          <meshStandardMaterial color={color('model')} emissive={color('model')} emissiveIntensity={0.7} />
        </mesh>
      </Pulse>
      <Pulse k="output" selected={selected} goalChanged={goalChanged}>
        <group position={ANCHOR.output} onClick={(e) => (e.stopPropagation(), onSelect('output'))}>
          <mesh>
            <boxGeometry args={[1.25, 0.62, 0.05]} />
            <meshStandardMaterial color="#10202a" />
          </mesh>
          <Html transform position={[0, 0, 0.04]} distanceFactor={2.4} occlude={false}>
            <div className="st-screen">{screenText}</div>
          </Html>
        </group>
      </Pulse>
      <Pulse k="feedback" selected={selected} goalChanged={goalChanged}>
        <mesh position={ANCHOR.feedback} rotation={[Math.PI / 2, 0, 0]} onClick={(e) => (e.stopPropagation(), onSelect('feedback'))}>
          <cylinderGeometry args={[0.16, 0.16, 0.12, 24]} />
          <meshStandardMaterial color={color('feedback')} emissive={color('feedback')} emissiveIntensity={0.4} />
        </mesh>
      </Pulse>

      <Bins goalChanged={goalChanged} activeBin={activeBin} />
      <FlowParticles />
      {PARTS.map((p) => (
        <Label key={p.key} k={p.key} selected={selected} goalChanged={goalChanged} onSelect={onSelect} />
      ))}
      <OrbitControls enablePan={false} minDistance={5} maxDistance={12} maxPolarAngle={Math.PI / 2.1} target={[0, 1, 0]} />
    </Canvas>
  );
}
