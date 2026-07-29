// ==UserScript==
// @name         Yuque Batch Export
// @namespace    https://github.com/xyf20041204/Yuque-Batch-Export
// @version      2.4.0
// @description  One-click batch export Yuque docs to Markdown/Lake/PDF/Word/JPG with subdirectory structure
// @author       yuque-export-extension
// @match        https://www.yuque.com/*
// @grant        GM_download
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  console.log('[Yuque Export] Script initializing...');

  // ============================================================
  // 0. Sandbox-safe access helpers
  // ============================================================
  // Tampermonkey @grant activates sandbox mode. Use unsafeWindow
  // to reach the real page's document/window/fetch.
  var _doc = (typeof unsafeWindow !== 'undefined') ? unsafeWindow.document : document;
  var _win = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  var _fetch = (typeof unsafeWindow !== 'undefined')
    ? unsafeWindow.fetch.bind(unsafeWindow)
    : fetch.bind(window);

  // Guard: check the REAL document, not the sandbox one
  if (_doc.getElementById('yuque-export-panel')) {
    console.log('[Yuque Export] Panel already exists, skipping.');
    return;
  }

  // ============================================================
  // 1. Inline PNG icon (base64)
  // ============================================================
  var iconUrl = 'data:image/png;base64,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';

  // ============================================================
  // 2. Utility functions
  // ============================================================
  function getCookieHeader() { return _doc.cookie; }
  function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }
  function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').replace(/\.+$/, '');
  }

  // ============================================================
  // 3. Yuque API wrappers
  // ============================================================
  async function fetchTocData(username, bookSlug) {
    var url = 'https://www.yuque.com/' + username + '/' + bookSlug;
    var resp = await _fetch(url, { headers: { 'accept': 'text/html' } });
    if (!resp.ok) { console.log('[Yuque Export] fetchTocData failed:', resp.status); return null; }
    var html = await resp.text();
    var match = html.match(/window\.appData\s*=\s*JSON\.parse\(decodeURIComponent\("(.+?)"\)\)/);
    if (!match) { console.log('[Yuque Export] appData not found'); return null; }
    var appData = JSON.parse(decodeURIComponent(match[1]));
    return appData.book ? appData.book.toc : null;
  }

  async function fetchBookOwnerMap() {
    var resp = await _fetch('https://www.yuque.com/api/mine/book_stacks', {
      headers: { 'accept': 'application/json' }
    });
    if (!resp.ok) return {};
    var data = await resp.json();
    var map = {};
    var stacks = data.data || [];
    for (var si = 0; si < stacks.length; si++) {
      var books = stacks[si].books || [];
      for (var bi = 0; bi < books.length; bi++) {
        if (books[bi].user && books[bi].user.login) { map[books[bi].id] = books[bi].user.login; }
      }
    }
    return map;
  }

  function buildUuidMap(items) {
    var m = {};
    for (var i = 0; i < items.length; i++) {
      if (items[i].uuid) m[items[i].uuid] = items[i];
    }
    return m;
  }

  function getItemPath(uuid, uuidMap) {
    var parts = [];
    var current = uuidMap[uuid];
    while (current && current.parent_uuid) {
      var parent = uuidMap[current.parent_uuid];
      if (parent && parent.type === 'TITLE') { parts.unshift(sanitizeFilename(parent.title)); }
      current = parent;
    }
    return parts.join('/');
  }

  function buildDocPathMap(items) {
    var uuidMap = buildUuidMap(items);
    var dm = {};
    for (var i = 0; i < items.length; i++) {
      if (items[i].type === 'DOC' && items[i].doc_id) {
        dm[items[i].doc_id] = {
          slug: items[i].url,
          title: items[i].title,
          path: getItemPath(items[i].uuid, uuidMap)
        };
      }
    }
    return dm;
  }

  // ============================================================
  // 4. Batch export core
  // ============================================================
  async function mapWith下载并发数(items, limit, worker, gapMs) {
    var results = new Array(items.length);
    limit = Math.max(1, limit);
    var batchCount = Math.ceil(items.length / limit);
    for (var b = 0; b < batchCount; b++) {
      var start = b * limit;
      var end = Math.min(start + limit, items.length);
      var batch = [];
      for (var k = 0; k < end - start; k++) {
        var idx = start + k;
        batch.push(
          Promise.resolve(worker(items[idx], idx))
            .then(function(r) { results[this.idx] = r; return r; }.bind({idx: idx}))
            .catch(function(e) { console.error('[Yuque Export] Worker error:', e); results[this.idx] = false; return false; }.bind({idx: idx}))
        );
      }
      await Promise.all(batch);
      if (gapMs > 0 && b < batchCount - 1) await sleep(gapMs);
    }
    return results;
  }

  function safeGMdl(url, filePath) {
    return new Promise(function(resolve) {
      console.log('[Yuque Export] Download:', filePath);
      // PRIMARY: GM_download with full path.
      // Modern TM on Chrome/Edge maps GM_download to chrome.downloads.download,
      // which supports subdirectory paths (like "yuque-export/book/doc.md").
      // The browser sends auth cookies on the GET — the export URL is on yuque.com.
      GM_download({
        url: url,
        name: filePath,
        saveAs: false,
        onload: function() { resolve(true); },
        onerror: function() {
          console.warn('[Yuque Export] GM_download failed, trying blob download');
          // FALLBACK: fetch as blob and <a> download
          // (subdirectory path may be lost if browser strips slashes from download attr)
          _fetch(url, { credentials: 'include' })
            .then(function(resp) {
              if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
              return resp.blob();
            })
            .then(function(blob) {
              var blobUrl = URL.createObjectURL(blob);
              var a = _doc.createElement('a');
              a.href = blobUrl;
              a.download = filePath;
              a.style.display = 'none';
              _doc.body.appendChild(a);
              a.click();
              setTimeout(function() {
                _doc.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                resolve(true);
              }, 500);
            })
            .catch(function() {
              console.error('[Yuque Export] All download methods failed');
              // Ultimate fallback: direct <a> click
              var a = _doc.createElement('a');
              a.href = url;
              a.download = filePath;
              a.style.display = 'none';
              _doc.body.appendChild(a);
              a.click();
              setTimeout(function() {
                _doc.body.removeChild(a);
                resolve(true);
              }, 500);
            });
        }
      });
    });
  }
  var progressListeners = [];
  function sendProgress(data) {
    for (var i = 0; i < progressListeners.length; i++) { progressListeners[i](data); }
  }

  async function downloadSingleDoc(doc, ctx) {
    var currentBook = ctx.currentBook;
    var docPathMap = ctx.docPathMap;
    var username = ctx.username;
    var options = ctx.options;
    var progressCtx = ctx.progressCtx;
    var tocInfo = docPathMap[doc.id];

    try {
      console.log('[Yuque Export] START:', doc.title, 'id:', doc.id);
      var format = options.format || 'markdown';
      var fileExt = format === 'lake' ? '.lake' : format === 'markdown' ? '.md' : '.' + format;
      var safeBookName = sanitizeFilename(currentBook.name || 'Unknown');
      var safeDocTitle = sanitizeFilename(doc.title || 'Untitled');

      var filePath = 'yuque-export/' + safeBookName;
      if (tocInfo && tocInfo.path) filePath += '/' + tocInfo.path;
      filePath += '/' + safeDocTitle + fileExt;

      // Call export API
      var exportPayload = { type: format, force: 0 };
      if (format === 'pdf' && options.toc) { exportPayload.options = JSON.stringify({ enableToc: 1 }); }
      if (format === 'markdown' || format === 'lake') {
        exportPayload.options = JSON.stringify({
          attachment: true,
          latexcode: options.latexcode || false,
          anchor: options.anchor || false,
          linebreak: options.linebreak || false,
          useMdai: options.useMdai !== false
        });
      }

      var exportResult = null;
      for (var retry = 0; retry < 3; retry++) {
        console.log('[Yuque Export] Export API try', retry + 1, 'for:', doc.title);
        var r = await _fetch('https://www.yuque.com/api/docs/' + doc.id + '/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'referer': 'https://www.yuque.com/' + username + '/' + (currentBook.slug || '')
          },
          body: JSON.stringify(exportPayload)
        });
        if (!r.ok) { console.log('[Yuque Export] Export API FAILED, status:', r.status); if (retry < 2) await sleep(3000); continue; }
        var d = await r.json();
        console.log('[Yuque Export] Export API state:', d && d.data && d.data.state);
        if (d && d.data && d.data.state === 'success' && d.data.url) { exportResult = d.data; break; }
        await sleep(3000);
      }

      if (!exportResult || !exportResult.url) throw new Error('Export API never returned success after 3 retries');

      var dUrl = exportResult.url;
      if (dUrl.charAt(0) === '/') dUrl = 'https://www.yuque.com' + dUrl;

      // Download via GM_download with direct URL
      await safeGMdl(dUrl, filePath);

      progressCtx.finished++;
      sendProgress({
        bookName: progressCtx.bookName, current: progressCtx.finished,
        total: progressCtx.total, bookIndex: progressCtx.bookIndex,
        bookTotal: progressCtx.bookTotal, filename: doc.title
      });
      return true;
    } catch (err) {
      console.error('[Yuque Export] FAILED:', doc.title, err.message);
      progressCtx.finished++;
      sendProgress({
        bookName: progressCtx.bookName, current: progressCtx.finished,
        total: progressCtx.total, bookIndex: progressCtx.bookIndex,
        bookTotal: progressCtx.bookTotal,
        filename: doc.title + ' (FAILED: ' + err.message + ')'
      });
      return false;
    }
  }

  async function handleBatchExport(bookList, options) {
    try {
      console.log('[Yuque Export] Batch export START, books:', bookList.length, 'format:', options.format);

      var cookieStr = getCookieHeader();
      if (!cookieStr) throw new Error('Not logged in. Please login to yuque.com first.');
      console.log('[Yuque Export] Cookie length:', cookieStr.length);

      var ownerMap = await fetchBookOwnerMap();
      console.log('[Yuque Export] Owner map entries:', Object.keys(ownerMap).length);

      var concurrency = Math.max(1, Number(options.concurrency) || 2);
      var totalCount = 0, totalSuccess = 0;

      for (var bi = 0; bi < bookList.length; bi++) {
        var currentBook = bookList[bi];
        var username = ownerMap[currentBook.id] || null;
        if (!username) { console.log('[Yuque Export] No username for:', currentBook.name); continue; }

        var tocItems = await fetchTocData(username, currentBook.slug);
        var docPathMap = tocItems ? buildDocPathMap(tocItems) : {};

        var docsResp = await _fetch('https://www.yuque.com/api/docs?book_id=' + currentBook.id, {
          headers: { 'accept': 'application/json' }
        });
        if (!docsResp.ok) { console.log('[Yuque Export] Docs fetch FAILED for:', currentBook.name); continue; }

        var docsData = await docsResp.json();
        var docs = docsData.data || [];
        if (docs.length === 0) { console.log('[Yuque Export] No docs in:', currentBook.name); continue; }

        console.log('[Yuque Export] Found', docs.length, 'docs in:', currentBook.name);
        totalCount += docs.length;

        var progressCtx = {
          finished: 0, total: docs.length,
          bookName: currentBook.name, bookIndex: bi + 1, bookTotal: bookList.length
        };

        var results = await mapWith下载并发数(docs, concurrency,
          function(doc) { return downloadSingleDoc(doc, { currentBook: currentBook, docPathMap: docPathMap, username: username, options: options, progressCtx: progressCtx }); },
          1000);

        var successCount = results.filter(Boolean).length;
        totalSuccess += successCount;

        sendProgress({
          bookName: currentBook.name, current: docs.length, total: docs.length,
          bookIndex: bi + 1, bookTotal: bookList.length, filename: currentBook.name + ' 完成',
          bookDone: true, successCount: successCount
        });
      }

      sendProgress({
        current: totalCount, total: totalCount, filename: '全部完成',
        done: true, successCount: totalSuccess
      });
      return { success: true, count: totalSuccess };
    } catch (err) {
      console.error('[Yuque Export] Batch export FAILED:', err.message);
      sendProgress({ error: err.message, done: true });
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // 5. UI Panel - Injected into the REAL page via _doc
  // ============================================================
  console.log('[Yuque Export] Creating UI panel...');

  // Inject CSS into the real page
  var style = _doc.createElement('style');
  style.textContent = [
    '#yuque-export-panel{position:fixed;top:120px;right:20px;width:320px;max-height:80vh;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);border:2px solid #e5e7eb;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#374151;overflow:hidden;transition:width .25s,max-height .25s,border-radius .25s,box-shadow .25s}',
    '#yuque-export-panel.collapsed{width:40px;max-height:40px;border-radius:20px;cursor:pointer}',
    '#yuque-export-panel.collapsed:hover{box-shadow:0 4px 16px rgba(0,0,0,0.15)}',
    '#yuque-export-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f3f4f6;cursor:move;user-select:none}',
    '#yuque-export-header-title{display:flex;align-items:center;gap:8px}',
    '#yuque-export-header-title img{width:18px;height:18px;border-radius:4px}',
    '#yuque-export-header h3{margin:0;font-size:13px;font-weight:600;color:#111827}',
    '#yuque-export-header button{background:none;border:none;color:#9ca3af;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}',
    '#yuque-export-header button:hover{background:#f3f4f6;color:#374151}',
    '#yuque-export-body{padding:14px;max-height:calc(80vh - 41px);overflow-y:auto}',
    '#yuque-export-panel .ye-label{display:block;font-size:11px;color:#9ca3af;margin-bottom:6px;font-weight:500}',
    '#yuque-export-panel .ye-btn{width:100%;padding:8px 16px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500}',
    '#yuque-export-panel .ye-btn:hover{background:#1f2937}',
    '#yuque-export-panel .ye-btn:disabled{background:#f3f4f6;color:#d1d5db;cursor:not-allowed}',
    '#yuque-export-panel .ye-btn-secondary{background:#fff;color:#374151;border:1px solid #e5e7eb}',
    '#yuque-export-panel .ye-btn-secondary:hover{background:#f9fafb;border-color:#d1d5db}',
    '#yuque-export-panel .ye-section{margin-bottom:14px}',
    '#yuque-export-panel .ye-book-list{max-height:180px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;margin-top:8px}',
    '#yuque-export-panel .ye-book-item{padding:8px 12px;border-bottom:1px solid #f3f4f6;cursor:pointer;display:flex;align-items:center;gap:8px}',
    '#yuque-export-panel .ye-book-item:hover{background:#f9fafb}',
    '#yuque-export-panel .ye-book-item:last-child{border-bottom:none}',
    '#yuque-export-panel .ye-book-checkbox{flex-shrink:0;margin:0}',
    '#yuque-export-panel .ye-book-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#yuque-export-panel .ye-book-count{font-size:11px;color:#9ca3af;flex-shrink:0}',
    '#yuque-export-panel .ye-select-all{font-size:12px;color:#374151;cursor:pointer;display:flex;align-items:center;gap:4px;margin-bottom:6px}',
    '#yuque-export-panel .ye-hint{font-size:11px;color:#9ca3af;margin-top:6px}',
    '#yuque-export-panel .ye-options{display:flex;flex-wrap:wrap;gap:6px}',
    '#yuque-export-panel .ye-option{display:flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;cursor:pointer}',
    '#yuque-export-panel .ye-option input{margin:0;accent-color:#111827}',
    '#yuque-export-panel .ye-rate-limit{display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280}',
    '#yuque-export-panel .ye-rate-limit select{flex:1;padding:4px 6px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151;background:#fff;cursor:pointer}',
    '#yuque-export-panel .ye-rate-limit select:focus{outline:none;border-color:#111827}',
    '#yuque-export-panel .ye-progress{margin-top:12px;display:none}',
    '#yuque-export-panel .ye-progress.active{display:block}',
    '#yuque-export-panel .ye-progress-track{height:3px;background:#f3f4f6;border-radius:2px;overflow:hidden}',
    '#yuque-export-panel .ye-progress-fill{height:100%;background:#111827;width:0%;transition:width .3s;border-radius:2px}',
    '#yuque-export-panel .ye-progress-text{font-size:11px;color:#9ca3af;margin-top:6px;text-align:center}',
    '#yuque-export-panel .ye-status{margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;display:none}',
    '#yuque-export-panel .ye-status.success{background:#f0fdf4;color:#15803d}',
    '#yuque-export-panel .ye-status.error{background:#fef2f2;color:#dc2626}',
    '#yuque-export-panel .ye-status.info{background:#f9fafb;color:#6b7280}',
    '#yuque-export-icon{width:40px;height:40px;display:none;align-items:center;justify-content:center;background:#fff;border-radius:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1)}',
    '#yuque-export-icon img{width:42px;height:42px;border-radius:4px}',
    '#yuque-export-panel.collapsed #yuque-export-body,#yuque-export-panel.collapsed #yuque-export-header{display:none}',
    '#yuque-export-panel.collapsed #yuque-export-icon{display:flex}'
  ].join('');
  _doc.head.appendChild(style);

  // Create panel HTML
  var panel = _doc.createElement('div');
  panel.id = 'yuque-export-panel';
  panel.innerHTML = [
    '<div id="yuque-export-icon"><img src="' + iconUrl + '" alt="logo"></div>',
    '<div id="yuque-export-header">',
    '<div id="yuque-export-header-title"><img src="' + iconUrl + '" alt="logo"><h3>语雀批量导出</h3></div>',
    '<div><button id="ye-collapse-btn" title="折叠">&#8722;</button></div>',
    '</div>',
    '<div id="yuque-export-body">',
    '<div class="ye-section">',
    '<label class="ye-label">选择知识库</label>',
    '<button id="ye-refresh-btn" class="ye-btn ye-btn-secondary" style="margin-bottom:8px;">&#128260; 加载知识库</button>',
    '<label class="ye-select-all" style="display:none;"><input type="checkbox" id="ye-select-all"> 全选</label>',
    '<div id="ye-book-list" class="ye-book-list"><div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">点击上方按钮加载知识库</div></div>',
    '<div id="ye-selected-hint" class="ye-hint">未选择知识库</div>',
    '</div>',
    '<div class="ye-section">',
    '<label class="ye-label">导出格式</label>',
    '<div class="ye-options">',
    '<label class="ye-option"><input type="radio" name="ye-format" value="markdown" checked> Markdown</label>',
    '<label class="ye-option"><input type="radio" name="ye-format" value="lake"> Lake</label>',
    '<label class="ye-option"><input type="radio" name="ye-format" value="pdf"> PDF</label>',
    '<label class="ye-option"><input type="radio" name="ye-format" value="word"> Word</label>',
    '<label class="ye-option"><input type="radio" name="ye-format" value="jpg"> JPG</label>',
    '</div></div>',
    '<div class="ye-section" id="ye-pdf-options" style="display:none;">',
    '<label class="ye-label">PDF 选项</label>',
    '<div class="ye-options"><label class="ye-option"><input type="checkbox" id="ye-opt-toc" checked> 导出大纲</label></div>',
    '</div>',
    '<div class="ye-section" id="ye-md-options">',
    '<label class="ye-label">导出选项</label>',
    '<div class="ye-options">',
    '<label class="ye-option"><input type="checkbox" id="ye-opt-latexcode"> LaTeX 公式</label>',
    '<label class="ye-option"><input type="checkbox" id="ye-opt-anchor"> 锚点</label>',
    '<label class="ye-option"><input type="checkbox" id="ye-opt-linebreak"> 换行</label>',
    '<label class="ye-option"><input type="checkbox" id="ye-opt-usemdai" checked> MDAI</label>',
    '</div></div>',
    '<div class="ye-section">',
    '<label class="ye-label">下载并发数</label>',
    '<div class="ye-rate-limit"><select id="ye-rate-limit">',
    '<option value="1">1</option><option value="2" selected>2</option><option value="4">4</option><option value="8">8</option>',
    '</select></div></div>',
    '<button id="ye-export-btn" class="ye-btn" disabled>&#128229; 批量导出</button>',
    '<div id="ye-progress" class="ye-progress">',
    '<div class="ye-progress-track"><div id="ye-progress-fill" class="ye-progress-fill"></div></div>',
    '<div id="ye-progress-text" class="ye-progress-text">准备中...</div>',
    '</div><div id="ye-status" class="ye-status"></div>',
    '</div>'
  ].join('');

  _doc.body.appendChild(panel);
  console.log('[Yuque Export] Panel appended to body');

  // ============================================================
  // 6. UI Event handlers (all use _doc for DOM access)
  // ============================================================
  var selectedBooks = [], books = [];

  function $(id) { return _doc.getElementById(id); }

  var collapseBtn = $('ye-collapse-btn');
  var refreshBtn = $('ye-refresh-btn');
  var bookListEl = $('ye-book-list');
  var selectAllEl = _doc.querySelector('.ye-select-all');
  var selectAllCheckbox = $('ye-select-all');
  var selectedHint = $('ye-selected-hint');
  var exportBtn = $('ye-export-btn');
  var progressBar = $('ye-progress');
  var progressFill = $('ye-progress-fill');
  var progressText = $('ye-progress-text');
  var statusEl = $('ye-status');
  var mdOptions = $('ye-md-options');
  var pdfOptions = $('ye-pdf-options');
  var panelIcon = $('yuque-export-icon');

  // Format switching
  var formatRadios = _doc.querySelectorAll('input[name="ye-format"]');
  for (var ri = 0; ri < formatRadios.length; ri++) {
    formatRadios[ri].addEventListener('change', function() {
      var f = _doc.querySelector('input[name="ye-format"]:checked').value;
      if (mdOptions) mdOptions.style.display = f === 'markdown' ? '' : 'none';
      if (pdfOptions) pdfOptions.style.display = f === 'pdf' ? '' : 'none';
    });
  }

  // Drag functionality
  var isDragging = false, hasDragged = false, dragOffset = { x: 0, y: 0 };

  function adjustExpandDirection() {
    var rect = panel.getBoundingClientRect();
    if (rect.right + 320 > _win.innerWidth) {
      panel.style.left = 'auto';
      panel.style.right = Math.max(20, _win.innerWidth - rect.right) + 'px';
    } else {
      panel.style.right = 'auto';
      panel.style.left = rect.left + 'px';
    }
  }

  collapseBtn.addEventListener('click', function() {
    var willCollapse = !panel.classList.contains('collapsed');
    if (!willCollapse) adjustExpandDirection();
    panel.classList.toggle('collapsed');
  });

  panelIcon.addEventListener('click', function() {
    if (hasDragged) { hasDragged = false; return; }
    adjustExpandDirection();
    panel.classList.remove('collapsed');
  });

  function startDrag(e) {
    isDragging = true; hasDragged = false;
    var rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  }

  $('yuque-export-header').addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    startDrag(e);
  });
  panelIcon.addEventListener('mousedown', function(e) { startDrag(e); });

  _doc.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    hasDragged = true;
    panel.style.left = (e.clientX - dragOffset.x) + 'px';
    panel.style.top = (e.clientY - dragOffset.y) + 'px';
    panel.style.right = 'auto';
  });
  _doc.addEventListener('mouseup', function() { isDragging = false; });

  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'ye-status ' + (type || 'info');
    statusEl.style.display = 'block';
  }

  // Book list loading
  async function getBookStacks() {
    var r = await _fetch('https://www.yuque.com/api/mine/book_stacks', {
      headers: { 'accept': 'application/json' }
    });
    if (!r.ok) {
      if (r.status === 401) throw new Error('未登录语雀，请先登录');
      throw new Error('获取知识库列表失败(' + r.statusText + ')');
    }
    var d = await r.json();
    var result = [];
    var stacks = d.data || [];
    for (var si = 0; si < stacks.length; si++) {
      result.push.apply(result, stacks[si].books || []);
    }
    console.log('[Yuque Export] Loaded', result.length, 'knowledge bases');
    return result;
  }

  function renderBookList(bookArray) {
    if (!bookArray || !bookArray.length) {
      if (bookListEl) bookListEl.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">暂无知识库</div>';
      if (selectAllEl) selectAllEl.style.display = 'none';
      return;
    }
    if (selectAllEl) selectAllEl.style.display = 'flex';
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    if (bookListEl) {
      bookListEl.innerHTML = bookArray.map(function(b) {
        return '<label class="ye-book-item" data-book-id="' + b.id + '" data-book-slug="' + b.slug + '">'
          + '<input type="checkbox" class="ye-book-checkbox" data-book-id="' + b.id + '">'
          + '<span class="ye-book-name">' + b.name + '</span>'
          + '<span class="ye-book-count">' + b.items_count + ' 篇</span>'
          + '</label>';
      }).join('');
    }
    var items = bookListEl.querySelectorAll('.ye-book-item');
    for (var ii = 0; ii < items.length; ii++) {
      items[ii].addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') return;
        var cb = this.querySelector('.ye-book-checkbox');
        if (cb) { cb.checked = !cb.checked; }
        updateSelectedBooks();
      });
    }
    var checkboxes = bookListEl.querySelectorAll('.ye-book-checkbox');
    for (var ci = 0; ci < checkboxes.length; ci++) {
      checkboxes[ci].addEventListener('change', updateSelectedBooks);
    }
  }

  if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', function() {
    var cbs = bookListEl.querySelectorAll('.ye-book-checkbox');
    for (var i = 0; i < cbs.length; i++) { cbs[i].checked = selectAllCheckbox.checked; }
    updateSelectedBooks();
  });

  function updateSelectedBooks() {
    var all = bookListEl.querySelectorAll('.ye-book-checkbox');
    var checked = bookListEl.querySelectorAll('.ye-book-checkbox:checked');
    if (selectAllCheckbox) selectAllCheckbox.checked = all.length > 0 && checked.length === all.length;
    var ids = [];
    for (var i = 0; i < checked.length; i++) { ids.push(parseInt(checked[i].dataset.bookId)); }
    selectedBooks = books.filter(function(b) { return ids.indexOf(b.id) !== -1; });
    if (selectedBooks.length === 0) {
      if (selectedHint) { selectedHint.textContent = '未选择知识库'; selectedHint.style.color = '#9ca3af'; }
      if (exportBtn) exportBtn.disabled = true;
    } else {
      var total = 0;
      for (var bi = 0; bi < selectedBooks.length; bi++) { total += selectedBooks[bi].items_count; }
      if (selectedHint) {
        selectedHint.textContent = '已选择 ' + selectedBooks.length + ' 个知识库 (' + total + ' 篇)';
        selectedHint.style.color = '#374151';
      }
      if (exportBtn) exportBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener('click', async function() {
    try {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '加载中...';
      books = await getBookStacks();
      renderBookList(books);
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '&#128260; 加载知识库';
    } catch (err) {
      if (bookListEl) bookListEl.innerHTML = '<div style="padding:20px;text-align:center;color:#dc2626;font-size:12px;">加载失败: ' + err.message + '</div>';
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '&#128260; 加载知识库';
    }
  });

  exportBtn.addEventListener('click', async function() {
    if (selectedBooks.length === 0) {
      showStatus('请先选择知识库', 'error');
      return;
    }
    var format = _doc.querySelector('input[name="ye-format"]:checked').value;
    var options = {
      format: format,
      latexcode: format !== 'lake' && ($('ye-opt-latexcode') ? $('ye-opt-latexcode').checked : false),
      anchor: format !== 'lake' && ($('ye-opt-anchor') ? $('ye-opt-anchor').checked : false),
      linebreak: format !== 'lake' && ($('ye-opt-linebreak') ? $('ye-opt-linebreak').checked : false),
      useMdai: format !== 'lake' && ($('ye-opt-usemdai') ? $('ye-opt-usemdai').checked : false),
      toc: format === 'pdf' && ($('ye-opt-toc') ? $('ye-opt-toc').checked : false),
      concurrency: parseInt(($('ye-rate-limit') ? $('ye-rate-limit').value : '2'), 10) || 2
    };

    exportBtn.disabled = true;
    refreshBtn.disabled = true;
    if (progressBar) progressBar.classList.add('active');
    if (progressText) progressText.textContent = '正在导出...';
    showStatus('下载任务已启动', 'info');

    handleBatchExport(selectedBooks, options).then(function(result) {
      exportBtn.disabled = false;
      refreshBtn.disabled = false;
      if (result.success) {
        showStatus('批量导出完成！已下载 ' + result.count + ' 个文件', 'success');
      } else {
        showStatus('批量导出失败: ' + (result.error || '未知错误'), 'error');
      }
      setTimeout(function() {
        if (progressBar) progressBar.classList.remove('active');
        if (progressFill) progressFill.style.width = '0%';
      }, 3000);
    });
  });

  progressListeners.push(function(msg) {
    if (msg.done) {
      exportBtn.disabled = false;
      refreshBtn.disabled = false;
      if (msg.error) {
        showStatus('错误: ' + msg.error, 'error');
      } else if (msg.successCount !== undefined) {
        showStatus('批量导出完成！已下载 ' + msg.successCount + ' 个文件', 'success');
      }
      setTimeout(function() {
        if (progressBar) progressBar.classList.remove('active');
        if (progressFill) progressFill.style.width = '0%';
      }, 3000);
    } else {
      if (progressFill) progressFill.style.width = ((msg.current / msg.total) * 100) + '%';
      var prefix = msg.bookTotal > 1 ? '[' + msg.bookIndex + '/' + msg.bookTotal + ' ' + (msg.bookName || '') + '] ' : '';
      if (progressText) progressText.textContent = prefix + msg.current + '/' + msg.total + ' - ' + (msg.filename || '处理中...');
    }
  });

  console.log('[Yuque Export] UI ready. Look for "Yuque Export" panel at top-right of the page.');
})();
