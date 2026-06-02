// components/landing/HeroArena.tsx — react-three-fiber port of the WebGL hero.
// A tilted 30×30 grid floating in warm-white space, with the 20 agents as
// glowing personality-colored orbs drifting around it, alliance links, and
// spinning resource gems. Light, editorial, calm motion.
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PERSONALITIES, GRID_SIZE } from "@/lib/agents";

const HALF = GRID_SIZE / 2;

function GridFloor() {
  const grid = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= GRID_SIZE; i += 2) {
      pts.push(-HALF, -HALF + i, 0, HALF, -HALF + i, 0);
      pts.push(-HALF + i, -HALF, 0, -HALF + i, HALF, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const frame = useMemo(() => {
    const f = HALF + 0.4;
    const pts = [-f, -f, 0, f, -f, 0, f, f, 0, -f, f, 0];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <group>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#d8c3a5" transparent opacity={0.55} />
      </lineSegments>
      <lineLoop geometry={frame}>
        <lineBasicMaterial color="#5c4434" transparent opacity={0.4} />
      </lineLoop>
    </group>
  );
}

interface Tok {
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  pulse: number;
}

function Agents({ tokensRef }: { tokensRef: React.MutableRefObject<Tok[]> }) {
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.62, 20, 20), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(1.15, 16, 16), []);
  const meshes = useRef<THREE.Mesh[]>([]);
  const halos = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const toks: Tok[] = [];
    PERSONALITIES.forEach((_, i) => {
      const mesh = meshes.current[i];
      const halo = halos.current[i];
      if (!mesh || !halo) return;
      const x = Math.random() * GRID_SIZE - HALF;
      const y = Math.random() * GRID_SIZE - HALF;
      mesh.position.set(x, y, 0.7);
      halo.position.copy(mesh.position);
      toks.push({
        mesh,
        halo,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2,
        pulse: 0,
      });
    });
    tokensRef.current = toks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {PERSONALITIES.map((p, i) => (
        <group key={p.archetype}>
          <mesh
            geometry={sphereGeo}
            ref={(el) => {
              if (el) meshes.current[i] = el;
            }}
          >
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={0.55}
              roughness={0.35}
              metalness={0.1}
            />
          </mesh>
          <mesh
            geometry={haloGeo}
            ref={(el) => {
              if (el) halos.current[i] = el;
            }}
          >
            <meshBasicMaterial color={p.color} transparent opacity={0.16} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Gems() {
  const refs = useRef<THREE.Mesh[]>([]);
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.42), []);
  const gems = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        color: ["#E8794B", "#E8B23A", "#7FB069"][i % 3],
        x: Math.random() * GRID_SIZE - HALF,
        y: Math.random() * GRID_SIZE - HALF,
      })),
    []
  );
  useFrame((_, dt) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += dt * 0.6;
      m.rotation.x += dt * 0.7;
      m.position.z = 0.55 + Math.sin(performance.now() * 0.0016 + i) * 0.12;
    });
  });
  return (
    <>
      {gems.map((g, i) => (
        <mesh
          key={i}
          geometry={geo}
          position={[g.x, g.y, 0.5]}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <meshStandardMaterial
            color={g.color}
            emissive={g.color}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
      ))}
    </>
  );
}

const MAX_LINKS = 14;

function Scene() {
  const world = useRef<THREE.Group>(null);
  const tokensRef = useRef<Tok[]>([]);
  const links = useRef<THREE.LineSegments>(null);
  const linkPos = useMemo(() => new Float32Array(MAX_LINKS * 6), []);
  const linkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
    return g;
  }, [linkPos]);

  const { camera, pointer } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    mouse.current.x += (pointer.x * 0.5 - mouse.current.x) * 0.04;
    mouse.current.y += (pointer.y * 0.5 - mouse.current.y) * 0.04;

    const radius = 46;
    const ang = t * 0.045 + mouse.current.x * 0.5;
    camera.position.set(
      Math.sin(ang) * radius,
      30 + mouse.current.y * 6,
      Math.cos(ang) * radius
    );
    camera.lookAt(0, -2, 0);

    const toks = tokensRef.current;
    toks.forEach((tk) => {
      tk.x += tk.vx;
      tk.y += tk.vy;
      if (tk.x > HALF || tk.x < -HALF) tk.vx *= -1;
      if (tk.y > HALF || tk.y < -HALF) tk.vy *= -1;
      if (Math.random() < 0.01) {
        tk.vx += (Math.random() - 0.5) * 0.03;
        tk.vy += (Math.random() - 0.5) * 0.03;
      }
      tk.vx = Math.max(-0.07, Math.min(0.07, tk.vx));
      tk.vy = Math.max(-0.07, Math.min(0.07, tk.vy));
      const bob = Math.sin(t * 1.3 + tk.phase) * 0.18;
      tk.mesh.position.set(tk.x, tk.y, 0.8 + bob);
      tk.halo.position.copy(tk.mesh.position);

      if (tk.pulse > 0) tk.pulse -= dt * 1.2;
      const mat = tk.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        0.5 + Math.max(0, tk.pulse) * 0.9 + Math.sin(t * 2 + tk.phase) * 0.05;
      const hs = 1 + Math.max(0, tk.pulse) * 0.6;
      tk.halo.scale.setScalar(hs);
      (tk.halo.material as THREE.MeshBasicMaterial).opacity =
        0.14 + Math.max(0, tk.pulse) * 0.2;
    });

    // alliance links between nearby agents
    let li = 0;
    for (let i = 0; i < toks.length && li < MAX_LINKS; i++) {
      for (let j = i + 1; j < toks.length && li < MAX_LINKS; j++) {
        const a = toks[i],
          b = toks[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 12) {
          linkPos.set([a.x, a.y, 0.8, b.x, b.y, 0.8], li * 6);
          li++;
          if (d2 < 2.2) {
            a.pulse = 1;
            b.pulse = 1;
          }
        }
      }
    }
    for (let k = li; k < MAX_LINKS; k++) linkPos.fill(0, k * 6, k * 6 + 6);
    linkGeo.attributes.position.needsUpdate = true;
    linkGeo.setDrawRange(0, li * 2);
  });

  return (
    <>
      <ambientLight color="#fff4e8" intensity={0.85} />
      <directionalLight position={[12, 22, 10]} intensity={0.9} />
      <pointLight color="#e8542b" intensity={0.6} distance={80} position={[-14, 10, -6]} />
      <fog attach="fog" args={["#fbf9f6", 38, 90]} />
      <group ref={world} rotation={[-Math.PI / 2.55, 0, 0]}>
        <GridFloor />
        <Gems />
        <Agents tokensRef={tokensRef} />
        <lineSegments ref={links} geometry={linkGeo}>
          <lineBasicMaterial color="#e8542b" transparent opacity={0.32} />
        </lineSegments>
      </group>
    </>
  );
}

export default function HeroArena() {
  return (
    <Canvas
      className="hero-canvas"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      camera={{ fov: 40, position: [0, 30, 46], near: 0.1, far: 300 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene />
    </Canvas>
  );
}
