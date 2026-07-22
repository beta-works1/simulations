import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ScrollScene.css'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Full-page Three.js layer: orbital lab that reacts to scroll + pointer.
 */
export function ScrollScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x041018, 0.045)

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120)
    camera.position.set(0, 0.6, 8)

    const renderer = new THREE.WebGLRenderer({
      antialias: !isCoarse,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'scroll-scene-canvas'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0x6a8aaa, 0.55))
    const key = new THREE.PointLight(0x38bdc6, 2.2, 40)
    key.position.set(4, 3, 6)
    scene.add(key)
    const rim = new THREE.PointLight(0xe67e22, 1.4, 30)
    rim.position.set(-5, -2, 4)
    scene.add(rim)

    // --- Nucleus ---
    const atom = new THREE.Group()
    scene.add(atom)

    const nucleusGeo = new THREE.IcosahedronGeometry(0.55, 2)
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xe67e22,
      emissive: 0xf4d35e,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.2,
    })
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat)
    atom.add(nucleus)

    const glowGeo = new THREE.SphereGeometry(0.9, 24, 24)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xe67e22,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
    atom.add(new THREE.Mesh(glowGeo, glowMat))

    // --- Electron orbits ---
    type Electron = {
      mesh: THREE.Mesh
      radius: number
      speed: number
      tilt: number
      phase: number
      ring: THREE.Line
    }

    const electronColors = [0x38bdc6, 0x5dade2, 0x2ecc71, 0xf1c40f]
    const electrons: Electron[] = []

    electronColors.forEach((color, i) => {
      const radius = 1.4 + i * 0.55
      const tilt = (i * Math.PI) / 5 + 0.25
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.42, 0, Math.PI * 2, false, 0)
      const pts = curve.getPoints(96).map((p: THREE.Vector2) => new THREE.Vector3(p.x, p.y, 0))
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const ringMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
      })
      const ring = new THREE.Line(ringGeo, ringMat)
      ring.rotation.x = tilt
      ring.rotation.z = i * 0.4
      atom.add(ring)

      const eGeo = new THREE.SphereGeometry(0.1 - i * 0.012, 16, 16)
      const eMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.7,
        roughness: 0.25,
      })
      const mesh = new THREE.Mesh(eGeo, eMat)
      atom.add(mesh)

      electrons.push({
        mesh,
        radius,
        speed: 0.7 + i * 0.22 * (i % 2 === 0 ? 1 : -1),
        tilt,
        phase: i * 1.7,
        ring,
      })
    })

    // --- Starfield particles ---
    const starCount = isCoarse ? 400 : 900
    const starPositions = new Float32Array(starCount * 3)
    const starSpeeds = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      const r = 4 + Math.random() * 28
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.65
      starPositions[i * 3 + 2] = r * Math.cos(phi) - 4
      starSpeeds[i] = 0.15 + Math.random() * 0.55
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xb8d4e8,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // --- Floating “molecule” nodes (appear mid-scroll) ---
    const nodes = new THREE.Group()
    scene.add(nodes)
    const nodeMeshes: THREE.Mesh[] = []
    const nodeBase: THREE.Vector3[] = []
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.OctahedronGeometry(0.12 + (i % 3) * 0.04, 0)
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x38bdc6 : 0x2ecc71,
        emissive: i % 2 === 0 ? 0x1a6a70 : 0x146b3a,
        emissiveIntensity: 0.4,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      const base = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 6 - 2,
      )
      mesh.position.copy(base)
      nodes.add(mesh)
      nodeMeshes.push(mesh)
      nodeBase.push(base)
    }

    // Connect some nodes with lines
    const linkPositions: number[] = []
    for (let i = 0; i < nodeBase.length - 1; i++) {
      if (i % 2 !== 0) continue
      const a = nodeBase[i]
      const b = nodeBase[(i + 3) % nodeBase.length]
      linkPositions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
    const linkGeo = new THREE.BufferGeometry()
    linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3))
    const linkMat = new THREE.LineBasicMaterial({
      color: 0x38bdc6,
      transparent: true,
      opacity: 0,
    })
    const links = new THREE.LineSegments(linkGeo, linkMat)
    nodes.add(links)

    // --- Interaction / scroll state ---
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const scroll = { progress: 0, target: 0 }
    let raf = 0
    let running = true
    let lastTime = performance.now()
    let elapsed = 0

    const pageEl = () => document.querySelector('.home-page') as HTMLElement | null

    const measureScroll = () => {
      const el = pageEl()
      if (!el) {
        scroll.target = 0
        return
      }
      const max = Math.max(1, el.scrollHeight - window.innerHeight)
      const top = window.scrollY - (el.offsetTop || 0)
      scroll.target = Math.min(1, Math.max(0, top / max))
    }

    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth
      const h = mount.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }

    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) lastTime = performance.now()
    }

    onResize()
    measureScroll()
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', measureScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate)
      if (!running) return

      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      elapsed += dt
      const t = elapsed

      scroll.progress = lerp(scroll.progress, scroll.target, reduceMotion ? 1 : 0.08)
      pointer.x = lerp(pointer.x, pointer.tx, 0.06)
      pointer.y = lerp(pointer.y, pointer.ty, 0.06)

      const p = scroll.progress
      const hero = 1 - smoothstep(0, 0.22, p)
      const mid = smoothstep(0.12, 0.45, p) * (1 - smoothstep(0.55, 0.85, p))
      const end = smoothstep(0.55, 0.9, p)

      // Electrons
      electrons.forEach((e, i) => {
        const angle = t * e.speed + e.phase
        const rx = e.radius * (1 + mid * 0.35 + end * 0.2)
        const ry = e.radius * 0.42 * (1 + mid * 0.2)
        const local = new THREE.Vector3(Math.cos(angle) * rx, Math.sin(angle) * ry, 0)
        local.applyEuler(new THREE.Euler(e.tilt, 0, i * 0.4))
        // Pointer tug
        local.x += pointer.x * 0.35
        local.y += pointer.y * 0.25
        e.mesh.position.copy(local)
        e.ring.scale.setScalar(1 + mid * 0.25 + end * 0.15)
        ;(e.ring.material as THREE.LineBasicMaterial).opacity = 0.1 + hero * 0.08 + mid * 0.12
      })

      nucleus.rotation.y = t * 0.25
      nucleus.rotation.x = t * 0.12
      nucleus.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03 + end * 0.15)
      nucleusMat.emissiveIntensity = 0.45 + hero * 0.25 + Math.sin(t * 2) * 0.05

      atom.rotation.y = t * 0.08 + pointer.x * 0.2
      atom.rotation.x = pointer.y * 0.12 + end * 0.35
      atom.position.set(
        lerp(1.8, -0.4, p) + pointer.x * 0.4,
        lerp(0.2, 0.8, p) + pointer.y * 0.25,
        lerp(0, -2.5, p),
      )
      atom.scale.setScalar(lerp(1.15, 0.55, smoothstep(0, 0.7, p)))

      // Stars drift + densify with scroll
      const pos = starGeo.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      const motion = reduceMotion ? 0 : 1
      for (let i = 0; i < starCount; i++) {
        const ix = i * 3 + 1
        arr[ix] += Math.sin(t * starSpeeds[i] + i) * 0.002 * motion
      }
      pos.needsUpdate = true
      stars.rotation.y = t * 0.02 + p * 0.4
      stars.rotation.x = p * 0.15
      starMat.opacity = 0.35 + mid * 0.4 + end * 0.35
      starMat.size = 0.028 + end * 0.02

      // Molecule network fades in mid-page
      const nodeAlpha = mid * 0.85 + end * 0.4
      nodeMeshes.forEach((mesh, i) => {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.opacity = nodeAlpha
        const b = nodeBase[i]
        mesh.position.set(
          b.x + Math.sin(t * 0.6 + i) * 0.15 + pointer.x * 0.3,
          b.y + Math.cos(t * 0.5 + i * 0.7) * 0.12 + pointer.y * 0.2,
          b.z,
        )
        mesh.rotation.x = t * 0.4 + i
        mesh.rotation.y = t * 0.3
      })
      linkMat.opacity = nodeAlpha * 0.35

      // Camera path through the lab
      const camX = lerp(0.2, -1.2, p) + pointer.x * 0.55
      const camY = lerp(0.55, 1.8, p) + pointer.y * 0.35
      const camZ = lerp(7.2, 11.5, p)
      camera.position.set(camX, camY, camZ)
      camera.lookAt(
        atom.position.x * 0.4,
        atom.position.y * 0.3 + end * 0.5,
        atom.position.z,
      )
      camera.fov = lerp(46, 58, end)
      camera.updateProjectionMatrix()

      // Fog thins as we “travel”
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = lerp(0.055, 0.022, p)
      }

      key.intensity = 1.6 + hero * 0.8
      rim.intensity = 0.9 + mid * 0.8

      // Expose progress for CSS (content fades)
      mount.style.setProperty('--scroll-p', p.toFixed(4))
      document.documentElement.style.setProperty('--home-scroll', p.toFixed(4))

      renderer.render(scene, camera)
    }

    if (reduceMotion) {
      measureScroll()
      scroll.progress = scroll.target
      // Single static frame
      electrons.forEach((e, i) => {
        const local = new THREE.Vector3(e.radius, 0, 0)
        local.applyEuler(new THREE.Euler(e.tilt, 0, i * 0.4))
        e.mesh.position.copy(local)
      })
      renderer.render(scene, camera)
    } else {
      raf = requestAnimationFrame(animate)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', measureScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      document.documentElement.style.removeProperty('--home-scroll')

      nucleusGeo.dispose()
      nucleusMat.dispose()
      glowGeo.dispose()
      glowMat.dispose()
      electrons.forEach((e) => {
        e.mesh.geometry.dispose()
        ;(e.mesh.material as THREE.Material).dispose()
        e.ring.geometry.dispose()
        ;(e.ring.material as THREE.Material).dispose()
      })
      starGeo.dispose()
      starMat.dispose()
      nodeMeshes.forEach((m) => {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      })
      linkGeo.dispose()
      linkMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="scroll-scene-pin" aria-hidden="true">
      <div ref={mountRef} className="scroll-scene" />
    </div>
  )
}
