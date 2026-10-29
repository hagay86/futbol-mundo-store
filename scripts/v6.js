// =====================================================================
// FUTBOL MUNDO v6 — Mundo Credits currency sign (Ɱ) rendered as a gold coin.
// Any text containing Ɱ anywhere on the page is turned into the coin mark.
// =====================================================================
const MC_SIGN = 'Ɱ';
(function mundoCredits(){
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|INPUT|TITLE|NOSCRIPT)$/;
  function wrap(node){
    if (node.nodeType !== 3 || !node.nodeValue.includes(MC_SIGN)) return;
    const p = node.parentNode; if (!p || SKIP.test(p.nodeName) || (p.classList && p.classList.contains('mc'))) return;
    const parts = node.nodeValue.split(MC_SIGN), frag = document.createDocumentFragment();
    parts.forEach((t, i) => {
      if (t) frag.appendChild(document.createTextNode(t));
      if (i < parts.length - 1) { const s = document.createElement('span'); s.className = 'mc'; s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'Mundo Credits'); s.textContent = MC_SIGN; frag.appendChild(s); }
    });
    p.replaceChild(frag, node);
  }
  function scan(root){
    if (root.nodeType === 3) return wrap(root);
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n => n.nodeValue.includes(MC_SIGN) ? 1 : 3});
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(wrap);
  }
  scan(document.body);
  new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') wrap(m.target); else m.addedNodes.forEach(scan); }))
    .observe(document.body, {childList:true, subtree:true, characterData:true});
})();
