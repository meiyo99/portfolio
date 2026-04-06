/* ═══════════════════════════════════════
   MAIN.JS — Interactions
   ═══════════════════════════════════════ */

import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Trinket layer height sync ────────────────────────────────────────────────
function syncTrinketLayer() {
  const layer = document.querySelector('.trinket-layer');
  if (!layer) return;
  layer.style.height = document.body.scrollHeight + 'px';
}

// ─── Trinket section anchoring ────────────────────────────────────────────────
// Each trinket's top is computed from its anchor section so placement stays
// correct even when content height changes (font loading, images, edits).
function positionTrinkets() {
  // Trinkets are display:none on mobile — nothing to do
  if (window.innerWidth < 600) return;

  const trinkets = Array.from(document.querySelectorAll('.trinket-photo'));
  if (!trinkets.length) return;

  // document-top of an element (accounts for current scroll position)
  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  const bio         = document.querySelector('#bio');
  const projects    = document.querySelector('#projects');
  const projectList = document.querySelector('#projects .project-list') ?? projects;
  const work        = document.querySelector('#work');
  const education   = document.querySelector('#education');
  const hobbies     = document.querySelector('#hobbies');

  // Anchor map (trinket index → top resolver)
  // DOM order in index.html: 0=bio-left, 1=bio-right, 2=projects-left,
  //                          3=projects-right, 4=work-right, 5=hobbies-left
  const resolvers = [
    // 0 — trinket-1: vertically centred with bio
    () => bio
      ? docTop(bio) + (bio.offsetHeight - trinkets[0].offsetHeight) / 2
      : null,

    // 1 — trinket-2: ~40px above projects heading
    () => projects ? docTop(projects) - 40 : null,

    // 2 — trinket-3: bottom edge of the projects list
    () => projectList
      ? docTop(projectList) + projectList.offsetHeight - trinkets[2].offsetHeight
      : null,

    // 3 — trinket-4: vertically centred with work
    () => work
      ? docTop(work) + (work.offsetHeight - trinkets[3].offsetHeight) / 2
      : null,

    // 4 — trinket-5: ~20px above education heading
    () => education ? docTop(education) - 20 : null,

    // 5 — trinket-6: vertically centred with hobbies
    () => hobbies
      ? docTop(hobbies) + (hobbies.offsetHeight - trinkets[5].offsetHeight) / 2
      : null,
  ];

  resolvers.forEach((resolve, i) => {
    if (!trinkets[i]) return;
    const top = resolve();
    if (top !== null) trinkets[i].style.top = `${top}px`;
  });
}

function syncAll() {
  syncTrinketLayer();
  positionTrinkets();
}

window.addEventListener('load', syncAll);
window.addEventListener('resize', syncAll);

const resizeObserver = new ResizeObserver(syncAll);
resizeObserver.observe(document.body);

// ─── Trinket scroll-inertia + independent float physics ──────────────────────
function initTrinketPhysics() {
  if (prefersReducedMotion) return;

  // ── Scroll inertia constants ──────────────────────────────────────────────
  const SPRING       = 0.10;   // How aggressively trinket vy chases scroll velocity
  const DAMPING      = 0.90;   // Velocity multiplier per frame — controls coast distance
  const MAX_VELOCITY = 24;     // px/frame cap — prevents teleporting on fast flings
  const MAX_OFFSET   = 200;    // px — max drift from originTop in either direction

  // ── Independent float constants ───────────────────────────────────────────
  const FLOAT_BASE   = 5;      // px — minimum bob amplitude (always-on gentle drift)
  const FLOAT_MAX    = 22;     // px — amplitude ceiling when actively scrolling
  const FLOAT_BOOST  = 0.50;   // how much scroll |vy| charges float amplitude
  const FLOAT_DECAY  = 0.998;  // amplitude multiplier per frame (~4s half-life at 60fps)

  const trinkets = Array.from(document.querySelectorAll('.trinket-photo'));
  if (!trinkets.length) return;

  // Per-trinket physics state — each element floats independently
  const states = trinkets.map(el => ({
    el,
    vy:         0,
    offset:     0,
    // Float layer: random phase so they never bob in sync; unique freq so motion looks organic
    floatPhase: Math.random() * Math.PI * 2,
    floatFreq:  0.00055 + Math.random() * 0.00045, // 0.00055–0.001 rad/ms → 6–11s period
    floatAmp:   FLOAT_BASE,
  }));

  let lastScrollY = window.scrollY;
  let lastTime    = performance.now();

  function tick(now) {
    requestAnimationFrame(tick); // always-running loop — float continues without scroll

    const dt = Math.min(now - lastTime, 50); // clamp for background-tab pauses
    lastTime = now;

    const currentScrollY = window.scrollY;
    const rawDelta       = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    for (const s of states) {
      // ── Scroll inertia ──────────────────────────────────────────────────
      s.vy += (rawDelta - s.vy) * SPRING;
      s.vy *= DAMPING;
      if (s.vy >  MAX_VELOCITY) s.vy =  MAX_VELOCITY;
      if (s.vy < -MAX_VELOCITY) s.vy = -MAX_VELOCITY;
      s.offset += s.vy;
      if (s.offset >  MAX_OFFSET) s.offset =  MAX_OFFSET;
      if (s.offset < -MAX_OFFSET) s.offset = -MAX_OFFSET;

      // ── Independent float ───────────────────────────────────────────────
      // Scroll charges float amplitude; it decays slowly back toward baseline
      const absVy = Math.abs(s.vy);
      if (absVy > 0.5) {
        s.floatAmp = Math.min(FLOAT_MAX, s.floatAmp + absVy * FLOAT_BOOST);
      }
      s.floatAmp    = Math.max(FLOAT_BASE, s.floatAmp * FLOAT_DECAY);
      s.floatPhase += s.floatFreq * dt;

      const floatY = Math.sin(s.floatPhase) * s.floatAmp;

      // Scroll displacement + float layer — img hover scale is on the child <img>, unaffected
      s.el.style.transform = `translateY(${s.offset + floatY}px)`;
    }
  }

  requestAnimationFrame(tick);
}

initTrinketPhysics();

// ─── SSH typewriter ───────────────────────────────────────────────────────────
const infoWrap = document.querySelector('.info-wrap');
const sshCmd = document.querySelector('.ssh-cmd');

if (sshCmd) {
  const fullCmd = sshCmd.dataset.cmd ?? '';
  let typewriterTimer = null;

  // Pre-measure SSH text width with pretext so the tooltip doesn't reflow
  // as characters appear during the typeout.
  if (fullCmd) {
    try {
      const prepared = prepareWithSegments(fullCmd, '12px ui-monospace');
      const { lines } = layoutWithLines(prepared, 9999, 16);
      const lineWidth = lines?.[0]?.width ?? 0;
      if (lineWidth > 0) {
        sshCmd.style.minWidth = Math.ceil(lineWidth) + 'px';
        sshCmd.style.display = 'inline-block';
      }
    } catch {
      // pretext failed (e.g. no canvas), skip min-width pre-lock
    }
  }

  // Clear the static HTML text so the element starts empty until tooltip is hovered
  sshCmd.textContent = '';

  function startTypewriter() {
    if (prefersReducedMotion) return;
    clearInterval(typewriterTimer);
    sshCmd.textContent = '';
    sshCmd.classList.remove('typed');
    sshCmd.classList.add('typing');
    let i = 0;
    typewriterTimer = setInterval(() => {
      sshCmd.textContent = fullCmd.slice(0, i + 1);
      i++;
      if (i >= fullCmd.length) {
        clearInterval(typewriterTimer);
        sshCmd.classList.remove('typing');
        sshCmd.classList.add('typed');
      }
    }, 35);
  }

  function resetTypewriter() {
    clearInterval(typewriterTimer);
    sshCmd.textContent = fullCmd;
    sshCmd.classList.remove('typing', 'typed');
  }

  if (infoWrap) {
    // Prevent the parent <a> from navigating when interacting with the tooltip
    infoWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    // Delay typewriter start slightly so the tooltip fade-in completes first
    infoWrap.addEventListener('mouseenter', () => setTimeout(startTypewriter, 160));
    infoWrap.addEventListener('mouseleave', resetTypewriter);
    infoWrap.addEventListener('focusin', () => setTimeout(startTypewriter, 160));
    infoWrap.addEventListener('focusout', resetTypewriter);
  }

  // Click-to-copy — works whether typing is in progress or completed
  sshCmd.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(fullCmd).then(() => {
      clearInterval(typewriterTimer);
      sshCmd.classList.remove('typing', 'typed');
      sshCmd.textContent = 'copied!';
      sshCmd.classList.add('copied');
      setTimeout(() => {
        sshCmd.textContent = fullCmd;
        sshCmd.classList.remove('copied');
      }, 1500);
    });
  });
}

