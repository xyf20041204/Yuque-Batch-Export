chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "batchExport") {
   // Wrap in IIFE so we can await inside a sync listener callback
   (async () => {
     const requestWithTabId = {
       ...request,
       tabId: request.tabId || sender.tab?.id
     };
     // Safety fallback: if tabId is still missing, query active tab
     if (requestWithTabId.tabId == null) {
       console.warn('[bg] tabId missing, falling back to tabs.query');
       const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
       requestWithTabId.tabId = activeTab?.id;
     }
     if (requestWithTabId.tabId == null) {
       sendResponse({ success: false, error: 'Cannot find active tab. Open a yuque page first.' });
       return;
     }

     try {
       const result = await handleBatchExport(requestWithTabId);
       sendResponse(result);
     } catch (error) {
       sendResponse({ success: false, error: error.message });
     }
   })();
   return true;
 }

  if (request.action === "getCookies") {
    chrome.tabs.sendMessage(request.tabId, { action: "getCookies" }, (response) => {
      sendResponse(response);
    });
    return true;
  }

  return false;
});

async function getAllCookies() {
  // Try multiple domain patterns — Yuque cookies may be set on different domain scopes
  let cookies = await chrome.cookies.getAll({ domain: '.yuque.com' });
  console.log('[bg] getAllCookies .yuque.com:', cookies.length);
  if (cookies.length === 0) {
    cookies = await chrome.cookies.getAll({ domain: 'www.yuque.com' });
    console.log('[bg] getAllCookies www.yuque.com:', cookies.length);
  }
  if (cookies.length === 0) {
    cookies = await chrome.cookies.getAll({ url: 'https://www.yuque.com/' });
    console.log('[bg] getAllCookies url:', cookies.length);
  }
  if (cookies.length === 0) {
    // Debug: dump all yuque-related cookie names
    const all = await chrome.cookies.getAll({});
    const yuqueCookies = all.filter(c => c.domain.includes('yuque'));
    console.log('[bg] ALL yuque cookies (unfiltered):', yuqueCookies.length, 'domains:', [...new Set(yuqueCookies.map(c => c.domain))]);
  }
  console.log('[bg] final cookie count:', cookies.length);
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

async function fetchTocData(username, bookSlug, cookieHeader) {
  const url = `https://www.yuque.com/${username}/${bookSlug}`;
  const response = await fetch(url, {
    headers: {
      "cookie": cookieHeader,
      "accept": "text/html",
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  const match = html.match(/window\.appData\s*=\s*JSON\.parse\(decodeURIComponent\("(.+?)"\)\)/);
  if (!match) {
    return null;
  }

  const decoded = decodeURIComponent(match[1]);
  const appData = JSON.parse(decoded);
  return appData.book?.toc || null;
}

async function fetchBookOwnerMap(cookieHeader) {
  const response = await fetch("https://www.yuque.com/api/mine/book_stacks", {
    headers: {
      "accept": "application/json",
      "cookie": cookieHeader,
    },
  });

  if (!response.ok) return {};

  const data = await response.json();
  const map = {};
  for (const stack of data.data || []) {
    for (const book of stack.books || []) {
      if (book.user?.login) {
        map[book.id] = book.user.login;
      }
    }
  }
  return map;
}

function buildUuidMap(tocItems) {
  const map = {};
  for (const item of tocItems) {
    if (item.uuid) {
      map[item.uuid] = item;
    }
  }
  return map;
}

function getItemPath(uuid, uuidMap) {
  const parts = [];
  let current = uuidMap[uuid];

  while (current && current.parent_uuid) {
    const parent = uuidMap[current.parent_uuid];
    if (parent && parent.type === "TITLE") {
      parts.unshift(sanitizeFilename(parent.title));
    }
    current = parent;
  }

  return parts.join("/");
}

function buildDocPathMap(tocItems) {
  const uuidMap = buildUuidMap(tocItems);
  const docMap = {};

  for (const item of tocItems) {
    if (item.type === "DOC" && item.doc_id) {
      const dirPath = getItemPath(item.uuid, uuidMap);
      docMap[item.doc_id] = {
        slug: item.url,
        title: item.title,
        path: dirPath,
      };
    }
  }

  return docMap;
}


async function handleBatchExport(request) {
  const { book, books, options, tabId } = request;
  const bookList = books || (book ? [book] : []);

  try {
  console.log('[bg] handleBatchExport START, books:', bookList.length, 'format:', options.format);
  // Use chrome.cookies API — gets ALL cookies including HttpOnly.
  let cookieHeader = await getAllCookies();
  console.log('[bg] cookieHeader from chrome.cookies:', cookieHeader.length, 'chars');

  // Fallback: if chrome.cookies fails, get cookies from content script's document.cookie
  if (!cookieHeader) {
    console.log('[bg] chrome.cookies returned empty, falling back to content script');
    const cookieResponse = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "getCookies" }, (response) => {
        resolve(response);
      });
    });
    cookieHeader = cookieResponse?.cookie || '';
    console.log('[bg] cookieHeader from content script:', cookieHeader.length, 'chars');
  }

  if (!cookieHeader) {
    throw new Error("Unable to get cookies — are you logged into yuque.com?");
  }

    const ownerMap = await fetchBookOwnerMap(cookieHeader);
  console.log('[bg] ownerMap entries:', Object.keys(ownerMap).length, 'sample:', JSON.stringify(Object.keys(ownerMap).slice(0,3)));
  const concurrency = Math.max(1, Number(options.concurrency) || 1);
    const batchGapMs = 1000;
    let totalCount = 0;
    let totalSuccess = 0;

    for (let bi = 0; bi < bookList.length; bi++) {
      const currentBook = bookList[bi];

      const username = ownerMap[currentBook.id] || null;

      if (!username) {
        continue;
      }

      const tocItems = await fetchTocData(username, currentBook.slug, cookieHeader);
      const docPathMap = tocItems ? buildDocPathMap(tocItems) : {};

      console.log('[bg] fetching docs for book:', currentBook.name, 'id:', currentBook.id, 'username:', username);
    const docsResponse = await fetch(`https://www.yuque.com/api/docs?book_id=${currentBook.id}`, {
        headers: {
          "accept": "application/json",
          "cookie": cookieHeader,
        },
      });

      if (!docsResponse.ok) {
        console.log('[bg] docs fetch FAILED, status:', docsResponse.status, 'for book:', currentBook.name);
        continue;
      }

      const docsData = await docsResponse.json();
      const docs = docsData.data || [];

      if (docs.length === 0) {
        console.log('[bg] docs list EMPTY for book:', currentBook.name);
        continue;
      }

     totalCount += docs.length;
     console.log('[bg] found', docs.length, 'docs in book:', currentBook.name, 'first doc id:', docs[0]?.id);
     const ctx = {
       finished: 0,
       total: docs.length,
       bookName: currentBook.name,
       bookIndex: bi + 1,
       bookTotal: bookList.length,
       tabId: tabId,
     };

      const results = await mapWithConcurrency(docs, concurrency, (doc) => downloadSingleDoc(doc, {
        currentBook, docPathMap, username, options, cookieHeader, ctx,
      }), batchGapMs);
      const successCount = results.filter(Boolean).length;
      totalSuccess += successCount;

      sendProgress({
        bookName: currentBook.name,
        current: docs.length,
        total: docs.length,
        bookIndex: bi + 1,
        bookTotal: bookList.length,
        filename: `${currentBook.name} done`,
        bookDone: true,
        successCount: successCount,
      });
    }

    sendProgress({
      current: totalCount,
      total: totalCount,
      filename: "All done",
      done: true,
      successCount: totalSuccess,
    });

    return { success: true, count: totalSuccess };

  } catch (error) {

    sendProgress({
      error: error.message,
      done: true,
    });

    return { success: false, error: error.message };
  }
}

function sendProgress(data) {
  chrome.runtime.sendMessage({
    action: "batchProgress",
    ...data
  }).catch(() => {
    // Popup may be closed
  });
}

async function mapWithConcurrency(items, limit, worker, gapMs = 0) {
  const results = new Array(items.length);
  limit = Math.max(1, limit);
  const batchCount = Math.ceil(items.length / limit);

  for (let b = 0; b < batchCount; b++) {
    const start = b * limit;
    const end = Math.min(start + limit, items.length);

    await Promise.all(
      Array.from({ length: end - start }, (_, k) => {
        const index = start + k;
        return Promise.resolve(worker(items[index], index))
          .then((r) => { results[index] = r; })
          .catch(() => { results[index] = false; });
      })
    );

    if (gapMs > 0 && b < batchCount - 1) {
      await sleep(gapMs);
    }
  }

  return results;
}

async function downloadSingleDoc(doc, ctx) {
  const { currentBook, docPathMap, username, options, cookieHeader, ctx: progress } = ctx;
  const tocInfo = docPathMap[doc.id];

  try {
    console.log('[bg] downloadSingleDoc START doc:', doc.title, 'id:', doc.id, 'format:', options.format);
    const format = options.format || "markdown";
    const fileExt = (format === "lake") ? ".lake" : (format === "markdown") ? ".md" : "." + format;

    let filePath = "yuque-export/" + sanitizeFilename(currentBook.name);
    if (tocInfo?.path) {
      filePath += "/" + tocInfo.path;
    }
    filePath += "/" + sanitizeFilename(doc.title || "Untitled") + fileExt;

   const safePath = filePath.replace(/[<>:"|?*]/g, "_");
   const filenameOnly = safePath.split('/').pop();

   // Delegate to content script — it runs in page context so fetch() auto-sends
   // ALL cookies including HttpOnly ones (required by yuque's export API).
   console.log('[bg] delegating to content script for:', doc.title);

   if (progress.tabId == null) {
     throw new Error('No tabId available');
   }

   const result = await new Promise((resolve) => {
     const timeout = setTimeout(() => {
       resolve({ success: false, error: "Content script timeout (120s)" });
     }, 120000);

     chrome.tabs.sendMessage(progress.tabId, {
       action: "exportAndDownload",
       docId: doc.id,
       bookSlug: currentBook.slug,
       username: username,
       filename: safePath,
       filenameOnly: filenameOnly,
       format: format,
       options: options,
     }, (response) => {
       clearTimeout(timeout);
       if (chrome.runtime.lastError) {
         resolve({ success: false, error: chrome.runtime.lastError.message });
       } else {
         resolve(response || { success: false, error: "No response" });
       }
     });
   });

   if (!result.success) {
     throw new Error(result.error || "Export/download failed");
   }

   // Content script handles download directly (fetches blob in page context,
   // creates blob URL, calls chrome.downloads.download). This avoids .crdownload
   // suffix and cross-context cookie issues.
   if (result.success) {
     console.log('[bg] download completed for:', safePath);
   }

   progress.finished++;
   sendProgress({
     bookName: progress.bookName,
      current: progress.finished,
      total: progress.total,
      bookIndex: progress.bookIndex,
      bookTotal: progress.bookTotal,
      filename: doc.title,
    });
    return true;
  } catch (error) {
    console.error('[bg] downloadSingleDoc FAILED for:', doc.title, 'error:', error.message);
    progress.finished++;
    sendProgress({
      bookName: progress.bookName,
      current: progress.finished,
      total: progress.total,
      bookIndex: progress.bookIndex,
      bookTotal: progress.bookTotal,
      filename: `${doc.title} (FAILED: ${error.message})`,
    });
    return false;
  }
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
