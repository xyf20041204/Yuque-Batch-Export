// ==UserScript==
// @name         ????????
// @namespace    https://www.yuque.com
// @version      2.2.0
// @description  ?????????????? Markdown / Lake / PDF / Word / JPG ??
// @author       yuque-export-extension
// @match        https://www.yuque.com/*
// @grant        GM_download
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @connect      yuque.com
// @connect      self
// @resource     icon128 https://www.yuque.com/favicon.ico
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const iconUrl = 'data:image/png;base64,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';

  // ============================================================
  // 1. Cookie / ?? ??
  // ============================================================
  function getCookieHeader() { return document.cookie; }

  function downloadFile(blobOrUrl, filename, isBlob) {
    return new Promise((resolve) => {
      if (isBlob) {
        const url = URL.createObjectURL(blobOrUrl);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
        resolve();
      } else {
        try {
          if (typeof GM_download !== 'undefined') { GM_download({ url: blobOrUrl, name: filename, saveAs: false }); resolve(); }
          else { const a = document.createElement('a'); a.href = blobOrUrl; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); resolve(); }
        } catch (e) { const a = document.createElement('a'); a.href = blobOrUrl; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); resolve(); }
      }
    });
  }

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function sanitizeFilename(name) { return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_'); }

  // ============================================================
  // 2. ????
  // ============================================================
  async function fetchTocData(username, bookSlug) {
    const response = await fetch('https://www.yuque.com/' + username + '/' + bookSlug, { headers: { 'accept': 'text/html' } });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/window\.appData\s*=\s*JSON\.parse\(decodeURIComponent\("(.*?)"\)\)/);
    if (!match) return null;
    const appData = JSON.parse(decodeURIComponent(match[1]));
    return appData.book?.toc || null;
  }

  async function fetchBookOwnerMap() {
    const response = await fetch('https://www.yuque.com/api/mine/book_stacks', { headers: { 'accept': 'application/json' } });
    if (!response.ok) return {};
    const data = await response.json();
    const map = {};
    for (const stack of data.data || []) for (const book of stack.books || []) if (book.user?.login) map[book.id] = book.user.login;
    return map;
  }

  function buildUuidMap(items) { const m = {}; for (const i of items) if (i.uuid) m[i.uuid] = i; return m; }
  function getItemPath(uuid, uuidMap) { const p = []; let c = uuidMap[uuid]; while (c && c.parent_uuid) { const parent = uuidMap[c.parent_uuid]; if (parent && parent.type === 'TITLE') p.unshift(sanitizeFilename(parent.title)); c = parent; } return p.join('/'); }
  function buildDocPathMap(items) { const uuidMap = buildUuidMap(items); const dm = {}; for (const i of items) if (i.type === 'DOC' && i.doc_id) { dm[i.doc_id] = { slug: i.url, title: i.title, path: getItemPath(i.uuid, uuidMap) }; } return dm; }

  async function mapWithConcurrency(items, limit, worker, gapMs) {
    const results = new Array(items.length); limit = Math.max(1, limit); const batchCount = Math.ceil(items.length / limit);
    for (let b = 0; b < batchCount; b++) {
      const start = b * limit; const end = Math.min(start + limit, items.length);
      await Promise.all(Array.from({ length: end - start }, (_, k) => {
        const idx = start + k;
        return Promise.resolve(worker(items[idx], idx)).then(r => { results[idx] = r; }).catch(() => { results[idx] = false; });
      }));
      if (gapMs > 0 && b < batchCount - 1) await sleep(gapMs);
    }
    return results;
  }

  async function downloadSingleDoc(doc, ctx) {
    const { currentBook, docPathMap, username, options, progress: progressCtx } = ctx;
    const tocInfo = docPathMap[doc.id];
    try {
      console.log('[us] downloadSingleDoc START doc:', doc.title, 'id:', doc.id, 'format:', options.format);
      const format = options.format || 'markdown';
      const fileExt = (format === 'lake') ? '.lake' : (format === 'markdown') ? '.md' : '.' + format;
      let filePath = sanitizeFilename(currentBook.name);
      if (tocInfo?.path) filePath += '/' + tocInfo.path;
      filePath += '/' + sanitizeFilename(doc.title || 'Untitled') + fileExt;
      const exportPayload = { type: format, force: 0 };
      if (format === 'pdf' && options.toc) exportPayload.options = JSON.stringify({ enableToc: 1 });
      if (format === 'markdown' || format === 'lake') {
        exportPayload.options = JSON.stringify({
          attachment: true,
          latexcode: options.latexcode || false,
          anchor: options.anchor || false,
          linebreak: options.linebreak || false,
          useMdai: options.useMdai !== false,
        });
      }
      let exportResult = null;
      for (let retry = 0; retry < 3; retry++) {
        console.log('[us] export API try', retry + 1, 'for:', doc.title);
        const r = await fetch('https://www.yuque.com/api/docs/' + doc.id + '/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'referer': 'https://www.yuque.com/' + username + '/' + currentBook.slug },
          body: JSON.stringify(exportPayload),
        });
        if (!r.ok) {
          console.log('[us] export API FAILED, status:', r.status);
          if (retry < 2) await sleep(3000);
          continue;
        }
        const d = await r.json();
        console.log('[us] export API state:', d?.data?.state);
        if (d.data?.state === 'success') { exportResult = d.data; break; }
        await sleep(3000);
      }
      if (!exportResult?.url) throw new Error('Export API never returned success after 3 retries');
      let dUrl = exportResult.url;
      if (dUrl.startsWith('/')) dUrl = 'https://www.yuque.com' + dUrl;
      const fileResponse = await fetch(dUrl);
      if (!fileResponse.ok) throw new Error('Download failed: HTTP ' + fileResponse.status);
      const blob = await fileResponse.blob();
      console.log('[us] file blob size:', blob.size, 'type:', blob.type);
      if (blob.size === 0) throw new Error('Downloaded file is empty (0 bytes)');
      await downloadFile(blob, filePath.replace(/[<>:"|?*]/g, '_'), true);
      progressCtx.finished++;
      sendProgress({ bookName: progressCtx.bookName, current: progressCtx.finished, total: progressCtx.total, bookIndex: progressCtx.bookIndex, bookTotal: progressCtx.bookTotal, filename: doc.title });
      return true;
    } catch (error) {
      console.error('[us] downloadSingleDoc FAILED for:', doc.title, 'error:', error.message);
      progressCtx.finished++;
      sendProgress({ bookName: progressCtx.bookName, current: progressCtx.finished, total: progressCtx.total, bookIndex: progressCtx.bookIndex, bookTotal: progressCtx.bookTotal, filename: doc.title + ' (FAILED: ' + error.message + ')' });
      return false;
    }
  }

  async function handleBatchExport(bookList, options) {
    try {
      console.log('[us] handleBatchExport START, books:', bookList.length, 'format:', options.format);
if (!document.cookie) throw new Error('未登录语雀，请先登录');
      const ownerMap = await fetchBookOwnerMap();
      const concurrency = Math.max(1, Number(options.concurrency) || 2);
      let totalCount = 0, totalSuccess = 0;
      for (let bi = 0; bi < bookList.length; bi++) {
        const currentBook = bookList[bi];
        const username = ownerMap[currentBook.id] || null;
        if (!username) continue;
        const tocItems = await fetchTocData(username, currentBook.slug);
        const docPathMap = tocItems ? buildDocPathMap(tocItems) : {};
        const docsResponse = await fetch('https://www.yuque.com/api/docs?book_id=' + currentBook.id, { headers: { 'accept': 'application/json' } });
        if (!docsResponse.ok) continue;
        const docsData = await docsResponse.json();
        const docs = docsData.data || [];
        if (docs.length === 0) continue;
        totalCount += docs.length;
        const progressCtx = { finished: 0, total: docs.length, bookName: currentBook.name, bookIndex: bi + 1, bookTotal: bookList.length };
        const results = await mapWithConcurrency(docs, concurrency, (doc) => downloadSingleDoc(doc, { currentBook, docPathMap, username, options, progress: progressCtx }), 1000);
        const successCount = results.filter(Boolean).length;
        totalSuccess += successCount;
        sendProgress({ bookName: currentBook.name, current: docs.length, total: docs.length, bookIndex: bi + 1, bookTotal: bookList.length, filename: currentBook.name + ' ??', bookDone: true, successCount: successCount });
      }
      sendProgress({ current: totalCount, total: totalCount, filename: '????', done: true, successCount: totalSuccess });
      return { success: true, count: totalSuccess };
    } catch (error) { sendProgress({ error: error.message, done: true }); return { success: false, error: error.message }; }
  }

  // ============================================================
  // 3. UI ?
  // ============================================================
  if (window.__yuqueExportUI) return;
  window.__yuqueExportUI = true;

  const progressListeners = [];
  function sendProgress(data) { progressListeners.forEach(fn => fn(data)); }

  const style = document.createElement('style');
  style.textContent = '#yuque-export-panel{position:fixed;top:120px;right:20px;width:320px;max-height:80vh;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e5e7eb;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#374151;overflow:hidden;transition:width .25s,max-height .25s,border-radius .25s,box-shadow .25s}#yuque-export-panel.collapsed{width:40px;max-height:40px;border-radius:20px;cursor:pointer}#yuque-export-panel.collapsed:hover{box-shadow:0 4px 16px rgba(0,0,0,0.12)}#yuque-export-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f3f4f6;cursor:move;user-select:none}#yuque-export-header-title{display:flex;align-items:center;gap:8px}#yuque-export-header-title img{width:18px;height:18px;border-radius:4px}#yuque-export-header h3{margin:0;font-size:13px;font-weight:500;color:#111827}#yuque-export-header button{background:none;border:none;color:#9ca3af;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}#yuque-export-header button:hover{background:#f3f4f6;color:#374151}#yuque-export-body{padding:14px;max-height:calc(80vh - 41px);overflow-y:auto}.ye-label{display:block;font-size:11px;color:#9ca3af;margin-bottom:6px;font-weight:500}.ye-btn{width:100%;padding:8px 16px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500}.ye-btn:hover{background:#1f2937}.ye-btn:disabled{background:#f3f4f6;color:#d1d5db;cursor:not-allowed}.ye-btn-secondary{background:#fff;color:#374151;border:1px solid #e5e7eb}.ye-btn-secondary:hover{background:#f9fafb;border-color:#d1d5db}.ye-section{margin-bottom:14px}.ye-book-list{max-height:180px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;margin-top:8px}.ye-book-item{padding:8px 12px;border-bottom:1px solid #f3f4f6;cursor:pointer;display:flex;align-items:center;gap:8px}.ye-book-item:hover{background:#f9fafb}.ye-book-item:last-child{border-bottom:none}.ye-book-checkbox{flex-shrink:0;margin:0}.ye-book-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ye-book-count{font-size:11px;color:#9ca3af;flex-shrink:0}.ye-select-all{font-size:12px;color:#374151;cursor:pointer;display:flex;align-items:center;gap:4px;margin-bottom:6px}.ye-hint{font-size:11px;color:#9ca3af;margin-top:6px}.ye-options{display:flex;flex-wrap:wrap;gap:6px}.ye-option{display:flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;cursor:pointer}.ye-option input{margin:0;accent-color:#111827}.ye-rate-limit{display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280}.ye-rate-limit select{flex:1;padding:4px 6px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151;background:#fff;cursor:pointer}.ye-rate-limit select:focus{outline:none;border-color:#111827}.ye-progress{margin-top:12px;display:none}.ye-progress.active{display:block}.ye-progress-track{height:3px;background:#f3f4f6;border-radius:2px;overflow:hidden}.ye-progress-fill{height:100%;background:#111827;width:0%;transition:width .3s;border-radius:2px}.ye-progress-text{font-size:11px;color:#9ca3af;margin-top:6px;text-align:center}.ye-status{margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;display:none}.ye-status.success{background:#f0fdf4;color:#15803d}.ye-status.error{background:#fef2f2;color:#dc2626}.ye-status.info{background:#f9fafb;color:#6b7280}#yuque-export-icon{width:40px;height:40px;display:none;align-items:center;justify-content:center;background:#fff;border-radius:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1)}#yuque-export-icon img{width:42px;height:42px;border-radius:4px}#yuque-export-panel.collapsed #yuque-export-body,#yuque-export-panel.collapsed #yuque-export-header{display:none}#yuque-export-panel.collapsed #yuque-export-icon{display:flex}';
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'yuque-export-panel';
  panel.innerHTML = '<div id="yuque-export-icon"><img src="' + iconUrl + '" alt="logo"></div><div id="yuque-export-header"><div id="yuque-export-header-title"><img src="' + iconUrl + '" alt="logo"><h3>????????</h3></div><div><button id="ye-collapse-btn" title="??">?</button></div></div><div id="yuque-export-body"><div class="ye-section"><label class="ye-label">?????</label><button id="ye-refresh-btn" class="ye-btn ye-btn-secondary" style="margin-bottom:8px;">&#128260; ?????</button><label class="ye-select-all" style="display:none;"><input type="checkbox" id="ye-select-all"> ??</label><div id="ye-book-list" class="ye-book-list"><div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">???????????</div></div><div id="ye-selected-hint" class="ye-hint">??????</div></div><div class="ye-section"><label class="ye-label">????</label><div class="ye-options"><label class="ye-option"><input type="radio" name="ye-format" value="markdown" checked> Markdown</label><label class="ye-option"><input type="radio" name="ye-format" value="lake"> Lake</label><label class="ye-option"><input type="radio" name="ye-format" value="pdf"> PDF</label><label class="ye-option"><input type="radio" name="ye-format" value="word"> Word</label><label class="ye-option"><input type="radio" name="ye-format" value="jpg"> JPG</label></div></div><div class="ye-section" id="ye-pdf-options" style="display:none;"><label class="ye-label">PDF ??</label><div class="ye-options"><label class="ye-option"><input type="checkbox" id="ye-opt-toc" checked> ????</label></div></div><div class="ye-section" id="ye-md-options"><label class="ye-label">????</label><div class="ye-options"><label class="ye-option"><input type="checkbox" id="ye-opt-latexcode"> LaTeX ??</label><label class="ye-option"><input type="checkbox" id="ye-opt-anchor"> ??</label><label class="ye-option"><input type="checkbox" id="ye-opt-linebreak"> ??</label><label class="ye-option"><input type="checkbox" id="ye-opt-usemdai" checked> MDAI</label></div></div><div class="ye-section"><label class="ye-label">?????</label><div class="ye-rate-limit"><select id="ye-rate-limit"><option value="1">1</option><option value="2" selected>2</option><option value="4">4</option><option value="8">8</option></select></div></div><button id="ye-export-btn" class="ye-btn" disabled>&#128229; ????</button><div id="ye-progress" class="ye-progress"><div class="ye-progress-track"><div id="ye-progress-fill" class="ye-progress-fill"></div></div><div id="ye-progress-text" class="ye-progress-text">???...</div></div><div id="ye-status" class="ye-status"></div></div>';
  document.body.appendChild(panel);

  let selectedBooks = [], books = [];
  const collapseBtn = document.getElementById('ye-collapse-btn'), refreshBtn = document.getElementById('ye-refresh-btn'), bookListEl = document.getElementById('ye-book-list'), selectAllEl = document.querySelector('.ye-select-all'), selectAllCheckbox = document.getElementById('ye-select-all'), selectedHint = document.getElementById('ye-selected-hint'), exportBtn = document.getElementById('ye-export-btn'), progressBar = document.getElementById('ye-progress'), progressFill = document.getElementById('ye-progress-fill'), progressText = document.getElementById('ye-progress-text'), statusEl = document.getElementById('ye-status'), mdOptions = document.getElementById('ye-md-options'), pdfOptions = document.getElementById('ye-pdf-options'), panelIcon = document.getElementById('yuque-export-icon');

  document.querySelectorAll('input[name="ye-format"]').forEach(r => { r.addEventListener('change', () => { const f = document.querySelector('input[name="ye-format"]:checked').value; mdOptions.style.display = f === 'markdown' ? '' : 'none'; pdfOptions.style.display = f === 'pdf' ? '' : 'none'; }); });

  let isDragging = false, hasDragged = false, dragOffset = { x: 0, y: 0 };
  function adjustExpandDirection() { const rect = panel.getBoundingClientRect(); const needed = 320 - rect.width; if (rect.right + needed > window.innerWidth) { panel.style.left = 'auto'; panel.style.right = Math.max(20, window.innerWidth - rect.right) + 'px'; } else { panel.style.right = 'auto'; panel.style.left = rect.left + 'px'; } }
  collapseBtn.addEventListener('click', () => { if (!panel.classList.contains('collapsed')) adjustExpandDirection(); panel.classList.toggle('collapsed'); hasDragged = false; });
  panelIcon.addEventListener('click', () => { if (hasDragged) { hasDragged = false; return; } adjustExpandDirection(); panel.classList.remove('collapsed'); });
  function startDrag(e) { isDragging = true; hasDragged = false; const rect = panel.getBoundingClientRect(); dragOffset.x = e.clientX - rect.left; dragOffset.y = e.clientY - rect.top; e.preventDefault(); }
  document.getElementById('yuque-export-header').addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') return; startDrag(e); });
  panelIcon.addEventListener('mousedown', e => startDrag(e));
  document.addEventListener('mousemove', e => { if (!isDragging) return; hasDragged = true; panel.style.left = (e.clientX - dragOffset.x) + 'px'; panel.style.top = (e.clientY - dragOffset.y) + 'px'; panel.style.right = 'auto'; });
  document.addEventListener('mouseup', () => { isDragging = false; });

  function showStatus(msg, type) { statusEl.textContent = msg; statusEl.className = 'ye-status ' + (type || 'info'); statusEl.style.display = 'block'; }
  async function getBookStacks() { const ch = getCookieHeader(); if (!ch) throw new Error('Cookie ???????????'); const r = await fetch('https://www.yuque.com/api/mine/book_stacks', { headers: { 'accept': 'application/json', } }); if (!r.ok) { if (r.status === 401) throw new Error('?????'); throw new Error('????????? (' + r.statusText + ')'); } const d = await r.json(); const result = []; for (const s of d.data || []) result.push(...(s.books || [])); return result; }
  function renderBookList(bl) { if (!bl || !bl.length) { bookListEl.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">?????</div>'; selectAllEl.style.display = 'none'; return; } selectAllEl.style.display = 'flex'; selectAllCheckbox.checked = false; bookListEl.innerHTML = bl.map(b => '<label class="ye-book-item" data-book-id="' + b.id + '" data-book-slug="' + b.slug + '"><input type="checkbox" class="ye-book-checkbox" data-book-id="' + b.id + '"><span class="ye-book-name">' + b.name + '</span><span class="ye-book-count">' + b.items_count + ' ?</span></label>').join(''); bookListEl.querySelectorAll('.ye-book-item').forEach(item => { item.addEventListener('click', e => { if (e.target.tagName === 'INPUT') return; const cb = item.querySelector('.ye-book-checkbox'); cb.checked = !cb.checked; updateSelectedBooks(); }); }); bookListEl.querySelectorAll('.ye-book-checkbox').forEach(cb => cb.addEventListener('change', updateSelectedBooks)); }
  selectAllCheckbox.addEventListener('change', () => { bookListEl.querySelectorAll('.ye-book-checkbox').forEach(cb => { cb.checked = selectAllCheckbox.checked; }); updateSelectedBooks(); });
  function updateSelectedBooks() { const all = bookListEl.querySelectorAll('.ye-book-checkbox'); const checked = bookListEl.querySelectorAll('.ye-book-checkbox:checked'); selectAllCheckbox.checked = all.length > 0 && checked.length === all.length; const ids = []; checked.forEach(cb => ids.push(parseInt(cb.dataset.bookId))); selectedBooks = books.filter(b => ids.includes(b.id)); if (selectedBooks.length === 0) { selectedHint.textContent = '??????'; selectedHint.style.color = '#9ca3af'; exportBtn.disabled = true; } else { const total = selectedBooks.reduce((s, b) => s + b.items_count, 0); selectedHint.textContent = '??? ' + selectedBooks.length + ' ???? (' + total + ' ?)'; selectedHint.style.color = '#374151'; exportBtn.disabled = false; } }
  refreshBtn.addEventListener('click', async () => { try { refreshBtn.disabled = true; refreshBtn.textContent = '???...'; books = await getBookStacks(); renderBookList(books); refreshBtn.disabled = false; refreshBtn.innerHTML = '&#128260; ?????'; } catch (err) { bookListEl.innerHTML = '<div style="padding:20px;text-align:center;color:#dc2626;font-size:12px;">????: ' + err.message + '</div>'; refreshBtn.disabled = false; refreshBtn.innerHTML = '&#128260; ?????'; } });
  exportBtn.addEventListener('click', async () => { if (selectedBooks.length === 0) { showStatus('???????', 'error'); return; } const format = document.querySelector('input[name="ye-format"]:checked').value; const options = { format, attachment: true, latexcode: format !== 'lake' && document.getElementById('ye-opt-latexcode').checked, anchor: format !== 'lake' && document.getElementById('ye-opt-anchor').checked, linebreak: format !== 'lake' && document.getElementById('ye-opt-linebreak').checked, useMdai: format !== 'lake' && document.getElementById('ye-opt-usemdai').checked, toc: format === 'pdf' && document.getElementById('ye-opt-toc').checked, concurrency: parseInt(document.getElementById('ye-rate-limit').value, 10) || 2 }; exportBtn.disabled = true; refreshBtn.disabled = true; progressBar.classList.add('active'); progressText.textContent = '????????...'; showStatus('???????', 'info'); handleBatchExport(selectedBooks, options).then(result => { exportBtn.disabled = false; refreshBtn.disabled = false; if (result.success) { showStatus('?????????? ' + result.count + ' ???', 'success'); } else { showStatus('??????: ' + (result.error || '????'), 'error'); } setTimeout(() => { progressBar.classList.remove('active'); progressFill.style.width = '0%'; }, 3000); }); });
  progressListeners.push(msg => { if (msg.done) { exportBtn.disabled = false; refreshBtn.disabled = false; if (msg.error) { showStatus('????: ' + msg.error, 'error'); } else if (msg.successCount !== undefined) { showStatus('?????????? ' + msg.successCount + ' ???', 'success'); } setTimeout(() => { progressBar.classList.remove('active'); progressFill.style.width = '0%'; }, 3000); } else { progressFill.style.width = ((msg.current / msg.total) * 100) + '%'; const prefix = msg.bookTotal > 1 ? '[' + msg.bookIndex + '/' + msg.bookTotal + ' ' + msg.bookName + '] ' : ''; progressText.textContent = prefix + msg.current + '/' + msg.total + ' - ' + (msg.filename || '???...'); } });
})();
