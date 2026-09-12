import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Band } from '../../hooks/useSectionBands';
import { NAV_SECTIONS, type DrawerFile } from '../../data/portfolioData';

/* ============================================================================
 * THE CABINET
 *
 * An archive cabinet standing in its own column down the right edge, with one
 * drawer per section — add or remove a section and the cabinet re-divides to
 * match; nothing here is sized for a particular number of drawers.
 * The drawer for whichever section is in focus slides open; the previous one
 * closes behind it. Each drawer holds a set of files, and clicking them jumps to
 * that section.
 *
 * The files are a shortcut, never the only route — every section is reachable
 * from the header nav, which is where keyboard and screen-reader users go. The
 * canvas is aria-hidden for exactly that reason.
 *
 * No React state is touched per frame. Section positions arrive pre-measured in
 * a ref and every animated value is written straight onto three.js objects.
 * ========================================================================== */

export type SceneTheme = 'dark' | 'light';

/** What the pointer is currently over inside the cabinet. */
type Hover =
  | { kind: 'file'; drawer: number; file: number }
  | { kind: 'face'; drawer: number }
  | null;

export interface DrawerDef {
  id: string;
  index: string;
  label: string;
  /** One folder per real item in the section — each its own click target. */
  files: DrawerFile[];
}

/**
 * Dark archive vault: anodised metal, one warm raking key, interiors that read
 * as genuine voids so content emerges out of darkness.
 *
 * Metalness is theme-dependent, not just colour. At high metalness a surface
 * shows almost none of its base colour and almost all of the environment, so a
 * "dark" metal still blows out to white on a light page.
 */
const MATERIALS: Record<
  SceneTheme,
  {
    body: string;
    face: string;
    pull: string;
    folder: string;
    metalness: number;
    roughness: number;
    env: number;
    ambient: number;
    key: number;
  }
> = {
  dark: {
    body: '#3d434d',
    face: '#4a515c',
    pull: '#aeb5c0',
    folder: '#c8b184',
    metalness: 0.72,
    roughness: 0.38,
    env: 0.4,
    ambient: 0.18,
    key: 3.4,
  },
  light: {
    body: '#4c535e',
    face: '#59616d',
    pull: '#8d95a1',
    folder: '#b39a6b',
    metalness: 0.34,
    roughness: 0.46,
    env: 0.3,
    ambient: 0.5,
    key: 2.4,
  },
};

/* Cabinet proportions, in world units. */
const W = 2.25;
const H = 5.25;
const D = 2.2;
const SHELL = 0.07;
/* One drawer per nav section. NAV_SECTIONS is the single source of truth for
 * how many there are: App builds the `drawers` prop from the same list, so the
 * geometry and the content can never disagree about the count.
 *
 * The cabinet body stays the same size at any count — drawers divide it rather
 * than extending it — which is what keeps the camera framing below valid. */
const DRAWER_COUNT = NAV_SECTIONS.length;
const GAP = 0.045;
const DRAWER_H = (H - SHELL * 2 - GAP * (DRAWER_COUNT + 1)) / DRAWER_COUNT;
const DRAWER_W = W - SHELL * 2 - 0.06;
const DRAWER_D = D - 0.16;
const OPEN_DISTANCE = 1.55;

/* Files */
const FILE_W = DRAWER_W - 0.18;
/**
 * Folders must fit entirely inside the drawer envelope, tabs included.
 *
 * An earlier value let the tab stand 0.13 above the drawer top — three times the
 * inter-drawer gap — so the top drawer's tabs pierced the cabinet lid and every
 * other drawer's tabs sat inside the floor of the one above. The headroom below
 * is what keeps the tallest part (tab centre + half its height + its 0.045
 * offset) under DRAWER_H / 2.
 *
 * Visibility does not depend on folders out-topping the drawer face: the camera
 * looks down at ~24°, which clears the face and sees the whole stack.
 */
const FILE_TOP_HEADROOM = 0.2;
const FILE_H = DRAWER_H - FILE_TOP_HEADROOM;
const FILE_GAP = 0.3;
const FILE_Z_CENTER = 0.12;

/**
 * The stamped label plate on a drawer front.
 *
 * It sits in the band between the drawer floor and the bottom of the pull. The
 * pull is a fixed size at any drawer height, so that band shrinks as drawers
 * get shorter — at six drawers a fixed 0.29-tall plate runs into the pull. The
 * plate is therefore fitted to the band and capped at its original size, which
 * leaves the five-drawer cabinet pixel-identical and keeps the plate clear of
 * the pull at higher counts.
 */
const PULL_BOTTOM = -0.08;
const PLATE_FLOOR_GAP = 0.085;
const PLATE_PULL_GAP = 0.02;
const PLATE_ASPECT = 1.15 / 0.29;
const PLATE_H = Math.min(
  0.29,
  DRAWER_H / 2 + PULL_BOTTOM - PLATE_FLOOR_GAP - PLATE_PULL_GAP
);
const PLATE_W = PLATE_H * PLATE_ASPECT;
const PLATE_Y = -DRAWER_H / 2 + PLATE_H / 2 + PLATE_FLOOR_GAP;

if (import.meta.env.DEV) {
  // The two ways this geometry fails silently when the section count changes:
  // a plate that has run into the pull, and a folder tab that has pierced the
  // drawer above. Both are visible only if you happen to look at that drawer.
  const plateTop = PLATE_Y + PLATE_H / 2;
  const tabTop = FILE_H / 2 + 0.045 + 0.05;
  console.assert(
    PLATE_H > 0.08 && plateTop <= PULL_BOTTOM,
    `Cabinet: ${DRAWER_COUNT} drawers leave no room for the label plate ` +
      `(height ${PLATE_H.toFixed(3)}, top ${plateTop.toFixed(3)} vs pull ${PULL_BOTTOM}).`
  );
  console.assert(
    tabTop < DRAWER_H / 2,
    `Cabinet: folder tabs (top ${tabTop.toFixed(3)}) pierce the drawer above ` +
      `(half-height ${(DRAWER_H / 2).toFixed(3)}) at ${DRAWER_COUNT} drawers.`
  );
}

/** Local Y of drawer `i` inside the cabinet group. */
const drawerY = (i: number) =>
  H / 2 - SHELL - GAP - DRAWER_H / 2 - i * (DRAWER_H + GAP);

/** Where the open drawer should sit in the frame: just below the look-at point,
 *  so the camera is angled down into it. */
const FOCUS_Y = -0.35;

/**
 * How much of the way the cabinet cranes toward the open drawer.
 *
 * At 1.0 the open drawer sits exactly at FOCUS_Y — but the cabinet then travels
 * 3.85 units, and with the bottom drawer open the top drawer's front reaches
 * NDC y 1.48: off screen, and so unclickable. You could no longer navigate back
 * to the first drawer from the last section.
 *
 * 0.3 is the largest value where every drawer front stays on screen at every
 * scroll position, across canvas aspect ratios from 0.45 to 0.75 — and the
 * camera still clears each open drawer's face to show the folders inside.
 * Measured, not guessed; re-measure both properties if you change it.
 */
const TRACK_FACTOR = 0.3;

/** Sized and placed so the cabinet sits hard against the right of its column
 *  without any drawer front clipping the frame. */
const CABINET_SCALE = 0.83;
const CABINET_X = 0.75;

/* -------------------------------------------------------------------------- */
/* Label decals                                                                */
/* -------------------------------------------------------------------------- */

/** Stamped label plate for a drawer face: number and section name in mono. */
function createLabelTexture(index: string, label: string): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(8,10,14,0.82)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

  ctx.fillStyle = '#e9a23b';
  ctx.font = '700 42px ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(index, 26, h / 2);

  ctx.fillStyle = '#e6e9ee';
  ctx.font = '600 34px ui-monospace, monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText(label.toUpperCase(), 96, h / 2);

  return finish(canvas);
}

/** Typed tab, so every folder says where it goes. */
function createTabTexture(label: string): THREE.CanvasTexture {
  const w = 320;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f1e6d0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2218';
  ctx.font = '700 28px ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText(label.toUpperCase(), w / 2, h / 2 + 1);

  return finish(canvas);
}

function finish(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* -------------------------------------------------------------------------- */
/* Lighting                                                                    */
/* -------------------------------------------------------------------------- */

/** Aims the camera down into the open drawer. R3F points the default camera
 *  along -Z, so the tilt has to be set explicitly. */
const CameraRig: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, FOCUS_Y - 0.55, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
};

const Environment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);

    // oxlint-disable-next-line react/immutability
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    invalidate();

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity, invalidate]);

  return null;
};

/** Dust drifting through the key light. Cheap, and it sells the vault. */
const Dust: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    // Seeded rather than Math.random: pure, and the scatter is identical on
    // every load instead of reshuffling each time the page is opened.
    let seed = 0x2f6e2b1;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    const count = 120;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 6;
      arr[i * 3 + 1] = (rand() - 0.5) * 8;
      arr[i * 3 + 2] = (rand() - 0.5) * 5 + 1;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (reduceMotion || !ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.25;
  });

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#e9c88b"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

/* -------------------------------------------------------------------------- */
/* Files                                                                       */
/* -------------------------------------------------------------------------- */

interface FilesProps {
  files: DrawerFile[];
  folderColor: string;
  /** Index of the hovered folder in this drawer, or null. */
  hoveredFile: number | null;
  reduceMotion: boolean;
  onOver: (fileIndex: number) => (e: ThreeEvent<PointerEvent>) => void;
  onOut: (fileIndex: number) => () => void;
  onClick: (fileIndex: number) => (e: ThreeEvent<MouseEvent>) => void;
}

/**
 * The folders standing in a drawer — one per item in that section, each its own
 * click target with its own printed tab.
 *
 * Tabs are staggered across the drawer width so no two overlap and every label
 * stays readable; the stagger is derived from the index rather than random, so
 * the stack renders identically every load.
 */
const Files: React.FC<FilesProps> = ({
  files,
  folderColor,
  hoveredFile,
  reduceMotion,
  onOver,
  onOut,
  onClick,
}) => {
  const tabTextures = useMemo(
    () => files.map((file) => createTabTexture(file.label)),
    [files]
  );

  useEffect(() => () => tabTextures.forEach((t) => t.dispose()), [tabTextures]);

  const layout = useMemo(() => {
    const span = (files.length - 1) * FILE_GAP;
    return files.map((_, i) => ({
      z: FILE_Z_CENTER - span / 2 + i * FILE_GAP,
      lean: (i % 2 === 0 ? 1 : -1) * (0.012 + (i % 3) * 0.005),
      // Spread tabs across the width so labels never sit behind one another.
      tabX:
        files.length === 1
          ? 0
          : -FILE_W / 2 + 0.42 + (i / Math.max(1, files.length - 1)) * (FILE_W - 0.84),
    }));
  }, [files]);

  const baseY = -DRAWER_H / 2 + 0.07 + FILE_H / 2;

  return (
    <group>
      {files.map((file, i) => (
        <Folder
          key={file.targetId}
          position={[0, baseY, layout[i].z]}
          lean={layout[i].lean}
          tabX={layout[i].tabX}
          tabTexture={tabTextures[i]}
          folderColor={folderColor}
          hovered={hoveredFile === i}
          reduceMotion={reduceMotion}
          onPointerOver={onOver(i)}
          onPointerOut={onOut(i)}
          onClick={onClick(i)}
        />
      ))}
    </group>
  );
};

interface FolderProps {
  position: [number, number, number];
  lean: number;
  tabX: number;
  tabTexture: THREE.CanvasTexture;
  folderColor: string;
  hovered: boolean;
  reduceMotion: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: () => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

/** A single folder. Lifts on hover so it is obvious which one you are about to
 *  pick, rather than the whole drawer reacting at once. */
const Folder: React.FC<FolderProps> = ({
  position,
  lean,
  tabX,
  tabTexture,
  folderColor,
  hovered,
  reduceMotion,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const lift = hovered && !reduceMotion ? 0.13 : 0;
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      position[1] + lift,
      0.16
    );
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={[lean, 0, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Folder body */}
      <mesh>
        <boxGeometry args={[FILE_W, FILE_H, 0.035]} />
        <meshStandardMaterial
          color={folderColor}
          roughness={0.82}
          metalness={0.02}
          emissive={hovered ? '#4a3512' : '#000000'}
          emissiveIntensity={hovered ? 0.65 : 0}
        />
      </mesh>

      {/* Paper peeking above the fold */}
      <mesh position={[0, FILE_H / 2 - 0.035, 0.004]} raycast={() => null}>
        <boxGeometry args={[FILE_W - 0.12, 0.07, 0.028]} />
        <meshStandardMaterial color="#e7e2d6" roughness={0.9} metalness={0} />
      </mesh>

      {/* Printed index tab */}
      <mesh position={[tabX, FILE_H / 2 + 0.045, 0]} raycast={() => null}>
        <boxGeometry args={[0.56, 0.1, 0.03]} />
        <meshBasicMaterial map={tabTexture} toneMapped={false} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* Cabinet                                                                     */
/* -------------------------------------------------------------------------- */

interface CabinetProps {
  bands: React.RefObject<Band[]>;
  drawers: DrawerDef[];
  theme: SceneTheme;
  reduceMotion: boolean;
}

const Cabinet: React.FC<CabinetProps> = ({ bands, drawers, theme, reduceMotion }) => {
  const rootRef = useRef<THREE.Group>(null);
  const drawerRefs = useRef<(THREE.Group | null)[]>([]);
  const openAmounts = useRef<number[]>(drawers.map(() => 0));
  const nudges = useRef<number[]>(drawers.map(() => 0));
  /** What the pointer is over: a drawer front, a folder, or nothing. */
  const [hovered, setHovered] = useState<Hover>(null);

  /** Set when a drawer front is clicked, so it opens at once instead of waiting
   *  for the smooth scroll to arrive. Released as soon as scrolling catches up. */
  const forced = useRef<{ index: number; until: number } | null>(null);
  const { gl } = useThree();
  const mat = MATERIALS[theme];

  const labels = useMemo(
    () => drawers.map((d) => createLabelTexture(d.index, d.label)),
    [drawers]
  );

  useEffect(() => () => labels.forEach((t) => t.dispose()), [labels]);

  /** Shared so five drawers do not allocate five copies of the same material. */
  const interiorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0c11',
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  useEffect(() => () => interiorMaterial.dispose(), [interiorMaterial]);

  // The cursor is a side effect of the hover state, not something the frame
  // loop pokes at directly — and this way unmounting mid-hover restores it.
  useEffect(() => {
    const canvas = gl.domElement;
    // The canvas is a DOM node owned by three.js, not React state; styling it
    // from an effect with cleanup is the correct place to do this.
    // oxlint-disable-next-line react/immutability
    canvas.style.cursor = hovered ? 'pointer' : '';
    return () => {
      canvas.style.cursor = '';
    };
  }, [gl, hovered]);

  /** Files only respond once their drawer is actually open. */
  const isReachable = useCallback((i: number) => openAmounts.current[i] > 0.55, []);

  const handleOver = useCallback(
    (drawer: number) => (file: number) => (e: ThreeEvent<PointerEvent>) => {
      if (!isReachable(drawer)) return;
      e.stopPropagation();
      setHovered({ kind: 'file', drawer, file });
    },
    [isReachable]
  );

  const handleOut = useCallback(
    (drawer: number) => (file: number) => () => {
      setHovered((current) =>
        current?.kind === 'file' && current.drawer === drawer && current.file === file
          ? null
          : current
      );
    },
    []
  );

  /* --- Drawer fronts: click to open and jump straight to the section ------- */

  const handleFaceOver = useCallback(
    (drawer: number) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered({ kind: 'face', drawer });
    },
    []
  );

  const handleFaceOut = useCallback(
    (drawer: number) => () => {
      setHovered((current) =>
        current?.kind === 'face' && current.drawer === drawer ? null : current
      );
    },
    []
  );

  const handleFaceClick = useCallback(
    (drawer: number) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (!document.getElementById(drawers[drawer].id)) return;

      // Open immediately rather than waiting for the scroll to land, so the
      // cabinet responds on the click itself.
      forced.current = { index: drawer, until: performance.now() + 2500 };
      window.location.hash = drawers[drawer].id;
    },
    [drawers]
  );

  // useSectionBands drops any section whose element is not on the page, so a
  // band's position in that list is NOT its drawer's position. Resolving by id
  // keeps the two aligned: add a section to NAV_SECTIONS before its component
  // exists and the cabinet simply never opens that drawer, rather than opening
  // the wrong one for every section after it.
  const drawerIndexById = useMemo(
    () => new Map(drawers.map((drawer, i) => [drawer.id, i])),
    [drawers]
  );

  const handleClick = useCallback(
    (drawer: number) => (file: number) => (e: ThreeEvent<MouseEvent>) => {
      if (!isReachable(drawer)) return;
      e.stopPropagation();

      const target = drawers[drawer].files[file];
      if (!target || !document.getElementById(target.targetId)) return;

      // Setting the hash rather than calling scrollIntoView gets three things
      // for free: the browser scrolls (honouring scroll-padding-top), :target
      // highlights what you landed on, and the back button works.
      window.location.hash = target.targetId;
    },
    [drawers, isReachable]
  );

  useFrame((state, delta) => {
    /* --- Which section is in focus? ------------------------------------- */
    const focal = window.scrollY + window.innerHeight * 0.45;
    const list = bands.current ?? [];

    // The active section is the last one that has started above the focal line.
    //
    // Two earlier rules failed here. Gating on `distance < height * 0.85` let a
    // tall section reach back past the hero and hold its drawer open before the
    // page had been scrolled. Nearest-centre fixed that but broke click-to-open:
    // scrolling to a tall section's top leaves the focal line far above its
    // centre, so the section you just navigated to was not the one selected, and
    // the drawer snapped shut a moment after opening.
    //
    // "Last section to have started" has neither failure, needs no tuning
    // constant, and matches navigation exactly — landing on a section's top edge
    // always selects that section.
    let activeId: string | null = null;
    for (let i = 0; i < list.length; i++) {
      if (focal >= list[i].top) activeId = list[i].id;
    }

    let activeIndex = activeId === null ? -1 : drawerIndexById.get(activeId) ?? -1;

    // A clicked drawer opens straight away and holds until the scroll catches
    // up — or until the deadline, so a blocked scroll can never wedge it open.
    const override = forced.current;
    if (override) {
      if (activeIndex === override.index || performance.now() > override.until) {
        forced.current = null;
      } else {
        activeIndex = override.index;
      }
    }

    /* --- One drawer open at a time; easing produces the hand-off --------- */
    const rate = reduceMotion ? 1 : 1 - Math.pow(0.004, delta);

    for (let i = 0; i < drawers.length; i++) {
      const target = i === activeIndex ? 1 : 0;
      openAmounts.current[i] += (target - openAmounts.current[i]) * rate;

      const group = drawerRefs.current[i];
      if (!group) continue;

      const amount = openAmounts.current[i];
      // Slight overshoot as it settles, so the drawer feels weighted.
      const eased = amount + Math.sin(Math.min(1, amount) * Math.PI) * 0.045;

      // A hovered front eases out a little, the way a real drawer gives when
      // you take hold of it — the affordance that says this is clickable.
      const wantNudge = hovered?.kind === 'face' && hovered.drawer === i && !reduceMotion;
      nudges.current[i] += ((wantNudge ? 0.14 : 0) - nudges.current[i]) * 0.16;

      group.position.z = eased * OPEN_DISTANCE + nudges.current[i];
      // An open drawer sags a hair on its runners.
      group.rotation.x = -amount * 0.012;
    }

    // A folder whose drawer closed under the pointer must not stay hovered.
    if (hovered?.kind === 'file' && !isReachable(hovered.drawer)) setHovered(null);

    /* --- Crane down the cabinet so the open drawer is always framed ------ */
    if (rootRef.current) {
      // With no drawer open (the hero) the whole cabinet is centred instead.
      const targetY =
        activeIndex === -1 ? 0 : TRACK_FACTOR * (FOCUS_Y - drawerY(activeIndex));
      rootRef.current.position.y = THREE.MathUtils.lerp(
        rootRef.current.position.y,
        targetY,
        reduceMotion ? 1 : rate
      );
    }

    /* --- The cabinet itself drifts a little ----------------------------- */
    if (rootRef.current && !reduceMotion) {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        -0.34 + state.pointer.x * 0.05,
        0.045
      );
      rootRef.current.rotation.x = THREE.MathUtils.lerp(
        rootRef.current.rotation.x,
        0.04 - state.pointer.y * 0.04,
        0.045
      );
    }
  });

  const bodyMaterial = (
    <meshStandardMaterial color={mat.body} metalness={mat.metalness} roughness={mat.roughness} />
  );

  return (
    <group
      ref={rootRef}
      position={[CABINET_X, 0, 0]}
      rotation={[0.04, -0.34, 0]}
      scale={CABINET_SCALE}
    >
      {/* ---------------- Carcass ---------------- */}
      <mesh position={[0, 0, -D / 2]}>
        <boxGeometry args={[W, H, SHELL]} />
        {bodyMaterial}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * (W - SHELL)) / 2, 0, 0]}>
          <boxGeometry args={[SHELL, H, D]} />
          {bodyMaterial}
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, (side * (H - SHELL)) / 2, 0]}>
          <boxGeometry args={[W, SHELL, D]} />
          {bodyMaterial}
        </mesh>
      ))}
      <mesh position={[0, -H / 2 - 0.09, 0]}>
        <boxGeometry args={[W - 0.12, 0.18, D - 0.12]} />
        <meshStandardMaterial color="#20242b" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Interior void — what the drawers pull out of */}
      <mesh position={[0, 0, -0.05]} material={interiorMaterial} raycast={() => null}>
        <boxGeometry args={[W - SHELL * 2.2, H - SHELL * 2.2, D - 0.2]} />
      </mesh>

      {/* ---------------- Drawers ---------------- */}
      {drawers.map((drawer, i) => {
        const y = drawerY(i);
        const isFaceHovered = hovered?.kind === 'face' && hovered.drawer === i;

        return (
          <group
            key={drawer.id}
            ref={(el) => {
              drawerRefs.current[i] = el;
            }}
            position={[0, y, 0]}
          >
            {/* Box: bottom, back, two sides — open at the top so files show */}
            <mesh
              position={[0, -DRAWER_H / 2 + 0.03, 0]}
              material={interiorMaterial}
              raycast={() => null}
            >
              <boxGeometry args={[DRAWER_W, 0.06, DRAWER_D]} />
            </mesh>
            <mesh
              position={[0, 0, -DRAWER_D / 2]}
              material={interiorMaterial}
              raycast={() => null}
            >
              <boxGeometry args={[DRAWER_W, DRAWER_H, 0.05]} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[(side * (DRAWER_W - 0.05)) / 2, 0, 0]}
                material={interiorMaterial}
                raycast={() => null}
              >
                <boxGeometry args={[0.05, DRAWER_H, DRAWER_D]} />
              </mesh>
            ))}

            {/* The folders — the only things in the scene that take a click,
                each pointing at its own item rather than the section as a whole */}
            <Files
              files={drawer.files}
              folderColor={mat.folder}
              hoveredFile={
                hovered?.kind === 'file' && hovered.drawer === i ? hovered.file : null
              }
              reduceMotion={reduceMotion}
              onOver={handleOver(i)}
              onOut={handleOut(i)}
              onClick={handleClick(i)}
            />

            {/* The drawer front — click it to open the drawer and jump to that
                section. Face, pull and plate share one handler so the whole
                front is one target rather than three fiddly ones. */}
            <group
              onPointerOver={handleFaceOver(i)}
              onPointerOut={handleFaceOut(i)}
              onClick={handleFaceClick(i)}
            >
              <mesh position={[0, 0, DRAWER_D / 2 + 0.02]}>
                <boxGeometry args={[DRAWER_W + 0.05, DRAWER_H, 0.06]} />
                <meshStandardMaterial
                  color={mat.face}
                  metalness={mat.metalness}
                  roughness={mat.roughness}
                  emissive={isFaceHovered ? '#2a3038' : '#000000'}
                  emissiveIntensity={isFaceHovered ? 0.7 : 0}
                />
              </mesh>

              {/* Recessed pull, as on a real filing cabinet */}
              <mesh position={[0, 0.02, DRAWER_D / 2 + 0.045]}>
                <boxGeometry args={[0.62, 0.2, 0.03]} />
                <meshStandardMaterial color="#14171d" metalness={0.4} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.02, DRAWER_D / 2 + 0.07]}>
                <boxGeometry args={[0.56, 0.075, 0.035]} />
                <meshStandardMaterial
                  color={isFaceHovered ? '#e6d3ae' : mat.pull}
                  metalness={0.9}
                  roughness={0.22}
                />
              </mesh>

              {/* Label plate */}
              <mesh position={[0, PLATE_Y, DRAWER_D / 2 + 0.056]}>
                <planeGeometry args={[PLATE_W, PLATE_H]} />
                <meshBasicMaterial map={labels[i]} transparent toneMapped={false} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};

/* -------------------------------------------------------------------------- */

interface CabinetSceneProps {
  bands: React.RefObject<Band[]>;
  drawers: DrawerDef[];
  theme: SceneTheme;
}

const CabinetScene: React.FC<CabinetSceneProps> = ({ bands, drawers, theme }) => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mat = MATERIALS[theme];

  return (
    <Canvas
      camera={{ position: [0, 3.3, 9.6], fov: 42 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.NeutralToneMapping,
      }}
      dpr={[1, 1.75]}
    >
      <CameraRig />
      <Environment intensity={mat.env} />
      <ambientLight intensity={mat.ambient} />

      {/* Warm key raking across the drawer faces and down into the open drawer */}
      <spotLight
        position={[-5.5, 7, 6]}
        angle={0.66}
        penumbra={0.85}
        intensity={mat.key * 34}
        color="#ffd9a3"
        distance={28}
      />
      {/* Cool rim to lift the cabinet off a dark page */}
      <pointLight position={[6, 1.5, 2.5]} intensity={18} color="#8fb0dd" distance={22} />
      {/* Low fill so the interiors are dark but not solid black */}
      <directionalLight position={[2, -3, 5]} intensity={0.5} color="#b8c4d6" />

      <Cabinet bands={bands} drawers={drawers} theme={theme} reduceMotion={reduceMotion} />
      <Dust reduceMotion={reduceMotion} />
    </Canvas>
  );
};

export default CabinetScene;
