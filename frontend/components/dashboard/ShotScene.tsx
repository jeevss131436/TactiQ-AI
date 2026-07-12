"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { QuadraticBezierCurve3, Vector3, DoubleSide } from "three";
import type { RealShot } from "@/lib/api";

// StatsBomb pitch is 120 (length, x) x 80 (width, y); the ball's end height
// arrives as a third coordinate (z, crossbar ~= 2.67). We center the pitch on
// the origin and map into three.js space where Y is up:
//   sceneX = sbX - 60   (length, left goal at -60, right goal at +60)
//   sceneY = sbHeight    (up)
//   sceneZ = sbY - 40    (width)
const PITCH_LENGTH = 120;
const PITCH_WIDTH = 80;
const HALF_L = PITCH_LENGTH / 2;
const HALF_W = PITCH_WIDTH / 2;
const GOAL_HEIGHT = 2.67;
const GOAL_HALF_WIDTH = 4; // goal spans sbY 36..44

// Team colors — two categorical hues that read against the navy scene:
// cyan for the home side (the site accent), amber for the away side. Goals
// render brighter with a ball marker; other shots stay dimmer + translucent.
const HOME_COLOR = "#38bdf8";
const AWAY_COLOR = "#fbbf24";
const LINE_COLOR = "#3b5a78";

function toScene(x: number, y: number, z = 0): [number, number, number] {
  return [x - HALF_L, z, y - HALF_W];
}

// StatsBomb normalizes every team to attack toward x=120, so left untouched
// both teams would shoot at the same goal. Mirror the away side onto the
// opposite half so the scene reads like a real match (each team attacking its
// own goal).
function orient(shot: RealShot) {
  if (shot.homeOrAway === "home") {
    return { start: shot.start, end: shot.end };
  }
  return {
    start: { x: PITCH_LENGTH - shot.start.x, y: PITCH_WIDTH - shot.start.y },
    end: { x: PITCH_LENGTH - shot.end.x, y: PITCH_WIDTH - shot.end.y, z: shot.end.z },
  };
}

function PitchLine({ points, color = LINE_COLOR, opacity = 0.7, width = 1 }: {
  points: [number, number, number][];
  color?: string;
  opacity?: number;
  width?: number;
}) {
  return <Line points={points} color={color} lineWidth={width} transparent opacity={opacity} />;
}

function Pitch() {
  // Rectangle helpers in StatsBomb coords, mapped to the ground plane.
  const rect = (x0: number, y0: number, x1: number, y1: number): [number, number, number][] => [
    toScene(x0, y0),
    toScene(x1, y0),
    toScene(x1, y1),
    toScene(x0, y1),
    toScene(x0, y0),
  ];

  const centerCircle = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push(toScene(60 + Math.cos(a) * 10, 40 + Math.sin(a) * 10));
    }
    return pts;
  }, []);

  // A goal frame drawn as posts + crossbar at the given end (x = 0 or 120).
  const goalFrame = (goalX: number, color: string): [number, number, number][] => [
    toScene(goalX, 40 - GOAL_HALF_WIDTH, 0),
    toScene(goalX, 40 - GOAL_HALF_WIDTH, GOAL_HEIGHT),
    toScene(goalX, 40 + GOAL_HALF_WIDTH, GOAL_HEIGHT),
    toScene(goalX, 40 + GOAL_HALF_WIDTH, 0),
  ];

  return (
    <group>
      {/* Grass plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[PITCH_LENGTH, PITCH_WIDTH]} />
        <meshStandardMaterial color="#0a1a2f" side={DoubleSide} />
      </mesh>

      <PitchLine points={rect(0, 0, 120, 80)} />
      <PitchLine points={[toScene(60, 0), toScene(60, 80)]} />
      <PitchLine points={centerCircle} />
      {/* Penalty + 6-yard boxes, both ends */}
      <PitchLine points={rect(0, 18, 18, 62)} />
      <PitchLine points={rect(0, 30, 6, 50)} />
      <PitchLine points={rect(102, 18, 120, 62)} />
      <PitchLine points={rect(114, 30, 120, 50)} />
      {/* Goal frames — right goal is home's target (cyan), left is away's (amber) */}
      <PitchLine points={goalFrame(120, HOME_COLOR)} color={HOME_COLOR} opacity={0.85} width={2} />
      <PitchLine points={goalFrame(0, AWAY_COLOR)} color={AWAY_COLOR} opacity={0.85} width={2} />
    </group>
  );
}

function ShotArc({ shot }: { shot: RealShot }) {
  const color = shot.homeOrAway === "home" ? HOME_COLOR : AWAY_COLOR;
  const { points, endVec } = useMemo(() => {
    const o = orient(shot);
    const start = new Vector3(...toScene(o.start.x, o.start.y, 0));
    const end = new Vector3(...toScene(o.end.x, o.end.y, o.end.z));
    const mid = start.clone().lerp(end, 0.5);
    const dist = start.distanceTo(end);
    // Lift the control point so even flat (z=0) shots draw a visible arc, with
    // taller shots peaking higher.
    mid.y += Math.max(o.end.z, 0) + dist * 0.12 + 1.5;
    const curve = new QuadraticBezierCurve3(start, mid, end);
    return { points: curve.getPoints(40) as Vector3[], endVec: end };
  }, [shot]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={shot.isGoal ? 3 : 1.5}
        transparent
        opacity={shot.isGoal ? 0.95 : 0.35}
      />
      {/* End marker — a bright emissive ball for goals, a small dim dot otherwise */}
      <mesh position={endVec}>
        <sphereGeometry args={[shot.isGoal ? 1.1 : 0.6, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={shot.isGoal ? 1.4 : 0.3}
          transparent
          opacity={shot.isGoal ? 1 : 0.5}
        />
      </mesh>
    </group>
  );
}

export default function ShotScene({ shots }: { shots: RealShot[] }) {
  return (
    <Canvas camera={{ position: [0, 55, 78], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#0a121f"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[40, 60, 20]} intensity={0.8} />
      <Pitch />
      {shots.map((shot, i) => (
        <ShotArc key={shot.id ?? i} shot={shot} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={40}
        maxDistance={160}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 2, 0]}
      />
    </Canvas>
  );
}
