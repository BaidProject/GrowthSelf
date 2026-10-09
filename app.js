(() => {
  "use strict";

  const STORAGE_KEY = "growthself.v1";
  const DUTIES = [
    { id: "coding", title: "Belajar ngoding", detail: "Minimal 1 jam belajar atau berlatih coding.", placeholder: "Apa yang dipelajari atau dibuat?", minutes: 60, icon: "⌘" },
    { id: "english", title: "Belajar bahasa Inggris", detail: "Minimal 30 menit membaca, mendengar, atau berlatih.", placeholder: "Latihan atau materi yang dipelajari?", minutes: 30, icon: "文" },
    { id: "exercise", title: "Olahraga", detail: "Minimal 30 menit bergerak dan menjaga tubuh.", placeholder: "Jenis olahraga dan durasinya?", minutes: 30, icon: "↗" },
    { id: "insight", title: "Tambah wawasan", detail: "Baca atau tonton konten yang membuatmu lebih tahu.", placeholder: "Insight apa yang kamu dapatkan?", icon: "◇" },
    { id: "new", title: "Mencoba satu hal baru", detail: "Keluar sedikit dari kebiasaan. Catat percobaannya.", placeholder: "Hal baru apa yang kamu coba?", icon: "✧" }
  ];
  const LIMITS = [
    { id: "game", title: "Bermain game", icon: "🎮", unit: "menit", cap: 120, maxLabel: "2 jam / 120 menit", hint: "Batas 2 jam per hari." },
    { id: "shorts", title: "Scrolling / short video", icon: "📱", unit: "video", cap: 30, maxLabel: "30 video", hint: "Maksimal 30 video per hari." },
    { id: "comic", title: "Membaca komik", icon: "📖", unit: "chapter", cap: 10, maxLabel: "10 chapter", hint: "Target 5 chapter; lebih dari 10 melanggar batas." }
  ];
  const RANKS = [
    { name: "Neophyte", cost: 3000, numeral: "I", caption: "Awal dari perjalanan yang besar." },
    { name: "Squire", cost: 5000, numeral: "II", caption: "Konsistensi mulai membentuk karakter." },
    { name: "Baron", cost: 7000, numeral: "III", caption: "Kamu membangun kebiasaan yang bertahan." },
    { name: "Viscount", cost: 9000, numeral: "IV", caption: "Disiplinmu mulai menjadi teladan." },
    { name: "Marquis", cost: 11000, numeral: "V", caption: "Ketekunan mengantarmu lebih jauh." },
    { name: "Archduke", cost: 13000, numeral: "VI", caption: "Kamu memimpin dirimu dengan kuat." },
    { name: "Sovereign", cost: 15000, numeral: "VII", caption: "Kendali atas diri adalah kekuatanmu." },
    { name: "Emperor", cost: 17000, numeral: "VIII", caption: "Perjalananmu menginspirasi orang lain." },
    { name: "Divine Primarch", cost: 20000, numeral: "IX", caption: "Kamu telah melampaui batas yang lama." },
    { name: "Zeus", cost: 0, numeral: "X", caption: "Puncak telah tercapai. Tetaplah bertumbuh." }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const today = () => new Date().toLocaleDateString("en-CA");
  const prettyDate = (date, options = { day: "numeric", month: "long", year: "numeric" }) =>
    new Intl.DateTimeFormat("id-ID", options).format(date);
  const makeDay = () => ({ duties: {}, entertainment: { game: 0, shorts: 0, comic: 0 }, violations: [], dutyAward: false, journalAward: false });
  const makeInitialState = () => ({
    profile: { name: "Adventurer", email: "" },
    balance: 0,
    earned: 0,
    startedAt: today(),
    activities: {},
    journal: {},
    projects: [],
    transactions: [],
    theme: "dark"
  });

  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    state = saved && typeof saved === "object" ? { ...makeInitialState(), ...saved } : makeInitialState();
  } catch (error) {
    console.error("GrowthSelf: data lokal tidak dapat dibaca.", error);
    state = makeInitialState();
  }
  if (!state.activities || typeof state.activities !== "object") state.activities = {};
  if (!state.journal || typeof state.journal !== "object") state.journal = {};
  if (!Array.isArray(state.projects)) state.projects = [];
  if (!Array.isArray(state.transactions)) state.transactions = [];
  const dayData = (date = today()) => {
    if (!state.activities[date]) state.activities[date] = makeDay();
    const data = state.activities[date];
    data.duties ||= {};
    data.entertainment ||= { game: 0, shorts: 0, comic: 0 };
    data.violations ||= [];
    data.dutyAward ||= false;
    data.journalAward ||= false;
    return data;
  };
  let calendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let timers = {};
  let journalSaveTimeout;
  Object.entries(dayData().duties).forEach(([id, entry]) => {
    if (entry.timerStartedAt && !entry.done) timers[id] = entry.timerStartedAt;
  });
  let selectedTags = new Set(state.journal[today()]?.tags || []);
  window.setInterval(() => {
    if (!Object.keys(timers).length) return;
    $$(".timer-display").forEach(display => {
      const id = display.closest(".duty-item")?.querySelector("[data-timer]")?.dataset.timer;
      if (id) display.textContent = formatTime(timerElapsed(id));
    });
  }, 1000);

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("GrowthSelf: penyimpanan lokal gagal.", error);
      toast("Penyimpanan browser penuh atau tidak tersedia. Ekspor data sebelum menutup halaman.", "bad");
    }
  }

  function toast(message, kind = "good") {
    const node = document.createElement("div");
    node.className = `toast ${kind}`;
    node.textContent = message;
    $("#toast-region").append(node);
    window.setTimeout(() => node.remove(), 3700);
  }

  function addPoints(amount, label, date = today()) {
    state.balance = Number(state.balance || 0) + amount;
    if (amount > 0) state.earned = Number(state.earned || 0) + amount;
    state.transactions.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, amount, label, date, balance: state.balance });
    persist();
  }

  function dateShift(date, days) {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-CA");
  }

  function isComplete(date) {
    const entry = state.activities[date];
    return Boolean(entry && DUTIES.every(({ id }) => entry.duties?.[id]?.done));
  }

  function getStreak() {
    let streak = 0;
    let cursor = isComplete(today()) ? today() : dateShift(today(), -1);
    while (isComplete(cursor)) {
      streak += 1;
      cursor = dateShift(cursor, -1);
    }
    return streak;
  }

  function getBestStreak() {
    const dates = Object.keys(state.activities).filter(isComplete).sort();
    let best = 0;
    let current = 0;
    let previous = "";
    dates.forEach(date => {
      current = previous && dateShift(previous, 1) === date ? current + 1 : 1;
      best = Math.max(best, current);
      previous = date;
    });
    return best;
  }

  function getRank(points = Number(state.balance) || 0) {
    if (points < 0) return { index: 0, progress: points, current: RANKS[0], next: RANKS[1], lower: 0, upper: RANKS[0].cost };
    let lower = 0;
    for (let i = 0; i < RANKS.length - 1; i += 1) {
      const upper = lower + RANKS[i].cost;
      if (points < upper) return { index: i, progress: points - lower, current: RANKS[i], next: RANKS[i + 1], lower, upper };
      lower = upper;
    }
    return { index: RANKS.length - 1, progress: 0, current: RANKS.at(-1), next: null, lower, upper: lower };
  }

  function renderDashboard() {
    const date = new Date();
    const name = state.profile.name || "Adventurer";
    const current = dayData();
    const completed = DUTIES.filter(({ id }) => current.duties[id]?.done).length;
    const rank = getRank();
    $("#today-label").textContent = prettyDate(date, { weekday: "long", day: "numeric", month: "long" });
    $("#duty-date-heading").textContent = prettyDate(date, { weekday: "long", day: "numeric", month: "long" });
    $("#journal-date").textContent = prettyDate(date, { day: "numeric", month: "short", year: "numeric" });
    $("#profile-name").textContent = name;
    $("#profile-rank").textContent = rank.current.name;
    $("#avatar").textContent = name.trim().charAt(0).toUpperCase() || "A";
    $("#top-avatar").textContent = name.trim().charAt(0).toUpperCase() || "A";
    $("#welcome-name").textContent = name;
    $("#journey-day").textContent = String(Math.max(1, Math.floor((new Date(`${today()}T12:00:00`) - new Date(`${state.startedAt}T12:00:00`)) / 86400000) + 1)).padStart(2, "0");
    $("#hero-rank").textContent = rank.current.name;
    $("#rank-caption").textContent = rank.current.caption;
    $("#rank-seal small").textContent = rank.current.numeral;
    $("#rank-seal").style.setProperty("--rank-hue", String((39 + rank.index * 31) % 360));
    $("#hero-points").textContent = Number(state.balance || 0).toLocaleString("id-ID");
    $("#hero-earned").textContent = Number(state.earned || 0).toLocaleString("id-ID");
    $("#rank-progress-label").textContent = rank.next ? `PROGRESS MENUJU ${rank.next.name.toUpperCase()}` : "PANGKAT MAKSIMUM";
    $("#rank-progress-text").textContent = rank.next
      ? `${Math.max(0, rank.progress).toLocaleString("id-ID")} / ${rank.current.cost.toLocaleString("id-ID")} XP${rank.progress < 0 ? ` · masih ${Math.abs(rank.progress).toLocaleString("id-ID")} di bawah 0` : ""}`
      : "ZEUS · MAX LEVEL";
    $("#rank-progress-fill").style.width = rank.next ? `${Math.max(0, Math.min(100, rank.progress / rank.current.cost * 100))}%` : "100%";
    $("#rank-next").textContent = rank.next ? `Selanjutnya: ${rank.next.name} ↗` : "Pangkat tertinggi ✦";
    $("#today-points").textContent = state.transactions.filter(entry => entry.date === today()).reduce((sum, entry) => sum + entry.amount, 0).toLocaleString("id-ID");
    $("#today-points-note").textContent = current.violations.length ? `${current.violations.length} batas hiburan dilanggar` : current.dutyAward ? "Semua kewajiban tuntas" : "Akan diperbarui saat check-in";
    $("#streak-count").textContent = String(getBestStreak());
    $("#streak-note").textContent = getStreak() > 0 ? `${getStreak()} hari berturut-turut saat ini` : "Mulai bangun konsistensi hari ini";
    $("#duties-count").textContent = String(completed);
    $("#duties-note").textContent = completed === 5 ? "Semua kewajiban selesai!" : `${5 - completed} kewajiban lagi untuk bonus +33`;
    $("#mini-duty-count").textContent = `${completed} / 5`;
    $("#duty-score-badge").textContent = `${completed} / 5`;
    $("#duty-count-label").textContent = `${completed} / 5 selesai`;
    $("#mini-duty-list").innerHTML = DUTIES.map(item => {
      const done = current.duties[item.id]?.done;
      return `<div class="mini-duty ${done ? "done" : ""}"><span class="mini-check">${done ? "✓" : ""}</span><span>${item.title}</span></div>`;
    }).join("");
    $("#game-status").textContent = `${current.entertainment.game} / 120 m`;
    $("#short-status").textContent = `${current.entertainment.shorts} / 30`;
    $("#comic-status").textContent = `${current.entertainment.comic} / 10`;
    const days = Object.values(state.activities).filter(entry => DUTIES.every(({ id }) => entry.duties?.[id]?.done)).length;
    if (!state.transactions.length) $("#recent-activity").innerHTML = '<div class="empty-state">Perjalananmu dimulai dari satu langkah. Selesaikan rutinitas hari ini.</div>';
    else $("#recent-activity").innerHTML = state.transactions.slice(0, 4).map(entry => `
      <div class="activity-row"><span class="activity-icon">${entry.amount > 0 ? "✦" : "!"}</span><div class="activity-copy"><strong>${escapeHTML(entry.label)}</strong><small>${prettyDate(new Date(`${entry.date}T12:00:00`), { day: "numeric", month: "short" })}</small></div><span class="activity-points">${entry.amount > 0 ? "+" : ""}${entry.amount} XP</span></div>`).join("");
    $("#history-points").textContent = Number(state.balance || 0).toLocaleString("id-ID");
    $("#history-days").textContent = String(days);
    $("#history-projects").textContent = String(state.projects.length);
    renderDutyList();
    renderLimits();
    renderJournal();
    renderProjects();
    renderHistory();
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function renderDutyList() {
    const current = dayData();
    $("#duty-list").innerHTML = DUTIES.map((item, index) => {
      const entry = current.duties[item.id] || {};
      const done = Boolean(entry.done);
      const running = timers[item.id];
      let timerButton = "";
      if (item.minutes) {
        const seconds = timerElapsed(item.id);
      timerButton = `<button type="button" class="timer-button ${running ? "running" : ""}" data-timer="${item.id}">${running ? "Jeda timer" : seconds ? "Lanjutkan timer" : "▷ Timer"}</button><button type="button" class="timer-button" data-reset-timer="${item.id}" ${seconds || running ? "" : "hidden"} aria-label="Atur ulang timer">↺</button><span class="timer-display" ${running || seconds ? "" : "hidden"}>${formatTime(seconds)}</span>`;
      }
      return `<article class="duty-item ${done ? "is-done" : ""}">
        <span class="duty-number">${done ? "✓" : String(index + 1).padStart(2, "0")}</span>
        <div class="duty-info"><h4>${item.icon} &nbsp;${item.title}</h4><p>${item.detail}</p>
          <input class="duty-proof" data-proof="${item.id}" ${done ? "disabled" : ""} value="${escapeHTML(entry.evidence || "")}" placeholder="${item.placeholder}" aria-label="Bukti ${item.title}" />
        </div><div class="duty-actions">${timerButton}<button type="button" class="complete-button" data-complete="${item.id}" ${done ? "disabled" : ""}>${done ? "Tuntas ✓" : "Check-in"}</button></div>
      </article>`;
    }).join("");
    $$("[data-proof]", $("#duty-list")).forEach(input => input.addEventListener("input", () => {
      current.duties[input.dataset.proof] ||= {};
      current.duties[input.dataset.proof].evidence = input.value;
      persist();
    }));
    $$("[data-complete]", $("#duty-list")).forEach(button => button.addEventListener("click", () => completeDuty(button.dataset.complete)));
    $$("[data-timer]", $("#duty-list")).forEach(button => button.addEventListener("click", () => toggleTimer(button.dataset.timer)));
    $$("[data-reset-timer]", $("#duty-list")).forEach(button => button.addEventListener("click", () => resetTimer(button.dataset.resetTimer)));
  }

  function timerElapsed(id) {
    const saved = dayData().duties[id]?.timerSeconds || 0;
    const active = timers[id] ? Math.floor((Date.now() - timers[id]) / 1000) : 0;
    return saved + active;
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  function toggleTimer(id) {
    const entry = dayData().duties[id] ||= {};
    if (timers[id]) {
      entry.timerSeconds = (entry.timerSeconds || 0) + Math.floor((Date.now() - timers[id]) / 1000);
      delete timers[id];
      delete entry.timerStartedAt;
    } else {
      timers[id] = Date.now();
      entry.timerStartedAt = timers[id];
    }
    persist();
    renderDutyList();
  }

  function resetTimer(id) {
    const entry = dayData().duties[id] ||= {};
    delete timers[id];
    delete entry.timerStartedAt;
    entry.timerSeconds = 0;
    persist();
    renderDutyList();
  }

  function completeDuty(id) {
    const item = DUTIES.find(duty => duty.id === id);
    const entry = dayData().duties[id] ||= {};
    if (!item || entry.done) return;
    if ((entry.evidence || "").trim().length < 12) {
      toast("Tambahkan bukti singkat (minimal 12 karakter) sebelum check-in.", "bad");
      $(`[data-proof="${id}"]`)?.focus();
      return;
    }
    const seconds = timerElapsed(id);
    entry.done = true;
    if (timers[id]) {
      entry.timerSeconds = (entry.timerSeconds || 0) + Math.floor((Date.now() - timers[id]) / 1000);
      delete timers[id];
      delete entry.timerStartedAt;
    }
    toast(`${item.title} dicatat. Teruskan, satu langkah lagi.`, "good");
    if (DUTIES.every(duty => dayData().duties[duty.id]?.done) && !dayData().dutyAward) {
      dayData().dutyAward = true;
      addPoints(33, "Semua kewajiban harian selesai");
      toast("Semua kewajiban tuntas! +33 poin.", "good");
    } else persist();
    renderDashboard();
  }

  function renderLimits() {
    const current = dayData();
    $("#limits-panel").innerHTML = LIMITS.map(limit => {
      const count = Number(current.entertainment[limit.id]) || 0;
      const violated = current.violations.includes(limit.id);
      const gentleWarning = limit.id === "comic" && count > 5 && count <= 10;
      return `<div class="limit-control"><span class="limit-emoji">${limit.icon}</span><div class="limit-description"><strong>${limit.title}</strong><small>${limit.hint} ${limit.id === "comic" ? "6–10 chapter: melewati target, belum penalti." : ""}</small></div><span class="limit-meter">${count} / ${limit.cap} ${limit.unit}</span><input class="limit-input" type="number" min="0" max="9999" step="1" value="${count}" data-limit="${limit.id}" aria-label="Catat ${limit.title}" />${violated ? '<span class="limit-warning">Batas terlampaui · penalti -99 poin sudah dicatat hari ini.</span>' : gentleWarning ? '<span class="limit-warning">Kamu melewati target 5 chapter; pertahankan di bawah batas 10.</span>' : ""}</div>`;
    }).join("");
    $$("[data-limit]", $("#limits-panel")).forEach(input => input.addEventListener("change", () => updateLimit(input.dataset.limit, input.value)));
  }

  function updateLimit(id, rawValue) {
    const limit = LIMITS.find(entry => entry.id === id);
    if (!limit) return;
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast("Masukkan jumlah berupa bilangan bulat nol atau lebih.", "bad");
      renderLimits();
      return;
    }
    const current = dayData();
    current.entertainment[id] = parsed;
    if (parsed > limit.cap && !current.violations.includes(id)) {
      current.violations.push(id);
      addPoints(-99, `Pelanggaran batas hiburan: ${limit.title}`);
      toast(`Batas ${limit.title.toLowerCase()} terlampaui. Penalti -99 poin dicatat.`, "bad");
    } else persist();
    renderDashboard();
  }

  function estimateHuman(text, minimumWords = 80) {
    const words = text.trim().toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || [];
    if (words.length < minimumWords) return { score: null, words: words.length };
    const unique = new Set(words).size / words.length;
    const sentences = text.split(/[.!?]+/).map(part => part.trim()).filter(Boolean);
    const avgSentence = words.length / Math.max(1, sentences.length);
    const sentenceLengths = sentences.map(part => (part.match(/[\p{L}\p{N}'’-]+/gu) || []).length);
    const mean = sentenceLengths.reduce((sum, count) => sum + count, 0) / Math.max(1, sentenceLengths.length);
    const variance = sentenceLengths.reduce((sum, count) => sum + (count - mean) ** 2, 0) / Math.max(1, sentenceLengths.length);
    const personal = (text.match(/\b(saya|aku|ku|gue|menurutku|rasanya|belajar|mencoba|kesulitan|hari ini|ternyata|merasa)\b/gi) || []).length;
    const naturalPunctuation = /[,!?…\n]/.test(text);
    const repeated = sentenceLengths.length > 3 && new Set(sentenceLengths).size <= 2;
    const score = Math.max(38, Math.min(94, Math.round(49 + unique * 26 + Math.min(12, personal * 1.2) + Math.min(8, Math.sqrt(variance)) + (naturalPunctuation ? 5 : 0) - (repeated ? 8 : 0) - (avgSentence > 35 ? 5 : 0))));
    return { score, words: words.length };
  }

  function renderDetector(text, prefix, minWords = 80) {
    const result = estimateHuman(text, minWords);
    const confidence = $(`#${prefix}-confidence`);
    const bar = $(`#${prefix}-human-bar`);
    const note = $(`#${prefix}-detector-note`) || $(`#${prefix}-detector-status`);
    if (result.score === null) {
      confidence.textContent = "—";
      bar.style.width = "0";
      note.textContent = `Tulis setidaknya ${minWords} kata untuk melihat estimasi. Estimasi ≥60% diperlukan untuk poin.`;
      return result;
    }
    confidence.textContent = `${result.score}% human`;
    bar.style.width = `${result.score}%`;
    bar.style.background = result.score >= 60 ? "#90b98d" : "#d58b7c";
    if (prefix === "journal") note.textContent = result.score >= 60
      ? `Estimasi ${result.score}% human. Heuristik lokal bukan bukti pasti; ambang poin adalah 60%.`
      : `Estimasi ${result.score}% human. Revisi dengan refleksi dan pengalaman spesifik sebelum bonus poin.`;
    else note.textContent = result.score >= 60
      ? `Estimasi ${result.score}% human. Analisis ini indikatif, bukan keputusan definitif.`
      : `Estimasi ${result.score}% human. Perjelas pengalaman personal sebelum menyimpan project.`;
    return result;
  }

  function countWords(text) {
    return (text.trim().match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  }

  function renderJournal() {
    const date = today();
    const entry = state.journal[date] || { title: "", body: "", tags: [] };
    if (document.activeElement !== $("#journal-title")) $("#journal-title").value = entry.title || "";
    if (document.activeElement !== $("#journal-body")) $("#journal-body").value = entry.body || "";
    selectedTags = new Set(entry.tags || []);
    $$(".tag").forEach(tag => tag.classList.toggle("selected", selectedTags.has(tag.dataset.tag)));
    const words = countWords($("#journal-body").value);
    $("#word-count").textContent = String(words);
    $("#page-count").textContent = (words / 250).toFixed(1);
    $("#journal-progress-fill").style.width = `${Math.min(100, words / 500 * 100)}%`;
    $("#journal-goal-status").textContent = `${Math.min(words, 500)} / 500 kata`;
    renderDetector($("#journal-body").value, "journal");
    const previous = Object.entries(state.journal).filter(([day, saved]) => day !== date && saved.body?.trim()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 4);
    $("#journal-archive").innerHTML = previous.length ? previous.map(([day, saved]) => `<div class="archive-entry"><span class="archive-date">${prettyDate(new Date(`${day}T12:00:00`), { day: "numeric", month: "short" })}</span><div><strong>${escapeHTML(saved.title || "Refleksi harian")}</strong><small>${countWords(saved.body)} kata · ${(saved.tags || []).map(tag => `#${escapeHTML(tag)}`).join(" ")}</small></div></div>`).join("") : '<div class="empty-state">Catatan yang kamu simpan akan muncul di sini.</div>';
  }

  function saveJournal(silent = false) {
    const body = $("#journal-body").value.trim();
    const title = $("#journal-title").value.trim();
    if (!body) {
      if (!silent) toast("Tuliskan refleksi terlebih dahulu sebelum menyimpan.", "bad");
      $("#journal-body").focus();
      return;
    }
    const existing = state.journal[today()] || {};
    state.journal[today()] = { title, body, tags: [...selectedTags], updatedAt: new Date().toISOString() };
    const result = estimateHuman(body);
    if (countWords(body) >= 500 && result.score !== null && result.score >= 60 && !dayData().journalAward) {
      dayData().journalAward = true;
      addPoints(33, "Bonus jurnal: dua halaman penuh");
      if (!silent) toast("Dua halaman refleksi tersimpan! +33 poin.", "good");
    } else {
      persist();
      if (!silent && countWords(body) >= 500 && result.score !== null && result.score < 60) toast("Catatan tersimpan, tetapi estimasi human belum mencapai 60%; bonus belum diberikan.", "bad");
      else if (!silent && existing.body && existing.body !== body) toast("Catatan hari ini diperbarui.", "good");
      else if (!silent) toast("Catatan journey tersimpan.", "good");
    }
    $("#save-status").textContent = "TERSIMPAN";
    renderDashboard();
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Browser ini tidak mendukung penyimpanan file lokal."));
        return;
      }
      const request = indexedDB.open("GrowthSelfFiles", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("projects", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Database file tidak dapat dibuka."));
    });
  }

  async function storeFile(id, file) {
    if (!file) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("projects", "readwrite");
      transaction.objectStore("projects").put({ id, file, name: file.name, type: file.type });
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error || new Error("File gagal disimpan.")); };
      transaction.onabort = () => { db.close(); reject(transaction.error || new Error("Penyimpanan file dibatalkan.")); };
    });
  }

  async function readFile(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction("projects", "readonly").objectStore("projects").get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error || new Error("File tidak dapat dibaca.")); };
    });
  }

  async function removeFile(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("projects", "readwrite");
      transaction.objectStore("projects").delete(id);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error || new Error("File tidak dapat dihapus.")); };
    });
  }

  function renderProjects() {
    const techs = [...new Set(state.projects.flatMap(project => project.tech.split(",").map(value => value.trim()).filter(Boolean)))];
    $("#project-total").textContent = `${state.projects.length} project`;
    $("#tech-total").textContent = techs.length ? techs.slice(0, 4).join(", ") + (techs.length > 4 ? ` +${techs.length - 4}` : "") : "Belum ada";
    $("#project-gallery").innerHTML = state.projects.length ? [...state.projects].sort((a, b) => b.date.localeCompare(a.date)).map(project => `
      <article class="project-card"><div class="project-cover" id="cover-${escapeHTML(project.id)}">${project.preview ? `<img alt="Preview ${escapeHTML(project.title)}" src="${escapeHTML(project.preview)}" />` : "✧"}<small>${project.fileName ? escapeHTML(project.fileName) : "CATATAN PROJECT"}</small></div><div class="project-body"><div class="project-meta"><span class="confidence">${project.humanScore}% human · heuristik</span><time>${prettyDate(new Date(`${project.date}T12:00:00`), { day: "numeric", month: "short", year: "numeric" })}</time></div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p><div class="project-tags">${project.tech.split(",").map(value => value.trim()).filter(Boolean).map(value => `<span>${escapeHTML(value)}</span>`).join("")}</div><div class="project-links">${project.url ? `<a href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer">Buka GitHub ↗</a>` : project.fileName ? `<button data-download="${escapeHTML(project.id)}">Unduh ${escapeHTML(project.fileName)} ↓</button>` : "<span></span>"}<button data-delete="${escapeHTML(project.id)}">Hapus</button></div></div></article>`).join("") : '<div class="panel empty-state" style="grid-column:1/-1;padding:44px">Belum ada project. Simpan hasil karyamu dan lihat perjalananmu bertumbuh.</div>';
    $$("[data-delete]", $("#project-gallery")).forEach(button => button.addEventListener("click", () => deleteProject(button.dataset.delete)));
    $$("[data-download]", $("#project-gallery")).forEach(button => button.addEventListener("click", () => downloadProject(button.dataset.download)));
    state.projects.filter(project => project.preview).forEach(async project => {
      try {
        const saved = await readFile(project.id);
        const image = $(`#cover-${CSS.escape(project.id)} img`);
        if (saved && image) image.src = URL.createObjectURL(saved.file);
      } catch (error) {
        console.error("GrowthSelf: preview project tidak dapat dibaca.", error);
      }
    });
  }

  async function submitProject(event) {
    event.preventDefault();
    const description = $("#project-description").value.trim();
    const analysis = estimateHuman(description, 30);
    if (countWords(description) < 30 || analysis.score === null) {
      toast("Deskripsi project perlu minimal 30 kata agar dapat dianalisis.", "bad");
      return;
    }
    if (analysis.score < 60) {
      $("#project-detector-note").textContent = "Revisi deskripsi dengan pengalaman personal dan proses yang spesifik sebelum menyimpan.";
      toast("Estimasi human di bawah ambang 60%. Revisi deskripsi sebelum menyimpan.", "bad");
      return;
    }
    const file = $("#project-file").files[0];
    if (file && file.size > 8 * 1024 * 1024) {
      toast("File maksimal 8 MB. Pilih file yang lebih kecil.", "bad");
      return;
    }
    const url = $("#project-url").value.trim();
    if (url && !/^https:\/\/(www\.)?github\.com\//i.test(url)) {
      toast("Gunakan tautan HTTPS GitHub yang valid.", "bad");
      return;
    }
    const id = `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    try {
      await storeFile(id, file);
    } catch (error) {
      console.error("GrowthSelf: file project tidak dapat disimpan.", error);
      toast(error.message || "File project gagal disimpan.", "bad");
      return;
    }
    state.projects.push({
      id,
      title: $("#project-name").value.trim(),
      description,
      tech: $("#project-tech").value.trim(),
      date: $("#project-date").value || today(),
      url,
      fileName: file?.name || "",
      preview: Boolean(file && file.type.startsWith("image/")),
      humanScore: analysis.score
    });
    persist();
    $("#project-modal").close();
    $("#project-form").reset();
    $("#project-date").value = today();
    renderDashboard();
    toast("Project berhasil disimpan di perangkat ini.", "good");
  }

  async function deleteProject(id) {
    const project = state.projects.find(entry => entry.id === id);
    if (!project) return;
    if (!window.confirm(`Hapus project "${project.title}" dari perangkat ini?`)) return;
    try {
      await removeFile(id);
    } catch (error) {
      console.error("GrowthSelf: file project tidak dapat dihapus.", error);
      toast(error.message || "File project gagal dihapus.", "bad");
      return;
    }
    state.projects = state.projects.filter(entry => entry.id !== id);
    persist();
    renderDashboard();
    toast("Project dihapus dari perangkat ini.", "good");
  }

  async function downloadProject(id) {
    try {
      const saved = await readFile(id);
      if (!saved) {
        toast("File tidak ditemukan di penyimpanan perangkat ini.", "bad");
        return;
      }
      const url = URL.createObjectURL(saved.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = saved.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("GrowthSelf: file project tidak dapat diunduh.", error);
      toast(error.message || "File project gagal diunduh.", "bad");
    }
  }

  function renderHistory() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    $("#calendar-month").textContent = prettyDate(calendarDate, { month: "long", year: "numeric" });
    const firstWeekday = new Date(year, month, 1).getDay();
    const offset = (firstWeekday + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const headers = ["S", "S", "R", "K", "J", "S", "M"];
    $("#calendar-grid").innerHTML = [...headers.map(day => `<span>${day}</span>`), ...Array.from({ length: offset }, () => '<span class="calendar-day"></span>'), ...Array.from({ length: total }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${day}`;
      const complete = isComplete(date);
      return `<span class="calendar-day ${complete ? "complete" : ""} ${date === today() ? "today" : ""}" title="${complete ? "Semua kewajiban selesai" : ""}">${index + 1}</span>`;
    })].join("");
    const dates = Array.from({ length: 7 }, (_, index) => dateShift(today(), index - 6));
    const values = dates.map(date => state.transactions.filter(entry => entry.date === date).reduce((sum, entry) => sum + entry.amount, 0));
    const max = Math.max(33, ...values);
    $("#weekly-chart").innerHTML = dates.map((date, index) => `<div class="chart-day"><em>${values[index] ? `${values[index] > 0 ? "+" : ""}${values[index]}` : ""}</em><div class="chart-bar" style="height:${Math.max(2, Math.min(100, Math.max(0, values[index]) / max * 100))}%"></div><small>${prettyDate(new Date(`${date}T12:00:00`), { weekday: "narrow" })}</small></div>`).join("");
    $("#points-history").innerHTML = state.transactions.length ? state.transactions.slice(0, 40).map(entry => `
      <div class="point-row"><span class="point-sign ${entry.amount < 0 ? "negative" : ""}">${entry.amount > 0 ? "+" : "−"}</span><div class="point-detail"><strong>${escapeHTML(entry.label)}</strong><small>${prettyDate(new Date(`${entry.date}T12:00:00`), { day: "numeric", month: "long", year: "numeric" })} · saldo ${Number(entry.balance).toLocaleString("id-ID")} XP</small></div><span class="point-amount ${entry.amount < 0 ? "negative" : ""}">${entry.amount > 0 ? "+" : ""}${entry.amount} XP</span></div>`).join("") : '<div class="empty-state">Riwayat poin akan tercatat otomatis saat kamu mendapat poin atau melanggar batas.</div>';
  }

  function navigate(page) {
    if (!$(`#page-${page}`)) return;
    $$(".page").forEach(section => section.classList.toggle("active", section.id === `page-${page}`));
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === page));
    $("#page-breadcrumb").textContent = ({ dashboard: "Dashboard", duties: "Rutinitas harian", journal: "Catatan journey", projects: "Project coding", history: "Riwayat & statistik" })[page];
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveProfile(event) {
    event.preventDefault();
    const name = $("#display-name").value.trim();
    if (!name) {
      toast("Nama tampilan tidak boleh kosong.", "bad");
      return;
    }
    state.profile = { name, email: $("#display-email").value.trim() };
    persist();
    $("#profile-modal").close();
    renderDashboard();
    toast("Profil lokal diperbarui.", "good");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `growthself-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function setup() {
    document.documentElement.dataset.theme = state.theme || "dark";
    $("#today-label").textContent = prettyDate(new Date(), { weekday: "long", day: "numeric", month: "long" });
    $("#duty-date-heading").textContent = prettyDate(new Date(), { weekday: "long", day: "numeric", month: "long" });
    $("#project-date").value = today();
    $$("[data-page]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
    $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#theme-toggle").addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = state.theme;
      persist();
    });
    $("#profile-button").addEventListener("click", () => {
      $("#display-name").value = state.profile.name || "";
      $("#display-email").value = state.profile.email || "";
      $("#profile-modal").showModal();
    });
    $("#top-avatar").addEventListener("click", () => $("#profile-button").click());
    $("#export-data").addEventListener("click", exportData);
    $("#cancel-profile").addEventListener("click", () => $("#profile-modal").close());
    $("#profile-form").addEventListener("submit", saveProfile);
    $("#new-project").addEventListener("click", () => $("#project-modal").showModal());
    $("#cancel-project").addEventListener("click", () => $("#project-modal").close());
    $("#project-form").addEventListener("submit", submitProject);
    $("#project-description").addEventListener("input", () => renderDetector($("#project-description").value, "project", 30));
    $("#journal-title").addEventListener("input", () => {
      $("#save-status").textContent = "BELUM DISIMPAN";
      scheduleJournalSave();
    });
    $("#journal-body").addEventListener("input", () => {
      $("#save-status").textContent = "BELUM DISIMPAN";
      const words = countWords($("#journal-body").value);
      $("#word-count").textContent = String(words);
      $("#page-count").textContent = (words / 250).toFixed(1);
      $("#journal-progress-fill").style.width = `${Math.min(100, words / 500 * 100)}%`;
      $("#journal-goal-status").textContent = `${Math.min(words, 500)} / 500 kata`;
      renderDetector($("#journal-body").value, "journal");
      scheduleJournalSave();
    });
    $$(".tag").forEach(tag => tag.addEventListener("click", () => {
      if (selectedTags.has(tag.dataset.tag)) selectedTags.delete(tag.dataset.tag);
      else selectedTags.add(tag.dataset.tag);
      tag.classList.toggle("selected", selectedTags.has(tag.dataset.tag));
      $("#save-status").textContent = "BELUM DISIMPAN";
      scheduleJournalSave();
    }));
    $("#save-journal").addEventListener("click", () => saveJournal(false));
    $("#cal-prev").addEventListener("click", () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderHistory(); });
    $("#cal-next").addEventListener("click", () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderHistory(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") $("#sidebar").classList.remove("open"); });
    renderDashboard();
  }

  function scheduleJournalSave() {
    window.clearTimeout(journalSaveTimeout);
    journalSaveTimeout = window.setTimeout(() => {
      if ($("#journal-body").value.trim()) saveJournal(true);
    }, 900);
  }

  setup();
})();
