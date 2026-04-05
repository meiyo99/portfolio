/* ═══════════════════════════════════════
   MAIN.JS — Minimal interactions only
   No frameworks. No libraries.
   ═══════════════════════════════════════ */

/**
 * Adjust trinket positions based on actual page height.
 * Since trinkets use absolute positioning, we need the
 * trinket layer to span the full document height.
 */
function syncTrinketLayer() {
  const layer = document.querySelector('.trinket-layer');
  if (!layer) return;
  layer.style.height = document.body.scrollHeight + 'px';
}

// Run on load and resize
window.addEventListener('load', syncTrinketLayer);
window.addEventListener('resize', syncTrinketLayer);

// Observe DOM changes (e.g., image lazy-loading can change height)
const resizeObserver = new ResizeObserver(syncTrinketLayer);
resizeObserver.observe(document.body);

// Info tooltip — prevent the parent <a> from navigating when interacting with the tooltip
const infoWrap = document.querySelector('.info-wrap');
if (infoWrap) {
  infoWrap.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
}

// SSH command — click to copy
const sshCmd = document.querySelector('.ssh-cmd');
if (sshCmd) {
  sshCmd.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(sshCmd.dataset.cmd).then(() => {
      const original = sshCmd.textContent;
      sshCmd.textContent = 'copied!';
      sshCmd.classList.add('copied');
      setTimeout(() => {
        sshCmd.textContent = original;
        sshCmd.classList.remove('copied');
      }, 1500);
    });
  });
}
