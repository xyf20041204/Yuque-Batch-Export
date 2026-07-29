chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only accept messages from background (not from same-tab content script)
  if (sender.tab && !sender.id) {
    return false;
  }

  if (request.action === 'getCookies') {
    sendResponse({ cookie: document.cookie, source: 'document.cookie' });
    return true;
  }

  if (request.action === 'exportAndDownload') {
    handleExportAndDownload(request)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function handleExportAndDownload(req) {
  const { docId, bookSlug, username, filename: filePath, filenameOnly, format, options } = req;

  const exportPayload = { type: format, force: 0 };
  if (format === 'pdf' && options.toc) {
    exportPayload.options = JSON.stringify({ enableToc: 1 });
  }
  if (format === 'markdown' || format === 'lake') {
    exportPayload.options = JSON.stringify({
      attachment: true,
      latexcode: options.latexcode || false,
      anchor: options.anchor || false,
      linebreak: options.linebreak || false,
      useMdai: options.useMdai !== false,
    });
  }

  console.log('[cs] exportAndDownload START:', filenameOnly, 'docId:', docId);

  // 1. Call export API — fetch() in page context auto-sends ALL cookies (incl. HttpOnly)
  let exportUrl = null;
  for (let retry = 0; retry < 3; retry++) {
    console.log('[cs] export API try', retry + 1);
    const resp = await fetch(`https://www.yuque.com/api/docs/${docId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': `https://www.yuque.com/${username}/${bookSlug}`,
      },
      body: JSON.stringify(exportPayload),
    });

    if (!resp.ok) {
      console.log('[cs] export API FAILED, status:', resp.status);
      if (retry < 2) await sleep(3000);
      continue;
    }

    const data = await resp.json();
    console.log('[cs] export API state:', data?.data?.state);

    if (data.data?.state === 'success' && data.data?.url) {
      exportUrl = data.data.url;
      if (exportUrl.startsWith('/')) exportUrl = 'https://www.yuque.com' + exportUrl;
      break;
    }
    await sleep(3000);
  }

  if (!exportUrl) {
    throw new Error('Export API never returned success after 3 retries');
  }

  // 2. Return the export URL directly. background.js will use chrome.downloads to
  //    fetch it natively ? this avoids the .crdownload suffix caused by data URLs.
  console.log('[cs] exportAndDownload DONE, downloadUrl:', exportUrl);
    // 2. Fetch the exported file (page context fetch = auto cookies, no cookie header needed)
  console.log('[cs] fetching exported file...');
  const fileResp = await fetch(exportUrl);
  if (!fileResp.ok) {
    throw new Error('File download failed: HTTP ' + fileResp.status);
  }

  const blob = await fileResp.blob();
  console.log('[cs] file blob size:', blob.size, 'type:', blob.type);

  if (blob.size === 0) {
    throw new Error('Downloaded file is empty (0 bytes)');
  }

  // 3. Download directly from content script using chrome.downloads API.
  //    Called from page context, so blob URLs work reliably.
  //    Avoids .crdownload suffix AND cross-context cookie issues.
  const blobUrl = URL.createObjectURL(blob);
  const downloadId = await new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: blobUrl,
      filename: filePath,
      saveAs: false,
    }, (id) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(id);
      }
    });
  });

  // Release the blob URL after a minute (download should have started by then)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

  console.log('[cs] download OK, id:', downloadId, 'path:', filePath);
  return { success: true };
}
