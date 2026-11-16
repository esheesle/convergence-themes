// Convergence Themed website: copy buttons on code blocks, the AI prompt builder and the reference search.
(function () {
  async function copy(text, fallbackEl) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
    if (!ok && fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    return ok;
  }

  // Copy buttons on every code block.
  document.querySelectorAll('pre > code').forEach(code => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      btn.textContent = (await copy(code.textContent, code)) ? 'Copied' : 'Press Ctrl+C';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
    code.parentElement.appendChild(btn);
  });

  // AI prompt builder.
  const data = document.getElementById('prompt-data');
  if (data) {
    const { rules, tasks } = JSON.parse(data.textContent);
    const sel = document.getElementById('task'), inc = document.getElementById('rules'),
          out = document.getElementById('out'), status = document.getElementById('status');
    tasks.forEach((t, i) => { const o = document.createElement('option'); o.value = i; o.textContent = t.label; sel.appendChild(o); });
    const build = () => { out.value = (inc.checked ? rules + '\n\n' : '') + tasks[sel.value].text; status.textContent = ''; };
    sel.addEventListener('change', () => { inc.checked = tasks[sel.value].rules; build(); });
    inc.addEventListener('change', build);
    document.getElementById('reset').addEventListener('click', build);
    document.getElementById('copy').addEventListener('click', async () => {
      const left = (out.value.match(/<[^<>\n]{2,80}>/g) || []).length;
      const ok = await copy(out.value, null);
      if (!ok) { out.focus(); out.select(); }
      status.textContent = ok
        ? 'Copied.' + (left ? ` ${left} <placeholder>${left > 1 ? 's are' : ' is'} still unfilled.` : '')
        : 'Text selected. Press Ctrl+C (or long-press and Copy).';
    });
    const pre = new URLSearchParams(location.search).get('task');
    if (pre && tasks[pre]) sel.value = pre;
    inc.checked = tasks[sel.value].rules; build();
  }

  // Reference search: filters factions and unit rows, opens matching factions.
  const search = document.getElementById('ref-search');
  if (search) {
    const blocks = [...document.querySelectorAll('details.ref')];
    const count = document.getElementById('ref-count');
    const run = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      blocks.forEach(b => {
        const rows = [...b.querySelectorAll('tbody tr')];
        if (!q) { b.hidden = false; b.open = false; rows.forEach(r => { r.hidden = false; }); shown++; return; }
        const headHit = b.querySelector('summary').textContent.toLowerCase().includes(q) ||
                        [...b.querySelectorAll('.kv')].some(k => k.textContent.toLowerCase().includes(q));
        let rowHits = 0;
        rows.forEach(r => { const hit = r.textContent.toLowerCase().includes(q); r.hidden = !(hit || headHit); if (hit) rowHits++; });
        const any = headHit || rowHits > 0;
        b.hidden = !any; b.open = any; if (any) shown++;
      });
      count.textContent = q ? `${shown} of ${blocks.length} factions match` : '';
    };
    search.addEventListener('input', run);
    document.getElementById('ref-expand').addEventListener('click', () => blocks.forEach(b => { if (!b.hidden) b.open = true; }));
    document.getElementById('ref-collapse').addEventListener('click', () => blocks.forEach(b => { b.open = false; }));
  }
})();
