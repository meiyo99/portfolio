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

  const bio = document.querySelector('#bio');
  const projects = document.querySelector('#projects');
  const projectList = document.querySelector('#projects .project-list') ?? projects;
  const work = document.querySelector('#work');
  const hobbies = document.querySelector('#hobbies');

  // Anchor map (trinket index → top resolver)
  // DOM order in index.html: 0=bio-left, 1=bio-right, 2=projects-left,
  //                          3=projects-right, 4=work-right, 5=hobbies-left
  const resolvers = [
    // 0 — trinket-1: vertically centred with bio
    () => bio
      ? docTop(bio) + (bio.offsetHeight - trinkets[0].offsetHeight) / 2 + 130
      : null,

    // 1 — trinket-2: ~40px above projects heading
    () => projects ? docTop(projects) + 180 : null,

    // 2 — trinket-3: bottom edge of the projects list
    () => projectList
      ? docTop(projectList) + projectList.offsetHeight - trinkets[2].offsetHeight + 300
      : null,

    // 3 — trinket-4: vertically centred with work
    () => work
      ? docTop(work) + (work.offsetHeight - trinkets[3].offsetHeight) / 2 + 300
      : null,

    // 4 — trinket-5: ~20px above volunteering heading (education removed)
    () => null,

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
  const SPRING = 0.10;   // How aggressively trinket vy chases scroll velocity
  const DAMPING = 0.90;   // Velocity multiplier per frame — controls coast distance
  const MAX_VELOCITY = 24;     // px/frame cap — prevents teleporting on fast flings
  const MAX_OFFSET = 200;    // px — max drift from originTop in either direction

  // ── Independent float constants ───────────────────────────────────────────
  const FLOAT_BASE = 5;      // px — minimum bob amplitude (always-on gentle drift)
  const FLOAT_MAX = 22;     // px — amplitude ceiling when actively scrolling
  const FLOAT_BOOST = 0.50;   // how much scroll |vy| charges float amplitude
  const FLOAT_DECAY = 0.998;  // amplitude multiplier per frame (~4s half-life at 60fps)

  const trinkets = Array.from(document.querySelectorAll('.trinket-photo'));
  if (!trinkets.length) return;

  // Per-trinket physics state — each element floats independently
  const states = trinkets.map(el => {
    // Capture inline rotation so the physics loop can preserve it
    const rotateMatch = el.style.transform?.match(/rotate\(([^)]+)\)/);
    const rotateDeg = rotateMatch ? rotateMatch[1] : '0deg';
    return {
      el,
      rotateDeg,
      vy: 0,
      offset: 0,
      // Float layer: random phase so they never bob in sync; unique freq so motion looks organic
      floatPhase: Math.random() * Math.PI * 2,
      floatFreq: 0.00055 + Math.random() * 0.00045, // 0.00055–0.001 rad/ms → 6–11s period
      floatAmp: FLOAT_BASE,
    };
  });

  let lastScrollY = window.scrollY;
  let lastTime = performance.now();

  function tick(now) {
    requestAnimationFrame(tick); // always-running loop — float continues without scroll

    const dt = Math.min(now - lastTime, 50); // clamp for background-tab pauses
    lastTime = now;

    const currentScrollY = window.scrollY;
    const rawDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    for (const s of states) {
      // ── Scroll inertia ──────────────────────────────────────────────────
      s.vy += (rawDelta - s.vy) * SPRING;
      s.vy *= DAMPING;
      if (s.vy > MAX_VELOCITY) s.vy = MAX_VELOCITY;
      if (s.vy < -MAX_VELOCITY) s.vy = -MAX_VELOCITY;
      s.offset += s.vy;
      if (s.offset > MAX_OFFSET) s.offset = MAX_OFFSET;
      if (s.offset < -MAX_OFFSET) s.offset = -MAX_OFFSET;

      // ── Independent float ───────────────────────────────────────────────
      // Scroll charges float amplitude; it decays slowly back toward baseline
      const absVy = Math.abs(s.vy);
      if (absVy > 0.5) {
        s.floatAmp = Math.min(FLOAT_MAX, s.floatAmp + absVy * FLOAT_BOOST);
      }
      s.floatAmp = Math.max(FLOAT_BASE, s.floatAmp * FLOAT_DECAY);
      s.floatPhase += s.floatFreq * dt;

      const floatY = Math.sin(s.floatPhase) * s.floatAmp;

      // Scroll displacement + float layer — img hover scale is on the child <img>, unaffected
      // Compose translateY with the original inline rotation so it's never clobbered
      s.el.style.transform = `translateY(${s.offset + floatY}px) rotate(${s.rotateDeg})`;
    }
  }

  requestAnimationFrame(tick);
}

initTrinketPhysics();

// ─── Trinket speech bubbles ───────────────────────────────────────────────────

// Single shared audio ref so only one trinket plays at a time
let currentAudio = null;

function buildAudioPlayer(trinket) {
  const src = trinket.dataset.bubbleAudio;
  if (!src) return null;

  // Persist Audio on the trinket so it survives bubble close/reopen
  if (!trinket._bubbleAudio) {
    trinket._bubbleAudio = new Audio(src);
  }
  const audio = trinket._bubbleAudio;

  const wrapper = document.createElement('div');
  wrapper.className = 'trinket-bubble-player';

  const btn = document.createElement('button');
  btn.className = 'trinket-bubble-play-btn';
  btn.type = 'button';
  btn.textContent = audio.paused ? '▶' : '⏸';

  const progressWrap = document.createElement('div');
  progressWrap.className = 'trinket-bubble-progress';
  const fill = document.createElement('div');
  fill.className = 'trinket-bubble-progress-fill';
  progressWrap.appendChild(fill);

  function syncFill() {
    if (audio.duration > 0) {
      fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    }
  }
  syncFill();

  let rafId = null;
  function startProgress() {
    cancelAnimationFrame(rafId);
    (function loop() { syncFill(); if (!audio.paused) rafId = requestAnimationFrame(loop); })();
  }

  audio.addEventListener('ended', () => {
    if (btn.isConnected) btn.textContent = '▶';
    cancelAnimationFrame(rafId);
    fill.style.width = '0%';
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentAudio && currentAudio !== audio) currentAudio.pause();
    if (audio.paused) {
      audio.play().catch(() => {});
      currentAudio = audio;
      btn.textContent = '⏸';
      startProgress();
    } else {
      audio.pause();
      btn.textContent = '▶';
      cancelAnimationFrame(rafId);
    }
  });

  if (!audio.paused) startProgress();

  wrapper.appendChild(btn);
  wrapper.appendChild(progressWrap);
  return wrapper;
}

function initTrinketBubbles() {
  // Trinkets are hidden on mobile — nothing to do
  if (window.innerWidth < 600) return;

  const trinkets = Array.from(
    document.querySelectorAll('.trinket-photo[data-bubble-text]')
  );
  if (!trinkets.length) return;

  let activeBubble = null;
  let activeTrinket = null;
  let showTimer = null; // 150ms show-delay — avoids accidental triggers while scrolling
  let hideTimer = null; // grace period so cursor can travel trinket → bubble

  function buildBubble(trinket) {
    const type = trinket.dataset.bubbleType || 'story';
    const text = trinket.dataset.bubbleText || '';
    const url = trinket.dataset.bubbleUrl || '';

    // Detect margin side — right-margin trinkets have style.right set
    const isRightMargin = !!trinket.style.right;

    const bubble = document.createElement('div');
    bubble.className = isRightMargin ? 'trinket-bubble trinket-bubble--right' : 'trinket-bubble';
    bubble.setAttribute('aria-hidden', 'true');

    const p = document.createElement('p');

    if (type === 'link' && url && url !== '#') {
      const linkText = trinket.dataset.bubbleLinkText || '';
      if (linkText && text.includes(linkText)) {
        // Partial inline link — only the linkText portion is hyperlinked
        const [before, after] = text.split(linkText);
        if (before) p.appendChild(document.createTextNode(before));
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'trinket-bubble-link';
        a.textContent = linkText;
        p.appendChild(a);
        if (after) p.appendChild(document.createTextNode(after));
      } else {
        // Whole text is the link
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'trinket-bubble-link';
        a.textContent = text;
        p.appendChild(a);
      }
    } else {
      p.textContent = text;
    }

    bubble.appendChild(p);

    // Audio player (playlist trinket)
    const player = buildAudioPlayer(trinket);
    if (player) bubble.appendChild(player);

    // iMessage-style organic curved tail — wide-base swoosh matching reference shape
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 18 14');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('trinket-bubble-tail');

    const path = document.createElementNS(ns, 'path');
    if (isRightMargin) {
      // Left-pointing tail at bottom-left — base on right, tip extends left beyond bubble
      path.setAttribute('d', 'M 18 0 L 0 0 C 6 1 2 6 0 14 C 4 12 12 8 18 0 Z');
      svg.style.left = '8px';
    } else {
      // Right-pointing tail at bottom-right — base on left, tip extends right beyond bubble
      path.setAttribute('d', 'M 0 0 L 20 0 C 12 1 16 6 18 14 C 14 12 6 8 0 0 Z');
      svg.style.right = '8px';
    }
    path.setAttribute('fill', '#278EFF');
    svg.appendChild(path);
    bubble.appendChild(svg);

    return bubble;
  }

  function hideBubble() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (activeBubble) { activeBubble.remove(); activeBubble = null; }
    if (activeTrinket) { delete activeTrinket.dataset.bubbleOpen; activeTrinket = null; }
  }

  function showBubble(trinket) {
    hideBubble(); // close any existing bubble first

    const bubble = buildBubble(trinket);
    trinket.appendChild(bubble);

    // Cursor bridge: cancel the hide timer if the cursor reaches the bubble,
    // and dismiss when the cursor leaves the bubble itself.
    bubble.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    bubble.addEventListener('mouseleave', (e) => {
      // If cursor returns to the trinket, don't close
      if (trinket.contains(e.relatedTarget)) return;
      hideBubble();
    });

    // Double rAF so the browser paints the opacity:0 state first, then transitions
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bubble.classList.add('is-open');
    }));

    activeBubble = bubble;
    activeTrinket = trinket;
    trinket.dataset.bubbleOpen = '1';
  }

  function scheduleShow(trinket) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => showBubble(trinket), 150);
  }

  function scheduleHide() {
    clearTimeout(showTimer);
    // Short grace window lets the cursor travel the gap between trinket and bubble
    // before the bubble disappears; bubble's mouseenter will cancel if reached in time.
    hideTimer = setTimeout(() => hideBubble(), 300);
  }

  trinkets.forEach(trinket => {
    trinket.addEventListener('mouseenter', () => scheduleShow(trinket));
    trinket.addEventListener('mouseleave', (e) => {
      // If cursor moves directly into the active bubble, don't trigger a hide
      if (activeBubble && activeBubble.contains(e.relatedTarget)) {
        clearTimeout(showTimer);
        return;
      }
      scheduleHide();
    });
  });

}

initTrinketBubbles();

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

