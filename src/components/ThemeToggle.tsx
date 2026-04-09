import { useEffect, useRef, useState } from 'react'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
}

// ── Canvas geometry ──────────────────────────────────────────────────
const CW = 50          // canvas width  (px)
const CH = 160         // canvas height (px)
const ANCHOR_X = CW / 2

// ── Bead chain ───────────────────────────────────────────────────────
const BEAD_COUNT = 22
const RING_RADIUS = 7
const BEAD_SIZE = 2.5
// Space 22 beads so the last one ends near the bottom of the canvas
const BEAD_DIST = (CH - RING_RADIUS * 4) / BEAD_COUNT  // ≈ 6 px

// ── Physics ──────────────────────────────────────────────────────────
const GRAVITY = 14           // px/s²
const X_FRICTION = 0.014     // px/ms — constant deceleration on X
const INITIAL_KICK = -4.5    // px/frame added to last bead on pull

// ── Constraint iterations (more = stiffer rope) ──────────────────────
const SOLVER_ITERS = 20

interface Bead { x: number; y: number; speedX: number; speedY: number }

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}
function ang(x1: number, y1: number, x2: number, y2: number) {
  return Math.atan((y2 - y1) / (x2 - x1))
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beadsRef = useRef<Bead[]>([])
  const rafRef = useRef<number>(0)
  const lastTRef = useRef<number>(0)
  const runningRef = useRef<boolean>(true)
  const anchorYRef = useRef<number>(0)   // pulled anchor position
  const flashingRef = useRef<boolean>(false)
  const isDarkRef = useRef<boolean>(isDark)
  isDarkRef.current = isDark
  const cordAudioRef = useRef<HTMLAudioElement | null>(null)
  const [hintDismissed, setHintDismissed] = useState(false)

  // ── Bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    // Initialise straight-hanging chain
    beadsRef.current = Array.from({ length: BEAD_COUNT }, (_, i) => ({
      x: ANCHOR_X,
      y: (i + 1) * BEAD_DIST,
      speedX: 0,
      speedY: 0,
    }))

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    lastTRef.current = performance.now()

    function loop(now: number) {
      const dt = Math.min(now - lastTRef.current, 50)   // cap at 50 ms
      lastTRef.current = now

      if (runningRef.current) {
        ctx.clearRect(0, 0, CW, CH)

        const dark = isDarkRef.current
        const beads = beadsRef.current
        const ancY = anchorYRef.current

        // ── 1. Physics step ────────────────────────────────────────
        for (const b of beads) {
          b.speedY += GRAVITY * dt / 1000
          const sign = b.speedX >= 0 ? 1 : -1
          const fr = X_FRICTION * dt
          b.speedX = Math.abs(b.speedX) <= fr ? 0 : b.speedX - sign * fr
          b.x += b.speedX
          b.y += b.speedY
        }

        // ── 2. Constraint solver ────────────────────────────────────
        for (let iter = 0; iter < SOLVER_ITERS; iter++) {
          for (let i = 0; i < beads.length; i++) {
            const b = beads[i]
            const px = i === 0 ? ANCHOR_X : beads[i - 1].x
            const py = i === 0 ? ancY : beads[i - 1].y
            const d = dist(b.x, b.y, px, py)

            if (d > BEAD_DIST) {
              const a = ang(b.x, b.y, px, py)
              let dx = Math.cos(a) * (d - BEAD_DIST)
              let dy = Math.sin(a) * (d - BEAD_DIST)
              if (b.x > px) { dx = -dx; dy = -dy }

              if (i > 0) {
                // Distribute correction between bead and parent
                b.x += dx / 2; b.y += dy / 2
                b.speedX += dx / 2; b.speedY += dy / 2
                beads[i - 1].x -= dx / 2; beads[i - 1].y -= dy / 2
                beads[i - 1].speedX -= dx / 2; beads[i - 1].speedY -= dy / 2
              } else {
                // Anchor is fixed — only the first bead moves
                b.x += dx; b.y += dy
                b.speedX += dx; b.speedY += dy
              }
            }
          }
        }

        // ── 3. Render ───────────────────────────────────────────────
        const cordColor = dark ? 'rgba(155,145,125,0.75)' : 'rgba(75,65,52,0.75)'
        ctx.strokeStyle = cordColor
        ctx.lineWidth = 1.3

        // Static segment from viewport edge down to anchor (visible when pulled)
        if (ancY > 0) {
          ctx.beginPath()
          ctx.moveTo(ANCHOR_X, 0)
          ctx.lineTo(ANCHOR_X, ancY)
          ctx.stroke()
        }

        // Rope segments between beads
        for (let i = 0; i < beads.length; i++) {
          const px = i === 0 ? ANCHOR_X : beads[i - 1].x
          const py = i === 0 ? ancY : beads[i - 1].y
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(beads[i].x, beads[i].y)
          ctx.stroke()
        }

        // Chain beads (all except the last, which is the ring)
        const beadFill = dark ? '#b8a870' : '#7a6a50'
        for (let i = 0; i < beads.length - 1; i++) {
          const b = beads[i]
          ctx.beginPath()
          ctx.arc(b.x, b.y, BEAD_SIZE, 0, Math.PI * 2)
          ctx.fillStyle = beadFill
          ctx.fill()
        }

        // Pull ring
        const last = beads[beads.length - 1]
        const ringColor = dark ? '#c8b880' : '#5a4530'
        ctx.beginPath()
        ctx.arc(last.x, last.y, RING_RADIUS, 0, Math.PI * 2)
        ctx.strokeStyle = ringColor
        ctx.lineWidth = 2.2
        ctx.stroke()
        // Centre dot
        ctx.beginPath()
        ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = ringColor
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    const onVisibility = () => {
      runningRef.current = !document.hidden
      if (!document.hidden) lastTRef.current = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // ── Trigger theme change with flash overlay ─────────────────────────
  function triggerToggle() {
    if (flashingRef.current) return
    const beads = beadsRef.current
    if (!beads.length) return

    // Physical kick: swing the cord
    beads[beads.length - 1].speedX += INITIAL_KICK
    anchorYRef.current = 0

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReduced) {
      if (!cordAudioRef.current) cordAudioRef.current = new Audio('/audios/cord-pull.mp3')
      cordAudioRef.current.currentTime = 0
      cordAudioRef.current.play().catch(() => {})
    }

    const overlay = document.getElementById('theme-flash') as HTMLDivElement | null

    if (prefersReduced || !overlay) {
      onToggle()
      return
    }

    const flashColor = isDarkRef.current ? '#0f0f0f' : '#ffffff'
    flashingRef.current = true
    overlay.style.backgroundColor = flashColor
    overlay.style.transition = 'opacity 80ms ease-in'
    overlay.style.opacity = '1'

    setTimeout(() => {
      onToggle()
      overlay.style.transition = 'opacity 120ms ease-out'
      overlay.style.opacity = '0'
      setTimeout(() => { flashingRef.current = false }, 120)
    }, 80)
  }

  function handleDown() {
    if (!hintDismissed) {
      setHintDismissed(true)
    }
    anchorYRef.current = BEAD_DIST * 1.5   // pull cord downward
    runningRef.current = true
  }

  function handleUp() {
    triggerToggle()
  }

  return (
    <div className="pull-cord-wrap">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="pull-cord"
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onTouchStart={e => { e.preventDefault(); handleDown() }}
        onTouchEnd={e => { e.preventDefault(); handleUp() }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleDown()
            setTimeout(handleUp, 100)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <div className={`pull-cord-hint${hintDismissed ? ' dismissed' : ''}`} aria-hidden="true">
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" className="cord-hint-arrow">
          <path d="M 36 44 C 0 45, 4 22, 10 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M 4 10 L 10 4 L 16 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="cord-hint-text">pull on this</span>
      </div>
    </div>
  )
}
