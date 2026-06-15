import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Globe() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.set(0, 0, 7.5) // Optimal camera distance

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0xf0f0eb, 0) // Transparent background

    scene.add(new THREE.AmbientLight(0xffffff, 1.0))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    // Colors
    const c1 = new THREE.Color(0x2c4a3e) // Forest Green
    const c2 = new THREE.Color(0x1c1f1d) // Slate
    const c3 = new THREE.Color(0x8c968f) // Sage

    // Shared circular dot texture
    const tc = document.createElement('canvas'); tc.width = 16; tc.height = 16
    const tx = tc.getContext('2d')
    tx.beginPath()
    tx.arc(8, 8, 6, 0, 2 * Math.PI)
    tx.fillStyle = '#ffffff'
    tx.fill()
    const dotTexture = new THREE.CanvasTexture(tc)

    // 1. Globe Mesh
    const COUNT = 1600
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const r = 3.2 // Base radius

    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(2 * (i / COUNT) - 1)
      const theta = (i / COUNT) * Math.PI * 30
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      
      const m = Math.random()
      const c = m < 0.45 ? c1 : m < 0.8 ? c2 : c3
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      map: dotTexture,
      depthWrite: false,
    })
    const pts = new THREE.Points(geo, mat)
    scene.add(pts)

    // 2. Tilted Saturn-like Orbital Ring (Added for extra detail/wow factor)
    const RING_COUNT = 350
    const ringGeo = new THREE.BufferGeometry()
    const ringPos = new Float32Array(RING_COUNT * 3)
    const ringCol = new Float32Array(RING_COUNT * 3)
    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2
      const dist = r * 1.28 + Math.random() * 0.5
      ringPos[i*3] = dist * Math.cos(angle)
      ringPos[i*3+1] = (Math.random() - 0.5) * 0.08
      ringPos[i*3+2] = dist * Math.sin(angle)

      const m = Math.random()
      const c = m < 0.5 ? c3 : c2
      ringCol[i*3] = c.r; ringCol[i*3+1] = c.g; ringCol[i*3+2] = c.b
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringCol, 3))

    const ringMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      map: dotTexture,
      depthWrite: false,
    })
    const ringMesh = new THREE.Points(ringGeo, ringMat)
    ringMesh.rotation.x = Math.PI * 0.18 // Tilt the ring elegantly
    pts.add(ringMesh) // Scale & move together with globe

    // 3. Ambient Floating Background Dust Particles
    const DUST_COUNT = 90
    const dustGeo = new THREE.BufferGeometry()
    const dustPos = new Float32Array(DUST_COUNT * 3)
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPos[i*3] = (Math.random() - 0.5) * 16
      dustPos[i*3+1] = (Math.random() - 0.5) * 10
      dustPos[i*3+2] = (Math.random() - 0.5) * 8
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x8c968f,
      transparent: true,
      opacity: 0.35,
      map: dotTexture,
      depthWrite: false
    })
    const dustMesh = new THREE.Points(dustGeo, dustMat)
    scene.add(dustMesh)

    // Mouse Parallax Controls
    let mouseX = 0
    let mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMouseMove)

    // Resize Observer for dynamic fit
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width || parent.clientWidth || 300
        const height = entry.contentRect.height || parent.clientHeight || 150
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)

        // Scale factor: Globe dynamically matches hero section size
        const scaleFactor = Math.min(width, height) / 380
        pts.scale.setScalar(Math.max(0.75, Math.min(scaleFactor * 0.9, 1.45)))
        dustMesh.scale.setScalar(Math.max(0.8, Math.min(scaleFactor * 1.0, 1.5)))
      }
    })
    resizeObserver.observe(parent)

    const clock = new THREE.Clock()
    let animId

    function animate() {
      const t = clock.getElapsedTime()

      // Target rotation responds to cursor movement
      const targetRotX = mouseY * 0.3
      const targetRotY = t * 0.06 + mouseX * 0.3

      pts.rotation.x += (targetRotX - pts.rotation.x) * 0.05
      pts.rotation.y += (targetRotY - pts.rotation.y) * 0.05
      
      // Rotate the flat ring slightly differently relative to parent
      ringMesh.rotation.y = -t * 0.02

      // Drift background dust particles upwards continuously
      const positions = dustGeo.attributes.position.array
      for (let i = 0; i < DUST_COUNT; i++) {
        positions[i*3+1] += 0.005 // Float up speed
        if (positions[i*3+1] > 6) {
          positions[i*3+1] = -6 // Reset to bottom
        }
      }
      dustGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      resizeObserver.disconnect()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
}
