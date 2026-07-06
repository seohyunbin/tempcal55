const STORAGE_KEY = "temp_calendar_items_v2";
const CHECK_KEY = "temp_calendar_checks_v2";
const RECORD_KEY = "temp_calendar_records_v2";

const today = startOfDay(new Date());
let selectedDate = new Date(today);
let displayMonth = startOfMonth(today);
let recordView = "list";
let selectedRecordItemId = null;
let items = loadItems();
let checks = loadChecks();
let records = loadRecords();
let editingId = null;

const els = {
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  selectedDateItems: document.getElementById("selectedDateItems"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  openAddBtn: document.getElementById("openAddBtn"),
  manageBtn: document.getElementById("manageBtn"),
  recordBtn: document.getElementById("recordBtn"),
  itemSheetBackdrop: document.getElementById("itemSheetBackdrop"),
  manageSheetBackdrop: document.getElementById("manageSheetBackdrop"),
  recordSheetBackdrop: document.getElementById("recordSheetBackdrop"),
  closeSheetBtn: document.getElementById("closeSheetBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  closeManageBtn: document.getElementById("closeManageBtn"),
  closeRecordBtn: document.getElementById("closeRecordBtn"),
  recordBackBtn: document.getElementById("recordBackBtn"),
  itemForm: document.getElementById("itemForm"),
  nameInput: document.getElementById("nameInput"),
  startInput: document.getElementById("startInput"),
  endInput: document.getElementById("endInput"),
  intervalInput: document.getElementById("intervalInput"),
  memoInput: document.getElementById("memoInput"),
  sheetModeLabel: document.getElementById("sheetModeLabel"),
  manageList: document.getElementById("manageList"),
  resetBtn: document.getElementById("resetBtn"),
  selectedItemTemplate: document.getElementById("selectedItemTemplate"),
  recordTitle: document.getElementById("recordTitle"),
  recordListView: document.getElementById("recordListView"),
  recordDetailView: document.getElementById("recordDetailView"),
  recordItemList: document.getElementById("recordItemList"),
  recordItemTitle: document.getElementById("recordItemTitle"),
  recordItemMeta: document.getElementById("recordItemMeta"),
  recordForm: document.getElementById("recordForm"),
  recordDateInput: document.getElementById("recordDateInput"),
  recordFilesInput: document.getElementById("recordFilesInput"),
  recordCameraInput: document.getElementById("recordCameraInput"),
  pickPhotosBtn: document.getElementById("pickPhotosBtn"),
  takePhotoBtn: document.getElementById("takePhotoBtn"),
  recordGallery: document.getElementById("recordGallery"),
};

seedIfEmpty();
renderAll();
registerPwa();

els.prevMonthBtn.addEventListener("click", () => {
  displayMonth = addMonths(displayMonth, -1);
  renderAll();
});

els.nextMonthBtn.addEventListener("click", () => {
  displayMonth = addMonths(displayMonth, 1);
  renderAll();
});

els.openAddBtn.addEventListener("click", () => openItemSheet());
els.closeSheetBtn.addEventListener("click", closeItemSheet);
els.cancelBtn.addEventListener("click", closeItemSheet);
els.manageBtn.addEventListener("click", openManageSheet);
els.closeManageBtn.addEventListener("click", closeManageSheet);
els.recordBtn.addEventListener("click", openRecordSheet);
els.closeRecordBtn.addEventListener("click", closeRecordSheet);
els.recordBackBtn.addEventListener("click", () => setRecordView("list"));

els.pickPhotosBtn.addEventListener("click", () => els.recordFilesInput.click());
els.takePhotoBtn.addEventListener("click", () => els.recordCameraInput.click());

if (els.resetBtn) {
  els.resetBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHECK_KEY);
    localStorage.removeItem(RECORD_KEY);
    items = [];
    checks = {};
    records = [];
    selectedDate = new Date(today);
    displayMonth = startOfMonth(today);
    selectedRecordItemId = null;
    seedIfEmpty(true);
    closeManageSheet();
    closeRecordSheet();
    renderAll();
  });
}

els.itemForm.addEventListener("submit", handleItemSubmit);
els.recordForm.addEventListener("submit", handleRecordSubmit);
els.recordFilesInput.addEventListener("change", handleFilesPicked);
els.recordCameraInput.addEventListener("change", handleFilesPicked);

els.itemSheetBackdrop.addEventListener("click", (event) => {
  if (event.target === els.itemSheetBackdrop) closeItemSheet();
});
els.manageSheetBackdrop.addEventListener("click", (event) => {
  if (event.target === els.manageSheetBackdrop) closeManageSheet();
});
els.recordSheetBackdrop.addEventListener("click", (event) => {
  if (event.target === els.recordSheetBackdrop) closeRecordSheet();
});

function seedIfEmpty(force = false) {
  if (force) {
    items = sampleItems();
    saveItems(items);
    return;
  }

  if (localStorage.getItem(STORAGE_KEY) !== null) return;

  items = sampleItems();
  saveItems(items);
}

function sampleItems() {
  return [
    {
      id: crypto.randomUUID(),
      name: "영양제",
      startDate: formatDate(addDays(today, -6)),
      endDate: formatDate(addDays(today, 32)),
      intervalDays: 1,
      memo: "아침 식후",
    },
    {
      id: crypto.randomUUID(),
      name: "관리템 A",
      startDate: formatDate(addDays(today, -2)),
      endDate: formatDate(addDays(today, 25)),
      intervalDays: 3,
      memo: "3일 간격",
    },
    {
      id: crypto.randomUUID(),
      name: "관리템 B",
      startDate: formatDate(addDays(today, 1)),
      endDate: formatDate(addDays(today, 21)),
      intervalDays: 7,
      memo: "주 1회",
    },
  ];
}

function renderAll() {
  renderHeader();
  renderSelectedDatePanel();
  renderCalendar();
  renderManageList();
  if (recordView === "list") {
    renderRecordListView();
  } else {
    renderRecordDetailView();
  }
}

function renderHeader() {
  els.selectedDateLabel.textContent = formatSelectedDateLabel(selectedDate);
  els.calendarMonthLabel.textContent = formatMonthLabel(displayMonth);
}

function renderSelectedDatePanel() {
  els.selectedDateItems.innerHTML = "";
  const dueItems = getDueItemsForDate(selectedDate);

  if (!dueItems.length) {
    const empty = document.createElement("div");
    empty.className = "helper-text";
    empty.textContent = "이 날짜에는 쓸 템이 없어.";
    els.selectedDateItems.appendChild(empty);
    return;
  }

  dueItems.forEach((item) => {
    const occurrenceKey = getOccurrenceKey(item, selectedDate);
    const checked = Boolean(checks[occurrenceKey]);
    const node = els.selectedItemTemplate.content.cloneNode(true);
    const article = node.querySelector(".today-item");
    const title = node.querySelector("h4");
    const memo = node.querySelector("p");
    const button = node.querySelector(".check-btn");

    title.textContent = item.name;
    memo.textContent = item.memo || "";
    button.classList.toggle("checked", checked);
    button.setAttribute("aria-pressed", String(checked));
    button.addEventListener("click", () => {
      toggleCheck(item, selectedDate);
      renderSelectedDatePanel();
      renderCalendar();
      renderRecordListView();
    });

    article.dataset.id = item.id;
    els.selectedDateItems.appendChild(node);
  });
}

function renderCalendar() {
  els.calendarGrid.innerHTML = "";

  const header = document.createElement("div");
  header.className = "weekday-header";
  ["S", "M", "T", "W", "T", "F", "S"].forEach((label, index) => {
    const cell = document.createElement("span");
    cell.className = `weekday-header-cell weekday-${index}`;
    cell.textContent = label;
    header.appendChild(cell);
  });
  els.calendarGrid.appendChild(header);

  const start = startOfWeek(startOfMonth(displayMonth));
  const end = addDays(start, 27);

  for (let week = 0; week < 4; week += 1) {
    const row = document.createElement("div");
    row.className = "week-row";

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(start, week * 7 + dayIndex);
      const dateKey = formatDate(date);
      const dayItems = getDueItemsForDate(date);
      const weekday = date.getDay();
      const isCurrentMonth = date.getMonth() === displayMonth.getMonth();

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `week-day weekday-${weekday}`;
      if (dateKey === formatDate(today)) cell.classList.add("today");
      if (dateKey === formatDate(selectedDate)) cell.classList.add("selected");
      if (!isCurrentMonth) cell.classList.add("off-range");
      cell.addEventListener("click", () => {
        selectedDate = new Date(date);
        if (date.getMonth() !== displayMonth.getMonth()) {
          displayMonth = startOfMonth(date);
        }
        renderAll();
      });

      const dayTop = document.createElement("div");
      dayTop.className = "day-top";
      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(date.getDate());
      const selectedMark = document.createElement("span");
      selectedMark.className = "day-mark hidden";
      dayTop.append(number, selectedMark);

      const itemsWrap = document.createElement("div");
      itemsWrap.className = "day-items";

      dayItems.slice(0, 2).forEach((item) => {
        const label = document.createElement("span");
        label.className = "day-item-label";
        if (checks[getOccurrenceKey(item, date)]) {
          label.classList.add("checked");
        }
        label.textContent = item.name;
        itemsWrap.appendChild(label);
      });

      if (dayItems.length > 2) {
        const more = document.createElement("span");
        more.className = "day-item-label more";
        more.textContent = `+${dayItems.length - 2}`;
        itemsWrap.appendChild(more);
      }

      cell.append(dayTop, itemsWrap);
      row.appendChild(cell);
    }

    els.calendarGrid.appendChild(row);
  }
}

function renderManageList() {
  els.manageList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "아직 등록된 관리템이 없어.";
    els.manageList.appendChild(empty);
    return;
  }

  items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
    .forEach((item) => {
      const row = document.createElement("article");
      row.className = "manage-item";

      const info = document.createElement("div");
      const title = document.createElement("h4");
      const meta = document.createElement("p");
      title.textContent = item.name;
      meta.textContent = `${item.startDate} ~ ${item.endDate} · ${item.intervalDays}일 간격`;
      info.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "manage-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "small-btn";
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", () => openItemSheet(item));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "small-btn delete";
      deleteBtn.textContent = "삭제";
      deleteBtn.addEventListener("click", () => {
        if (!confirm(`"${item.name}"을 삭제할까?`)) return;
        items = items.filter((entry) => entry.id !== item.id);
        saveItems(items);
        closeManageSheet();
        renderAll();
      });

      actions.append(editBtn, deleteBtn);
      row.append(info, actions);
      els.manageList.appendChild(row);
    });
}

function renderRecordListView() {
  records = loadRecords();
  els.recordTitle.textContent = "기록";
  els.recordBackBtn.classList.add("hidden");
  els.recordListView.classList.remove("hidden");
  els.recordDetailView.classList.add("hidden");
  els.recordItemList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "먼저 관리템을 추가해줘.";
    els.recordItemList.appendChild(empty);
    return;
  }

  items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
    .forEach((item) => {
      const entryCount = records.filter((record) => record.itemId === item.id).length;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "record-item-card";
      card.addEventListener("click", () => openRecordDetail(item.id));

      const name = document.createElement("strong");
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.textContent = `${entryCount}개 기록 · ${item.intervalDays}일 간격`;
      card.append(name, meta);

      els.recordItemList.appendChild(card);
    });
}

function openRecordDetail(itemId) {
  selectedRecordItemId = itemId;
  recordView = "detail";
  setRecordView("detail");
  renderRecordDetailView();
}

function renderRecordDetailView() {
  records = loadRecords();
  const item = items.find((entry) => entry.id === selectedRecordItemId);
  if (!item) {
    setRecordView("list");
    return;
  }

  els.recordTitle.textContent = "record";
  els.recordBackBtn.classList.remove("hidden");
  els.recordListView.classList.add("hidden");
  els.recordDetailView.classList.remove("hidden");
  els.recordDateInput.value = formatDate(today);
  els.recordItemTitle.textContent = item.name;
  els.recordItemMeta.textContent = `${item.startDate} ~ ${item.endDate} · ${item.intervalDays}일 간격`;
  els.recordGallery.innerHTML = "";

  const photoEntries = records
    .filter((record) => record.itemId === item.id)
    .sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    });

  if (!photoEntries.length) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "아직 사진 기록이 없어.";
    els.recordGallery.appendChild(empty);
    return;
  }

  photoEntries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "record-photo-card";

    const img = document.createElement("img");
    img.src = entry.photo;
    img.alt = `${item.name} 기록 사진`;

    const footer = document.createElement("div");
    footer.className = "record-photo-card-footer";
    const dateLabel = document.createElement("strong");
    dateLabel.textContent = formatRecordDateLabel(parseLocalDate(entry.date));
    const meta = document.createElement("span");
    meta.textContent = "기록";
    footer.append(dateLabel, meta);

    card.append(img, footer);
    els.recordGallery.appendChild(card);
  });
}

function setRecordView(view) {
  recordView = view;
  if (view === "list") {
    els.recordBackBtn.classList.add("hidden");
    els.recordListView.classList.remove("hidden");
    els.recordDetailView.classList.add("hidden");
    els.recordTitle.textContent = "기록";
  } else {
    els.recordBackBtn.classList.remove("hidden");
    els.recordListView.classList.add("hidden");
    els.recordDetailView.classList.remove("hidden");
  }
}

function openRecordSheet() {
  selectedRecordItemId = null;
  records = loadRecords();
  setRecordView("list");
  renderRecordListView();
  els.recordSheetBackdrop.classList.remove("hidden");
}

function closeRecordSheet() {
  els.recordSheetBackdrop.classList.add("hidden");
}

function openItemSheet(item = null) {
  editingId = item?.id ?? null;
  els.sheetModeLabel.textContent = item ? "관리템 수정" : "관리템 추가";
  els.itemForm.reset();
  els.nameInput.value = item?.name ?? "";
  els.startInput.value = item?.startDate ?? formatDate(selectedDate);
  els.endInput.value = item?.endDate ?? formatDate(addDays(selectedDate, 30));
  els.intervalInput.value = item?.intervalDays ?? 1;
  els.memoInput.value = item?.memo ?? "";
  els.itemSheetBackdrop.classList.remove("hidden");
  requestAnimationFrame(() => els.nameInput.focus());
}

function closeItemSheet() {
  els.itemSheetBackdrop.classList.add("hidden");
  editingId = null;
}

function openManageSheet() {
  renderManageList();
  els.manageSheetBackdrop.classList.remove("hidden");
}

function closeManageSheet() {
  els.manageSheetBackdrop.classList.add("hidden");
}

function handleItemSubmit(event) {
  event.preventDefault();

  const payload = {
    id: editingId || crypto.randomUUID(),
    name: els.nameInput.value.trim(),
    startDate: els.startInput.value,
    endDate: els.endInput.value,
    intervalDays: Math.max(1, Number(els.intervalInput.value || 1)),
    memo: els.memoInput.value.trim(),
  };

  if (!payload.name) return;
  if (payload.endDate < payload.startDate) {
    alert("종료일은 시작일보다 빠를 수 없어.");
    return;
  }

  const index = items.findIndex((entry) => entry.id === payload.id);
  if (index >= 0) {
    items[index] = payload;
  } else {
    items.unshift(payload);
  }

  saveItems(items);
  closeItemSheet();
  renderAll();
}

async function handleRecordSubmit(event) {
  event.preventDefault();
  if (!selectedRecordItemId) return;

  const date = els.recordDateInput.value || formatDate(today);
  const files = Array.from(els.recordFilesInput.files || []);
  const cameraFiles = Array.from(els.recordCameraInput.files || []);
  const allFiles = [...files, ...cameraFiles];

  if (!allFiles.length) {
    alert("사진을 하나 이상 선택해줘.");
    return;
  }

  for (const file of allFiles) {
    const photo = await fileToDataUrl(file);
    records.unshift({
      id: crypto.randomUUID(),
      itemId: selectedRecordItemId,
      date,
      photo,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    saveRecords(records);
  } catch (error) {
    console.error(error);
    alert("사진이 너무 커서 저장하지 못했어. 사진을 조금만 줄여서 다시 해줘.");
    return;
  }

  records = loadRecords();
  els.recordForm.reset();
  els.recordDateInput.value = date;
  renderRecordDetailView();
  renderRecordListView();
}

function handleFilesPicked() {
  // File inputs are handled on submit, no-op here.
}

async function fileToDataUrl(file) {
  const originalDataUrl = await readFileAsDataUrl(file);

  try {
    return await compressImageDataUrl(originalDataUrl, 1600, 0.82);
  } catch {
    return originalDataUrl;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const { width, height } = image;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(dataUrl);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function toggleCheck(item, date) {
  const key = getOccurrenceKey(item, date);
  if (checks[key]) {
    delete checks[key];
  } else {
    checks[key] = true;
  }
  saveChecks(checks);
}

function getDueItemsForDate(date) {
  return items
    .filter((item) => isDueOnDate(item, date))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function isDueOnDate(item, date) {
  const current = startOfDay(date);
  const start = parseLocalDate(item.startDate);
  const end = parseLocalDate(item.endDate);
  if (!start || !end) return false;
  if (current < start || current > end) return false;
  const diffDays = Math.round((current - start) / 86400000);
  return diffDays % item.intervalDays === 0;
}

function getOccurrenceKey(item, date) {
  return `${item.id}:${formatDate(date)}`;
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfWeek(date) {
  const next = startOfDay(date);
  return addDays(next, -next.getDay());
}

function formatSelectedDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatRecordDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(date);
}

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveItems(nextItems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}

function loadChecks() {
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveChecks(nextChecks) {
  localStorage.setItem(CHECK_KEY, JSON.stringify(nextChecks));
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(nextRecords) {
  localStorage.setItem(RECORD_KEY, JSON.stringify(nextRecords));
}

function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
