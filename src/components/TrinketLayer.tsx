import { useEffect, useRef } from 'react'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface TrinketState {
  el: HTMLElement
  rotateDeg: string
  vy: number
  offset: number
  floatPhase: number
  floatFreq: number
  floatAmp: number
}

export default function TrinketLayer() {
  const physicsLockedTrinketRef = useRef<HTMLElement | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const bubbleAudioCache = useRef(new WeakMap<Element, HTMLAudioElement>())

  // ── Sync layer height + anchor trinkets to their sections ──────────────────
  useEffect(() => {
    function syncTrinketLayer() {
      const layer = document.querySelector('.trinket-layer') as HTMLElement | null
      if (!layer) return
      layer.style.height = document.body.scrollHeight + 'px'
    }

    function positionTrinkets() {
      if (window.innerWidth < 600) return
      const trinkets = Array.from(document.querySelectorAll('.trinket-photo')) as HTMLElement[]
      if (!trinkets.length) return

      function docTop(el: HTMLElement): number {
        return el.getBoundingClientRect().top + window.scrollY
      }

      const bio = document.querySelector('#bio') as HTMLElement | null
      const projects = document.querySelector('#projects') as HTMLElement | null
      const projectList = (document.querySelector('#projects .project-list') ?? projects) as HTMLElement | null
      const work = document.querySelector('#work') as HTMLElement | null
      const hobbies = document.querySelector('#hobbies') as HTMLElement | null

      const resolvers: Array<() => number | null> = [
        () => bio ? docTop(bio) + (bio.offsetHeight - trinkets[0].offsetHeight) / 2 + 130 : null,
        () => projects ? docTop(projects) + 180 : null,
        () => projectList ? docTop(projectList) + projectList.offsetHeight - trinkets[2].offsetHeight + 300 : null,
        () => work ? docTop(work) + (work.offsetHeight - trinkets[3].offsetHeight) / 2 + 300 : null,
        () => null,
        () => hobbies ? docTop(hobbies) + (hobbies.offsetHeight - trinkets[5].offsetHeight) / 2 : null,
      ]

      resolvers.forEach((resolve, i) => {
        if (!trinkets[i]) return
        const top = resolve()
        if (top !== null) trinkets[i].style.top = `${top}px`
      })
    }

    function syncAll() {
      syncTrinketLayer()
      positionTrinkets()
    }

    syncAll()
    window.addEventListener('resize', syncAll)
    const resizeObserver = new ResizeObserver(syncAll)
    resizeObserver.observe(document.body)

    return () => {
      window.removeEventListener('resize', syncAll)
      resizeObserver.disconnect()
    }
  }, [])

  // ── Scroll inertia + independent float physics ─────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return

    const SPRING = 0.10
    const DAMPING = 0.90
    const MAX_VELOCITY = 24
    const MAX_OFFSET = 200
    const FLOAT_BASE = 5
    const FLOAT_MAX = 22
    const FLOAT_BOOST = 0.50
    const FLOAT_DECAY = 0.998

    const trinkets = Array.from(document.querySelectorAll('.trinket-photo')) as HTMLElement[]
    if (!trinkets.length) return

    const states: TrinketState[] = trinkets.map(el => {
      const rotateMatch = el.style.transform?.match(/rotate\(([^)]+)\)/)
      const rotateDeg = rotateMatch ? rotateMatch[1] : '0deg'
      return {
        el,
        rotateDeg,
        vy: 0,
        offset: 0,
        floatPhase: Math.random() * Math.PI * 2,
        floatFreq: 0.00055 + Math.random() * 0.00045,
        floatAmp: FLOAT_BASE,
      }
    })

    let lastScrollY = window.scrollY
    let lastTime = performance.now()
    let animFrameId: number

    function tick(now: number) {
      animFrameId = requestAnimationFrame(tick)

      const dt = Math.min(now - lastTime, 50)
      lastTime = now

      const currentScrollY = window.scrollY
      const rawDelta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY

      for (const s of states) {
        if (s.el === physicsLockedTrinketRef.current) continue

        s.vy += (rawDelta - s.vy) * SPRING
        s.vy *= DAMPING
        if (s.vy > MAX_VELOCITY) s.vy = MAX_VELOCITY
        if (s.vy < -MAX_VELOCITY) s.vy = -MAX_VELOCITY
        s.offset += s.vy
        if (s.offset > MAX_OFFSET) s.offset = MAX_OFFSET
        if (s.offset < -MAX_OFFSET) s.offset = -MAX_OFFSET

        const absVy = Math.abs(s.vy)
        if (absVy > 0.5) {
          s.floatAmp = Math.min(FLOAT_MAX, s.floatAmp + absVy * FLOAT_BOOST)
        }
        s.floatAmp = Math.max(FLOAT_BASE, s.floatAmp * FLOAT_DECAY)
        s.floatPhase += s.floatFreq * dt

        const floatY = Math.sin(s.floatPhase) * s.floatAmp
        s.el.style.transform = `translateY(${s.offset + floatY}px) rotate(${s.rotateDeg})`
      }
    }

    animFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameId)
  }, [])

  // ── iMessage-style speech bubbles ──────────────────────────────────────────
  useEffect(() => {
    if (window.innerWidth < 600) return

    const trinkets = Array.from(
      document.querySelectorAll('.trinket-photo[data-bubble-text]')
    ) as HTMLElement[]
    if (!trinkets.length) return

    const audioCache = bubbleAudioCache.current
    let bubbleSoundAudio: HTMLAudioElement | null = null

    function buildAudioPlayer(trinket: HTMLElement): HTMLElement | null {
      const src = trinket.dataset.bubbleAudio
      if (!src) return null

      if (!audioCache.has(trinket)) {
        audioCache.set(trinket, new Audio(src))
      }
      const audio = audioCache.get(trinket)!

      const wrapper = document.createElement('div')
      wrapper.className = 'trinket-bubble-player'

      const btn = document.createElement('button')
      btn.className = 'trinket-bubble-play-btn'
      btn.type = 'button'
      btn.textContent = audio.paused ? '▶' : '⏸'

      const progressWrap = document.createElement('div')
      progressWrap.className = 'trinket-bubble-progress'
      const fill = document.createElement('div')
      fill.className = 'trinket-bubble-progress-fill'
      progressWrap.appendChild(fill)

      function syncFill() {
        if (audio.duration > 0) {
          fill.style.width = (audio.currentTime / audio.duration * 100) + '%'
        }
      }
      syncFill()

      let rafId: number | null = null
      function startProgress() {
        if (rafId !== null) cancelAnimationFrame(rafId)
        ;(function loop() {
          syncFill()
          if (!audio.paused) rafId = requestAnimationFrame(loop)
        })()
      }

      audio.addEventListener('ended', () => {
        if (btn.isConnected) btn.textContent = '▶'
        if (rafId !== null) cancelAnimationFrame(rafId)
        fill.style.width = '0%'
      })

      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (currentAudioRef.current && currentAudioRef.current !== audio) {
          currentAudioRef.current.pause()
        }
        if (audio.paused) {
          audio.play().catch(() => {})
          currentAudioRef.current = audio
          btn.textContent = '⏸'
          startProgress()
        } else {
          audio.pause()
          btn.textContent = '▶'
          if (rafId !== null) cancelAnimationFrame(rafId)
        }
      })

      if (!audio.paused) startProgress()

      wrapper.appendChild(btn)
      wrapper.appendChild(progressWrap)
      return wrapper
    }

    let activeBubble: HTMLElement | null = null
    let activeTrinket: HTMLElement | null = null
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    function buildBubble(trinket: HTMLElement): HTMLElement {
      const type = trinket.dataset.bubbleType || 'story'
      const text = trinket.dataset.bubbleText || ''
      const url = trinket.dataset.bubbleUrl || ''
      const isRightMargin = !!trinket.style.right

      const bubble = document.createElement('div')
      bubble.className = isRightMargin ? 'trinket-bubble trinket-bubble--right' : 'trinket-bubble'
      bubble.setAttribute('aria-hidden', 'true')

      const p = document.createElement('p')

      if (type === 'link' && url && url !== '#') {
        const linkText = trinket.dataset.bubbleLinkText || ''
        if (linkText && text.includes(linkText)) {
          const [before, after] = text.split(linkText)
          if (before) p.appendChild(document.createTextNode(before))
          const a = document.createElement('a')
          a.href = url
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.className = 'trinket-bubble-link'
          a.textContent = linkText
          p.appendChild(a)
          if (after) p.appendChild(document.createTextNode(after))
        } else {
          const a = document.createElement('a')
          a.href = url
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.className = 'trinket-bubble-link'
          a.textContent = text
          p.appendChild(a)
        }
      } else {
        p.textContent = text
      }

      bubble.appendChild(p)

      const player = buildAudioPlayer(trinket)
      if (player) bubble.appendChild(player)

      // iMessage-style curved tail
      const ns = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(ns, 'svg')
      svg.setAttribute('width', '18')
      svg.setAttribute('height', '14')
      svg.setAttribute('viewBox', '0 0 18 14')
      svg.setAttribute('aria-hidden', 'true')
      svg.classList.add('trinket-bubble-tail')

      const path = document.createElementNS(ns, 'path')
      if (isRightMargin) {
        path.setAttribute('d', 'M 18 0 L 0 0 C 6 1 2 6 0 14 C 4 12 12 8 18 0 Z')
        svg.style.left = '8px'
      } else {
        path.setAttribute('d', 'M 0 0 L 20 0 C 12 1 16 6 18 14 C 14 12 6 8 0 0 Z')
        svg.style.right = '8px'
      }
      path.setAttribute('fill', '#278EFF')
      svg.appendChild(path)
      bubble.appendChild(svg)

      return bubble
    }

    function hideBubble() {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
      physicsLockedTrinketRef.current = null
      if (activeBubble) { activeBubble.remove(); activeBubble = null }
      if (activeTrinket) { delete activeTrinket.dataset.bubbleOpen; activeTrinket = null }
    }

    function showBubble(trinket: HTMLElement) {
      hideBubble()

      if (!prefersReducedMotion) {
        if (!bubbleSoundAudio) bubbleSoundAudio = new Audio('/audios/message-bubbles.mp3')
        bubbleSoundAudio.currentTime = 0
        bubbleSoundAudio.play().catch(() => {})
      }

      const bubble = buildBubble(trinket)
      trinket.appendChild(bubble)

      bubble.addEventListener('mouseenter', () => {
        if (hideTimer) clearTimeout(hideTimer)
      })
      bubble.addEventListener('mouseleave', (e) => {
        if (trinket.contains(e.relatedTarget as Node)) return
        hideBubble()
      })

      // Double rAF so the browser paints the opacity:0 state first, then transitions
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bubble.classList.add('is-open')
      }))

      activeBubble = bubble
      activeTrinket = trinket
      physicsLockedTrinketRef.current = trinket
      trinket.dataset.bubbleOpen = '1'
    }

    function scheduleShow(trinket: HTMLElement) {
      if (hideTimer) clearTimeout(hideTimer)
      if (showTimer) clearTimeout(showTimer)
      showTimer = setTimeout(() => showBubble(trinket), 150)
    }

    function scheduleHide() {
      if (showTimer) clearTimeout(showTimer)
      hideTimer = setTimeout(() => hideBubble(), 300)
    }

    trinkets.forEach(trinket => {
      trinket.addEventListener('mouseenter', () => scheduleShow(trinket))
      trinket.addEventListener('mouseleave', (e) => {
        if (activeBubble && activeBubble.contains(e.relatedTarget as Node)) {
          if (showTimer) clearTimeout(showTimer)
          return
        }
        scheduleHide()
      })
    })

    return () => hideBubble()
  }, [])

  return (
    <div className="trinket-layer" aria-hidden="true">

      {/* trinket-1: near bio, left */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '140px', left: 'calc(50% - 500px)', width: '200px', transform: 'rotate(-20deg)' }}
        data-bubble-type="story"
        data-bubble-text="One of the most inspiring books I've ever read."
      >
        <img src="/assets/trinkets/trinket-1.png" alt="" loading="lazy" />
      </div>

      {/* trinket-2: near bio, right (with audio) */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '210px', right: 'calc(50% - 500px)', width: '200px', transform: 'rotate(25deg)' }}
        data-bubble-type="story"
        data-bubble-text="Top of my playlist right now"
        data-bubble-audio="/ComeDown-AndersonPaak.mp3"
      >
        <img src="/assets/trinkets/trinket-2.png" alt="" loading="lazy" />
      </div>

      {/* trinket-3: near projects, left */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '680px', left: 'calc(50% - 530px)', width: '150px', transform: 'rotate(30deg)' }}
        data-bubble-type="story"
        data-bubble-text="Space Impact high score on my first phone. Survived a 3-storey drop."
      >
        <img src="/assets/trinkets/trinket-3.png" alt="" loading="lazy" />
      </div>

      {/* trinket-4: near work, right */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '1000px', right: 'calc(50% - 500px)', width: '200px', transform: 'rotate(0deg)' }}
        data-bubble-type="story"
        data-bubble-text="The first time I saw a terminal. Chunky boi."
      >
        <img src="/assets/trinkets/trinket-4.png" alt="" loading="lazy" />
      </div>

      {/* trinket-5: left margin */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '1600px', left: 'calc(50% - 480px)', width: '160px', transform: 'rotate(-20deg)' }}
        data-bubble-type="story"
        data-bubble-text="I run on French vanilla, not black coffee."
      >
        <img src="/assets/trinkets/trinket-5.png" alt="" loading="lazy" />
      </div>

      {/* trinket-6: lower, right — Instagram link */}
      <div
        className="trinket trinket-photo trinket--margin"
        style={{ top: '2100px', right: 'calc(50% - 550px)', width: '230px', transform: 'rotate(10deg)' }}
        data-bubble-type="link"
        data-bubble-text="Find me on instagram @notmeiyo"
        data-bubble-link-text="@notmeiyo"
        data-bubble-url="https://www.instagram.com/notmeiyo/"
      >
        <img src="/assets/trinkets/trinket-6.png" alt="" loading="lazy" />
      </div>

    </div>
  )
}
