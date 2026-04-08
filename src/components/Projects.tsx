import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Projects() {
  const infoWrapRef = useRef<HTMLSpanElement>(null)
  const sshCmdRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const infoWrap = infoWrapRef.current
    const sshCmd = sshCmdRef.current
    if (!sshCmd) return

    const fullCmd = sshCmd.dataset.cmd ?? ''
    let typewriterTimer: ReturnType<typeof setInterval> | null = null

    // Pre-measure SSH text width with pretext so the tooltip doesn't reflow
    // as characters appear during the typeout.
    if (fullCmd) {
      try {
        const prepared = prepareWithSegments(fullCmd, '12px ui-monospace')
        const { lines } = layoutWithLines(prepared, 9999, 16)
        const lineWidth = lines?.[0]?.width ?? 0
        if (lineWidth > 0) {
          sshCmd.style.minWidth = Math.ceil(lineWidth) + 'px'
          sshCmd.style.display = 'inline-block'
        }
      } catch {
        // pretext failed (e.g. no canvas), skip min-width pre-lock
      }
    }

    // Clear static HTML text — element starts empty until tooltip is hovered
    sshCmd.textContent = ''

    function startTypewriter() {
      if (prefersReducedMotion) return
      if (typewriterTimer) clearInterval(typewriterTimer)
      sshCmd!.textContent = ''
      sshCmd!.classList.remove('typed')
      sshCmd!.classList.add('typing')
      let i = 0
      typewriterTimer = setInterval(() => {
        sshCmd!.textContent = fullCmd.slice(0, i + 1)
        i++
        if (i >= fullCmd.length) {
          clearInterval(typewriterTimer!)
          sshCmd!.classList.remove('typing')
          sshCmd!.classList.add('typed')
        }
      }, 35)
    }

    function resetTypewriter() {
      if (typewriterTimer) clearInterval(typewriterTimer)
      sshCmd!.textContent = fullCmd
      sshCmd!.classList.remove('typing', 'typed')
    }

    const onInfoWrapClick = (e: Event) => { e.stopPropagation(); e.preventDefault() }
    const onInfoWrapMouseEnter = () => setTimeout(startTypewriter, 160)
    const onInfoWrapMouseLeave = () => resetTypewriter()
    const onInfoWrapFocusIn = () => setTimeout(startTypewriter, 160)
    const onInfoWrapFocusOut = () => resetTypewriter()

    if (infoWrap) {
      infoWrap.addEventListener('click', onInfoWrapClick)
      infoWrap.addEventListener('mouseenter', onInfoWrapMouseEnter)
      infoWrap.addEventListener('mouseleave', onInfoWrapMouseLeave)
      infoWrap.addEventListener('focusin', onInfoWrapFocusIn)
      infoWrap.addEventListener('focusout', onInfoWrapFocusOut)
    }

    const onSshCmdClick = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(fullCmd).then(() => {
        if (typewriterTimer) clearInterval(typewriterTimer)
        sshCmd!.classList.remove('typing', 'typed')
        sshCmd!.textContent = 'copied!'
        sshCmd!.classList.add('copied')
        setTimeout(() => {
          sshCmd!.textContent = fullCmd
          sshCmd!.classList.remove('copied')
        }, 1500)
      })
    }

    sshCmd.addEventListener('click', onSshCmdClick)

    return () => {
      if (typewriterTimer) clearInterval(typewriterTimer)
      sshCmd.removeEventListener('click', onSshCmdClick)
      if (infoWrap) {
        infoWrap.removeEventListener('click', onInfoWrapClick)
        infoWrap.removeEventListener('mouseenter', onInfoWrapMouseEnter)
        infoWrap.removeEventListener('mouseleave', onInfoWrapMouseLeave)
        infoWrap.removeEventListener('focusin', onInfoWrapFocusIn)
        infoWrap.removeEventListener('focusout', onInfoWrapFocusOut)
      }
    }
  }, [])

  return (
    <section className="section section--projects" id="projects">
      <div className="column">
        <h2 className="section-heading">Projects</h2>

        <div className="project-list">

          <a href="https://github.com/meiyo99/ssh-portfolio" className="project" id="project-ssh-portfolio">
            <div className="project-thumb"><img src="/assets/icons/ssh.png" alt="" loading="lazy" /></div>
            <div className="project-body">
              <div className="project-meta">
                <span className="project-name">ssh-portfolio</span>
                <span className="info-wrap" ref={infoWrapRef}>
                  <button className="info-btn" type="button" aria-label="How to connect via SSH">ⓘ</button>
                  <span className="info-tooltip" role="tooltip">
                    type <code className="ssh-cmd" data-cmd="ssh ssh.meiyo.dev" ref={sshCmdRef}>ssh ssh.meiyo.dev</code> in your terminal
                  </span>
                </span>
              </div>
              <span className="project-desc">Interactive terminal portfolio accessible over SSH</span>
            </div>
          </a>

          <a href="https://github.com/meiyo99/ShortsBlock" className="project" id="project-shortsblock">
            <div className="project-thumb"><img src="/assets/icons/shortsblock.png" alt="" loading="lazy" /></div>
            <div className="project-body">
              <div className="project-meta">
                <span className="project-name">ShortsBlock</span>
              </div>
              <span className="project-desc">Chrome extension that kills youtube shorts at the network level</span>
            </div>
          </a>

          <a href="https://github.com/meiyo99" className="project" id="project-brickmmo">
            <div className="project-thumb"><img src="/assets/icons/brickmmo.png" alt="" loading="lazy" /></div>
            <div className="project-body">
              <div className="project-meta">
                <span className="project-name">BrickMMO Applications</span>
              </div>
              <span className="project-desc">Searchable explorer for 200+ repos with Chart.js</span>
            </div>
          </a>

          <a href="#" className="project" id="project-nuit-blanche">
            <div className="project-thumb"><img src="/assets/icons/nuit-blanche.png" alt="" loading="lazy" /></div>
            <div className="project-body">
              <div className="project-meta">
                <span className="project-name">Nuit Blanche</span>
              </div>
              <span className="project-desc">Route planner for Toronto's Nuit Blanche</span>
            </div>
          </a>

        </div>
      </div>
    </section>
  )
}
