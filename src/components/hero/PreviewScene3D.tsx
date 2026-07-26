import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { GAS_TINT, HEAT_TINT } from './previewModel'

const damp = THREE.MathUtils.damp

const OCEAN_TONES = ['#1c6d94', '#17597d', '#124b6c']
const LAND_TONES = ['#22c55e', '#15803d', '#4d7c0f']
const ARID = '#d98c4a'
const ICE = '#e4eef4'

/** Cheap deterministic terrain field — enough to read as continents, no texture to download. */
function landHeight(x: number, y: number, z: number) {
  return (
    Math.sin(3.1 * x + 1.3) * Math.cos(2.7 * y - 0.6) +
    0.62 * Math.sin(4.6 * z + 2.1) * Math.cos(3.3 * x + 0.4) +
    0.34 * Math.sin(6.2 * y + 0.9) * Math.cos(5.1 * z - 1.1)
  )
}

/**
 * One flat-shaded icosahedron with per-face vertex colours: a single draw call
 * for the whole planet, which is what keeps this cheap on mid-range phones.
 */
function useEarthGeometry() {
  return useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.95, 4)
    const position = geo.getAttribute('position')
    const colors = new Float32Array(position.count * 3)

    const ocean = OCEAN_TONES.map((c) => new THREE.Color(c))
    const land = LAND_TONES.map((c) => new THREE.Color(c))
    const arid = new THREE.Color(ARID)
    const ice = new THREE.Color(ICE)

    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const c = new THREE.Vector3()
    const centroid = new THREE.Vector3()

    for (let i = 0; i < position.count; i += 3) {
      a.fromBufferAttribute(position, i)
      b.fromBufferAttribute(position, i + 1)
      c.fromBufferAttribute(position, i + 2)
      centroid.copy(a).add(b).add(c).divideScalar(3).normalize()

      const h = landHeight(centroid.x, centroid.y, centroid.z)
      const polar = Math.abs(centroid.y)
      // Bands keep neighbouring faces in the same family, so land reads as
      // continents instead of confetti.
      let tone: THREE.Color
      if (polar > 0.9) tone = ice
      else if (h > 1.15) tone = land[2]
      else if (h > 0.55) tone = land[1]
      else if (h > 0.12) tone = land[0]
      else if (h > 0.04) tone = arid
      else tone = ocean[h < -0.9 ? 2 : h < -0.4 ? 1 : 0]

      for (let v = 0; v < 3; v++) {
        const o = (i + v) * 3
        colors[o] = tone.r
        colors[o + 1] = tone.g
        colors[o + 2] = tone.b
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])
}

/**
 * Fresnel rim glow: brightest at the silhouette, invisible face-on. This is the
 * cheap stand-in for a bloom pass — one extra sphere, no render targets.
 */
const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
    gl_FragColor = vec4(uColor, fresnel * uStrength);
  }
`

function GasShell({ co2Ref, count }: { co2Ref: MutableRefObject<number>; count: number }) {
  const points = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      const r = 1.18 + Math.random() * 0.32
      positions[i * 3] = r * Math.sin(v) * Math.cos(u)
      positions[i * 3 + 1] = r * Math.sin(v) * Math.sin(u) * 0.9
      positions[i * 3 + 2] = r * Math.cos(v)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [count])

  useFrame((_, dt) => {
    const p = points.current
    if (!p) return
    p.rotation.y += dt * 0.09
    p.rotation.x = 0.12
    const mat = p.material as THREE.PointsMaterial
    mat.opacity = damp(mat.opacity, 0.18 + co2Ref.current * 0.62, 4, dt)
    mat.size = damp(mat.size, 0.022 + co2Ref.current * 0.014, 4, dt)
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={GAS_TINT}
        size={0.024}
        sizeAttenuation
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </points>
  )
}

function Globe({
  co2Ref,
  spinRef,
  tiltRef,
  particles,
}: {
  co2Ref: MutableRefObject<number>
  spinRef: MutableRefObject<number>
  tiltRef: MutableRefObject<number>
  particles: number
}) {
  const group = useRef<THREE.Group>(null)
  const atmosphere = useRef<THREE.Mesh>(null)
  const heatRim = useRef<THREE.Mesh>(null)
  const auto = useRef(0)
  const blend = useRef(0)

  const earth = useEarthGeometry()
  const gasColor = useMemo(() => new THREE.Color(GAS_TINT), [])
  const heatColor = useMemo(() => new THREE.Color(HEAT_TINT), [])

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(GAS_TINT) },
      uStrength: { value: 0.5 },
      uPower: { value: 2.6 },
    }),
    [],
  )

  const heatUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(HEAT_TINT) },
      uStrength: { value: 0 },
      uPower: { value: 3.4 },
    }),
    [],
  )

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05)
    auto.current += step * 0.14

    const g = group.current
    if (g) {
      g.rotation.y = damp(g.rotation.y, auto.current + spinRef.current, 3.2, step)
      g.rotation.x = damp(g.rotation.x, -0.18 + tiltRef.current, 3.2, step)
    }

    const co2 = co2Ref.current
    blend.current = damp(blend.current, co2, 3, step)

    const atmo = atmosphere.current
    if (atmo) {
      atmosphereUniforms.uStrength.value = damp(
        atmosphereUniforms.uStrength.value,
        0.5 + co2 * 0.85,
        3,
        step,
      )
      atmosphereUniforms.uPower.value = damp(atmosphereUniforms.uPower.value, 2.9 - co2 * 1.1, 3, step)
      // Blanket shifts from cool sky-blue toward heat-red as gas builds up.
      atmosphereUniforms.uColor.value.lerpColors(gasColor, heatColor, blend.current * 0.7)
      atmo.scale.setScalar(damp(atmo.scale.x, 1 + co2 * 0.06, 3, step))
    }

    if (heatRim.current) {
      heatUniforms.uStrength.value = damp(heatUniforms.uStrength.value, co2 * 0.85, 3, step)
    }
  })

  return (
    <group ref={group} rotation={[0, 0, 0.26]}>
      <mesh geometry={earth}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      <mesh ref={atmosphere}>
        <sphereGeometry args={[1.13, 40, 28]} />
        <shaderMaterial
          vertexShader={RIM_VERTEX}
          fragmentShader={RIM_FRAGMENT}
          uniforms={atmosphereUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* heat building up right at the surface as the blanket thickens */}
      <mesh ref={heatRim}>
        <sphereGeometry args={[0.99, 32, 20]} />
        <shaderMaterial
          vertexShader={RIM_VERTEX}
          fragmentShader={RIM_FRAGMENT}
          uniforms={heatUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <GasShell co2Ref={co2Ref} count={particles} />
    </group>
  )
}

export interface PreviewScene3DProps {
  co2Ref: MutableRefObject<number>
  spinRef: MutableRefObject<number>
  tiltRef: MutableRefObject<number>
  active: boolean
  compact: boolean
}

export default function PreviewScene3D({
  co2Ref,
  spinRef,
  tiltRef,
  active,
  compact,
}: PreviewScene3DProps) {
  const [dpr, setDpr] = useState(compact ? 1.4 : 1.6)

  return (
    <Canvas
      className="preview-canvas"
      aria-hidden="true"
      flat
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 3.8], fov: compact ? 44 : 38 }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(compact ? 1.4 : 1.6)}
      />
      <ambientLight intensity={1.1} color="#9fb6cc" />
      <directionalLight position={[-3.2, 2.4, 2.8]} intensity={1.9} color="#ffe2ab" />
      <directionalLight position={[2.5, -1.6, -1.4]} intensity={0.35} color="#f87171" />
      <Globe
        co2Ref={co2Ref}
        spinRef={spinRef}
        tiltRef={tiltRef}
        particles={compact ? 70 : 150}
      />
    </Canvas>
  )
}
