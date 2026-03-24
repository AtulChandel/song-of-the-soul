const shlokas = Array.isArray(window.SHLOKAS) ? window.SHLOKAS : [];

let idx = 0;
let favorites = JSON.parse(localStorage.getItem("g_fav") || "[]");
let bookmarks = JSON.parse(localStorage.getItem("g_bm") || "[]");
let dark = localStorage.getItem("g_dark") === "1";
let searchOpen = false;
let bmOpen = false;
let chOpen = false;
let toastT;
let lastTrigger = null;

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  applyTheme();
  init();
});

function cacheElements() {
  elements.themeBtn = document.getElementById("themeBtn");
  elements.searchToggleBtn = document.getElementById("searchToggleBtn");
  elements.bookmarksToggleBtn = document.getElementById("bookmarksToggleBtn");
  elements.chaptersToggleBtn = document.getElementById("chaptersToggleBtn");
  elements.searchCloseBtn = document.getElementById("searchCloseBtn");
  elements.searchOverlay = document.getElementById("searchOverlay");
  elements.searchInput = document.getElementById("searchInput");
  elements.searchResults = document.getElementById("searchResults");
  elements.bookmarksPanel = document.getElementById("bookmarksPanel");
  elements.chapterPanel = document.getElementById("chapterPanel");
  elements.chapterSelect = document.getElementById("chapterSelect");
  elements.verseSelect = document.getElementById("verseSelect");
  elements.chapterList = document.getElementById("chapterList");
  elements.bookmarksList = document.getElementById("bookmarksList");
  elements.shlokaCard = document.getElementById("shlokaCard");
  elements.shlokaRef = document.getElementById("shlokaRef");
  elements.shlokaSanskrit = document.getElementById("shlokaSanskrit");
  elements.shlokaTranslit = document.getElementById("shlokaTranslit");
  elements.shlokaMeaning = document.getElementById("shlokaMeaning");
  elements.progressFill = document.getElementById("progressFill");
  elements.progressLabel = document.getElementById("progressLabel");
  elements.progressTotal = document.getElementById("progressTotal");
  elements.navCounter = document.getElementById("navCounter");
  elements.prevBtn = document.getElementById("prevBtn");
  elements.nextBtn = document.getElementById("nextBtn");
  elements.favoriteBtn = document.getElementById("favoriteBtn");
  elements.favIcon = document.getElementById("favIcon");
  elements.bookmarkBtn = document.getElementById("bookmarkBtn");
  elements.bmIcon = document.getElementById("bmIcon");
  elements.shareModal = document.getElementById("shareModal");
  elements.shareText = document.getElementById("shareText");
  elements.shareBtn = document.getElementById("shareBtn");
  elements.copyShareBtn = document.getElementById("copyShareBtn");
  elements.toast = document.getElementById("toast");
}

function bindEvents() {
  elements.searchToggleBtn.addEventListener("click", toggleSearch);
  elements.searchCloseBtn.addEventListener("click", toggleSearch);
  document.getElementById("searchOverlayBg").addEventListener("click", toggleSearch);
  elements.bookmarksToggleBtn.addEventListener("click", toggleBookmarks);
  elements.chaptersToggleBtn.addEventListener("click", toggleChapters);
  elements.themeBtn.addEventListener("click", toggleTheme);
  elements.searchInput.addEventListener("input", doSearch);
  elements.chapterSelect.addEventListener("change", onChapterChange);
  elements.verseSelect.addEventListener("change", onVerseChange);
  elements.prevBtn.addEventListener("click", () => navigate(-1));
  elements.nextBtn.addEventListener("click", () => navigate(1));
  elements.favoriteBtn.addEventListener("click", toggleFavorite);
  elements.bookmarkBtn.addEventListener("click", toggleBookmarkCurrent);
  elements.shareBtn.addEventListener("click", openShare);
  elements.copyShareBtn.addEventListener("click", copyShare);
  document.getElementById("shareOverlayBg").addEventListener("click", closeShare);
  document.addEventListener("keydown", handleKeydown);
}

function applyTheme() {
  document.body.classList.toggle("dark", dark);
  elements.themeBtn.textContent = dark ? "☀" : "☽";
}

function init() {
  if (!shlokas.length) {
    elements.shlokaRef.textContent = "No shlokas found";
    elements.shlokaMeaning.textContent = "Add entries to shlokas.js to populate the app.";
    elements.prevBtn.disabled = true;
    elements.nextBtn.disabled = true;
    return;
  }

  buildChapterSelector();
  buildChapterList();
  rebuildVerseSelect();
  render(true);
  renderBookmarks();
}

function buildChapterSelector() {
  const seen = new Set();
  elements.chapterSelect.innerHTML = "";

  shlokas.forEach((shloka) => {
    if (seen.has(shloka.chapter)) {
      return;
    }

    seen.add(shloka.chapter);
    const option = document.createElement("option");
    option.value = shloka.chapter;
    option.textContent = `Ch. ${shloka.chapter} - ${shloka.chapterName}`;
    elements.chapterSelect.appendChild(option);
  });
}

function buildChapterList() {
  elements.chapterList.innerHTML = "";
  const seen = new Set();

  shlokas.forEach((shloka) => {
    if (seen.has(shloka.chapter)) {
      return;
    }

    seen.add(shloka.chapter);
    const item = document.createElement("li");
    item.className = "chapter-item";
    item.dataset.ch = String(shloka.chapter);
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `Open chapter ${shloka.chapter}, ${shloka.chapterName}`);
    item.innerHTML = `<span class="ch-num">${shloka.chapter}</span><span>${shloka.chapterName}</span>`;
    item.addEventListener("click", () => {
      goToChapter(shloka.chapter);
      toggleChapters();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToChapter(shloka.chapter);
        toggleChapters();
      }
    });
    elements.chapterList.appendChild(item);
  });
}

function rebuildVerseSelect() {
  const chapter = Number.parseInt(elements.chapterSelect.value, 10);
  elements.verseSelect.innerHTML = "";

  shlokas
    .filter((shloka) => shloka.chapter === chapter)
    .forEach((shloka) => {
      const option = document.createElement("option");
      option.value = shloka.verse;
      option.textContent = `Verse ${shloka.verse}`;
      elements.verseSelect.appendChild(option);
    });

  const current = shlokas[idx];
  if (current && current.chapter === chapter) {
    elements.verseSelect.value = String(current.verse);
  }
}

function onChapterChange() {
  const chapter = Number.parseInt(elements.chapterSelect.value, 10);
  rebuildVerseSelect();
  const nextIndex = shlokas.findIndex((shloka) => shloka.chapter === chapter);
  if (nextIndex !== -1) {
    jumpTo(nextIndex, false);
  }
}

function onVerseChange() {
  const chapter = Number.parseInt(elements.chapterSelect.value, 10);
  const verse = Number.parseInt(elements.verseSelect.value, 10);
  const nextIndex = shlokas.findIndex((shloka) => shloka.chapter === chapter && shloka.verse === verse);
  if (nextIndex !== -1) {
    jumpTo(nextIndex, false);
  }
}

function render(skipAnim = false) {
  const shloka = shlokas[idx];
  if (!shloka) {
    return;
  }

  const fill = () => {
    elements.shlokaRef.textContent = `Chapter ${shloka.chapter} · Verse ${shloka.verse} - ${shloka.chapterName}`;
    elements.shlokaSanskrit.textContent = shloka.sanskrit;
    elements.shlokaTranslit.textContent = shloka.transliteration;
    elements.shlokaMeaning.textContent = shloka.meaning;
    updateFavoriteUI();
    updateBookmarkUI();
    updateProgress();
    syncSelectors(shloka);
  };

  if (skipAnim) {
    fill();
    return;
  }

  elements.shlokaCard.classList.add("card-exit");
  window.setTimeout(() => {
    elements.shlokaCard.classList.remove("card-exit");
    fill();
    elements.shlokaCard.classList.add("card-enter");
    window.setTimeout(() => elements.shlokaCard.classList.remove("card-enter"), 550);
  }, 270);
}

function syncSelectors(shloka) {
  elements.chapterSelect.value = String(shloka.chapter);
  rebuildVerseSelect();
  elements.verseSelect.value = String(shloka.verse);

  document.querySelectorAll(".chapter-item").forEach((item) => {
    item.classList.toggle("active", Number.parseInt(item.dataset.ch, 10) === shloka.chapter);
  });
}

function updateProgress() {
  const total = shlokas.length;
  const current = idx + 1;
  elements.progressFill.style.width = `${(current / total) * 100}%`;
  elements.progressLabel.textContent = `Shloka ${current}`;
  elements.progressTotal.textContent = `${total} shlokas`;
  elements.navCounter.textContent = `${current} / ${total}`;
  elements.prevBtn.disabled = idx === 0;
  elements.nextBtn.disabled = idx === total - 1;
}

function navigate(direction) {
  const nextIndex = idx + direction;
  if (nextIndex < 0 || nextIndex >= shlokas.length) {
    return;
  }

  idx = nextIndex;
  render();
}

function jumpTo(nextIndex, animate = true) {
  if (nextIndex < 0 || nextIndex >= shlokas.length) {
    return;
  }

  idx = nextIndex;
  render(!animate);
}

function goToChapter(chapter) {
  const nextIndex = shlokas.findIndex((shloka) => shloka.chapter === chapter);
  if (nextIndex !== -1) {
    jumpTo(nextIndex);
  }
}

function toggleFavorite() {
  const currentKey = key(shlokas[idx]);
  const favoriteIndex = favorites.indexOf(currentKey);

  if (favoriteIndex === -1) {
    favorites.push(currentKey);
    toast("❤️ Added to favorites");
  } else {
    favorites.splice(favoriteIndex, 1);
    toast("Removed from favorites");
  }

  localStorage.setItem("g_fav", JSON.stringify(favorites));
  updateFavoriteUI();
}

function updateFavoriteUI() {
  const active = favorites.includes(key(shlokas[idx]));
  elements.favIcon.textContent = active ? "❤️" : "♡";
  elements.favoriteBtn.classList.toggle("active", active);
  elements.favoriteBtn.setAttribute("aria-pressed", String(active));
}

function toggleBookmarkCurrent() {
  const currentKey = key(shlokas[idx]);
  const bookmarkIndex = bookmarks.indexOf(currentKey);

  if (bookmarkIndex === -1) {
    bookmarks.push(currentKey);
    toast("🔖 Bookmarked!");
  } else {
    bookmarks.splice(bookmarkIndex, 1);
    toast("Bookmark removed");
  }

  localStorage.setItem("g_bm", JSON.stringify(bookmarks));
  updateBookmarkUI();
  renderBookmarks();
}

function updateBookmarkUI() {
  const active = bookmarks.includes(key(shlokas[idx]));
  elements.bmIcon.textContent = active ? "📌" : "🔖";
  elements.bookmarkBtn.classList.toggle("active", active);
  elements.bookmarkBtn.setAttribute("aria-pressed", String(active));
}

function renderBookmarks() {
  elements.bookmarksList.innerHTML = "";

  if (!bookmarks.length) {
    elements.bookmarksList.innerHTML = '<p class="no-bookmarks">No bookmarks yet.<br>Tap 🔖 on any shloka<br>to save it here.</p>';
    return;
  }

  bookmarks.forEach((bookmarkKey) => {
    const shloka = shlokas.find((entry) => key(entry) === bookmarkKey);
    if (!shloka) {
      return;
    }

    const item = document.createElement("div");
    item.className = "bookmark-item";
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `Open bookmarked chapter ${shloka.chapter} verse ${shloka.verse}`);
    item.innerHTML = `<div class="bookmark-ref">Chapter ${shloka.chapter} · Verse ${shloka.verse}</div><div class="bookmark-preview">${shloka.meaning}</div>`;
    item.addEventListener("click", () => {
      jumpTo(shlokas.indexOf(shloka));
      toggleBookmarks();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jumpTo(shlokas.indexOf(shloka));
        toggleBookmarks();
      }
    });
    elements.bookmarksList.appendChild(item);
  });
}

function key(shloka) {
  return `${shloka.chapter}_${shloka.verse}`;
}

function toggleSearch() {
  searchOpen = !searchOpen;
  elements.searchOverlay.classList.toggle("active", searchOpen);
  elements.searchOverlay.hidden = !searchOpen;
  elements.searchToggleBtn.setAttribute("aria-expanded", String(searchOpen));

  if (searchOpen) {
    lastTrigger = document.activeElement;
    window.setTimeout(() => elements.searchInput.focus(), 100);
    doSearch();
  } else if (lastTrigger instanceof HTMLElement) {
    lastTrigger.focus();
  }
}

function doSearch() {
  const query = elements.searchInput.value.toLowerCase().trim();
  elements.searchResults.innerHTML = "";

  const matches = query
    ? shlokas.filter((shloka) =>
        shloka.meaning.toLowerCase().includes(query) ||
        shloka.transliteration.toLowerCase().includes(query) ||
        shloka.chapterName.toLowerCase().includes(query) ||
        shloka.sanskrit.includes(query)
      )
    : shlokas.slice(0, 7);

  if (!matches.length) {
    elements.searchResults.innerHTML = '<p class="search-empty">No results found</p>';
    return;
  }

  matches.forEach((shloka) => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.tabIndex = 0;
    item.setAttribute("role", "option");
    item.setAttribute("aria-label", `Open chapter ${shloka.chapter} verse ${shloka.verse}`);
    item.innerHTML = `<div class="search-result-ref">Ch. ${shloka.chapter} · V. ${shloka.verse} - ${shloka.chapterName}</div><div class="search-result-text">${shloka.meaning.substring(0, 110)}...</div>`;
    item.addEventListener("click", () => {
      jumpTo(shlokas.indexOf(shloka));
      toggleSearch();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jumpTo(shlokas.indexOf(shloka));
        toggleSearch();
      }
    });
    elements.searchResults.appendChild(item);
  });
}

function toggleBookmarks() {
  bmOpen = !bmOpen;
  elements.bookmarksPanel.classList.toggle("open", bmOpen);
  elements.bookmarksPanel.hidden = !bmOpen;
  elements.bookmarksToggleBtn.setAttribute("aria-expanded", String(bmOpen));
}

function toggleChapters() {
  chOpen = !chOpen;
  elements.chapterPanel.classList.toggle("open", chOpen);
  elements.chapterPanel.hidden = !chOpen;
  elements.chaptersToggleBtn.setAttribute("aria-expanded", String(chOpen));
}

function openShare() {
  const shloka = shlokas[idx];
  const shareText = `✦ Bhagavad Gita · Chapter ${shloka.chapter}, Verse ${shloka.verse}\n${shloka.chapterName}\n\n${shloka.sanskrit}\n\n"${shloka.meaning}"\n\n- Bhagavad Gita`;
  elements.shareText.textContent = shareText;
  elements.shareModal.classList.add("active");
  elements.shareModal.hidden = false;
  lastTrigger = document.activeElement;
  window.setTimeout(() => elements.copyShareBtn.focus(), 50);
}

function closeShare() {
  elements.shareModal.classList.remove("active");
  elements.shareModal.hidden = true;
  if (lastTrigger instanceof HTMLElement) {
    lastTrigger.focus();
  }
}

async function copyShare() {
  try {
    await navigator.clipboard.writeText(elements.shareText.textContent);
    toast("✓ Copied!");
  } catch {
    toast("Please copy manually");
  }

  closeShare();
}

function toggleTheme() {
  dark = !dark;
  document.body.classList.toggle("dark", dark);
  elements.themeBtn.textContent = dark ? "☀" : "☽";
  localStorage.setItem("g_dark", dark ? "1" : "0");
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(toastT);
  toastT = window.setTimeout(() => elements.toast.classList.remove("show"), 2300);
}

function handleKeydown(event) {
  if (elements.shareModal.classList.contains("active") && event.key === "Escape") {
    closeShare();
    return;
  }

  if (searchOpen) {
    if (event.key === "Escape") {
      toggleSearch();
    }
    return;
  }

  if (event.key === "Escape") {
    if (bmOpen) {
      toggleBookmarks();
      return;
    }

    if (chOpen) {
      toggleChapters();
      return;
    }
  }

  if (event.target.tagName === "SELECT" || event.target.tagName === "INPUT") {
    return;
  }

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    navigate(1);
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    navigate(-1);
  }

  if (event.key === "/") {
    event.preventDefault();
    toggleSearch();
  }

  if (event.key.toLowerCase() === "f") {
    toggleFavorite();
  }

  if (event.key.toLowerCase() === "b") {
    toggleBookmarkCurrent();
  }
}
