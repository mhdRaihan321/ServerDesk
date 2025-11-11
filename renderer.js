// renderer.js
const { ipcRenderer, shell, clipboard } = require("electron");

// --- Global State ---
let apache = { running: false, startTime: null };
let mysql = { running: false, startTime: null };
window.apacheRunning = false;
window.mysqlRunning = false;

let lastToast = { msg: "", time: 0 };

// --- Elements ---
const els = {
  apacheToggle: document.getElementById("apacheToggle"),
  mysqlToggle: document.getElementById("mysqlToggle"),
  apacheBadge: document.getElementById("apacheBadge"),
  mysqlBadge: document.getElementById("mysqlBadge"),
  logBox: document.getElementById("logBox"),
  refreshBtn: document.getElementById("refreshBtn"),
  openLocal: document.getElementById("openLocalhost"),
  openPHPMyAdmin: document.getElementById("openPHPMyAdmin"),
  saveBtn: document.getElementById("saveSettingsBtn"),
};

// --- Navigation ---
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll("#pageContent > div").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active-nav"));
    item.classList.add("active-nav");

    document.getElementById("pageTitle").textContent = page === "dashboard" ? "Services Dashboard" : "Configuration Settings";
    lucide.createIcons();
  });
});

// --- Toggle Service ---
function toggleService(service) {
  const isApache = service === "apache";
  const btn = isApache ? els.apacheToggle : els.mysqlToggle;
  const isRunning = isApache ? apache.running : mysql.running;

  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-5 h-5 inline mr-2 animate-spin"></i>Processing...`;
  lucide.createIcons();

  ipcRenderer.send(isApache ? (isRunning ? "stop-apache" : "start-apache") : (isRunning ? "stop-mysql" : "start-mysql"));
  setTimeout(() => btn.disabled = false, 1500);
}

els.apacheToggle.onclick = () => toggleService("apache");
els.mysqlToggle.onclick = () => toggleService("mysql");

// --- Update Service (NO DOUBLE TOAST) ---
ipcRenderer.on("apache-status", (_, s) => updateService("apache", s));
ipcRenderer.on("mysql-status", (_, s) => updateService("mysql", s));

function updateService(name, status) {
  const running = status === "running";
  const svc = name === "apache" ? apache : mysql;
  const badge = name === "apache" ? els.apacheBadge : els.mysqlBadge;
  const btn = name === "apache" ? els.apacheToggle : els.mysqlToggle;

  const wasRunning = svc.running;
  svc.running = running;
  window[name + "Running"] = running;

  if (running && !wasRunning) svc.startTime = Date.now();
  if (!running) svc.startTime = null;

  // === Badge ===
  badge.innerHTML = running
    ? `<span class="inline-block w-2 h-2 rounded-full mr-2 bg-emerald-400 status-dot"></span>Running`
    : `<span class="inline-block w-2 h-2 rounded-full mr-2 bg-slate-500"></span>Stopped`;
  badge.className = running
    ? "px-4 py-2 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg"
    : "px-4 py-2 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700";

  // === Button ===
  btn.innerHTML = running
    ? `<i data-lucide="square" class="w-5 h-5 inline mr-2"></i>Stop ${name.toUpperCase()}`
    : `<i data-lucide="play" class="w-5 h-5 inline mr-2"></i>Start ${name.toUpperCase()}`;
  btn.className = running
    ? "btn-ripple flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
    : "btn-ripple flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg";

  lucide.createIcons();

  // === Toast: Only if state changed & not duplicate ===
  const msg = `${name.toUpperCase()} ${running ? "started" : "stopped"}`;
  const now = Date.now();
  if (wasRunning !== running && (now - lastToast.time > 500 || lastToast.msg !== msg)) {
    showToast(msg, running ? "success" : "warning");
    lastToast = { msg, time: now };
  }
}

// --- Stats ---
ipcRenderer.on("service-stats", (_, stats) => {
  ["apache", "mysql"].forEach(svc => {
    document.getElementById(`${svc}PortDisplay`).textContent = stats[svc].alive ? "Active" : "Inactive";
    document.getElementById(`${svc}PID`).textContent = stats[svc].pid || "—";
    document.getElementById(`${svc}Mem`).textContent = stats[svc].mem ? `${stats[svc].mem} KB` : "—";
  });
  updateTotalMemory();
  updateSystemStatus();
});

ipcRenderer.on("app-uptime", (_, secs) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  document.getElementById("totalUptime").textContent = `${h}:${m}:${s}`;
});

function updateTotalMemory() {
  const a = parseInt(document.getElementById("apacheMem")?.textContent || "0");
  const m = parseInt(document.getElementById("mysqlMem")?.textContent || "0");
  document.getElementById("totalMemory").textContent = `${Math.round((a + m) / 1024)} MB`;
}

function updateSystemStatus() {
  const active = (window.apacheRunning ? 1 : 0) + (window.mysqlRunning ? 1 : 0);
  document.getElementById("activeServices").textContent = `${active} / 2`;
  const status = document.getElementById("systemStatus");
  status.innerHTML = active === 2
    ? '<span class="text-emerald-400">All Systems Operational</span>'
    : active === 1
    ? '<span class="text-yellow-400">Partial</span>'
    : '<span class="text-red-400">Offline</span>';
}

// --- REAL-TIME UPTIME (60 FPS) ---
function formatUptime(ms) {
  if (!ms) return "—";
  const diff = (Date.now() - ms) / 1000;
  const h = String(Math.floor(diff / 3600)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(diff % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateUptimeDisplay() {
  document.getElementById("apacheUptime").textContent = formatUptime(apache.startTime);
  document.getElementById("mysqlUptime").textContent = formatUptime(mysql.startTime);
  requestAnimationFrame(updateUptimeDisplay);
}
updateUptimeDisplay();

// --- Logs ---
ipcRenderer.on("log", (_, msg, type) => log(msg, type));
function log(msg, type = "info") {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `log-line mb-1 text-${type === "success" ? "green" : type === "warning" ? "yellow" : type === "error" ? "red" : "blue"}-400`;
  line.innerHTML = `<span class="text-slate-500">[${time}]</span> ${msg}`;
  els.logBox.appendChild(line);
  els.logBox.scrollTo({ top: els.logBox.scrollHeight, behavior: "smooth" });
  if (els.logBox.children.length > 300) els.logBox.firstChild.remove();
}

// --- Log Actions ---
document.getElementById("clearLogs").onclick = () => { els.logBox.innerHTML = ""; log("Logs cleared", "info"); };
document.getElementById("copyLogs").onclick = () => { clipboard.writeText(els.logBox.innerText); log("Copied to clipboard", "success"); };
document.getElementById("exportLogs").onclick = () => ipcRenderer.invoke("export-logs");
document.getElementById("logSearch").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  Array.from(els.logBox.children).forEach(l => {
    l.style.display = l.textContent.toLowerCase().includes(term) ? "" : "none";
  });
});

// --- Settings ---
function loadSettings() {
  const cfg = JSON.parse(localStorage.getItem("serverdesk_cfg") || "{}");
  document.getElementById("autoApache").checked = cfg.autoStartApache ?? false;
  document.getElementById("autoMySQL").checked = cfg.autoStartMySQL ?? false;
  document.getElementById("apachePort").value = cfg.apachePort ?? 80;
  document.getElementById("mysqlPort").value = cfg.mysqlPort ?? 3306;
}

els.saveBtn.onclick = () => {
  const cfg = {
    autoStartApache: document.getElementById("autoApache").checked,
    autoStartMySQL: document.getElementById("autoMySQL").checked,
    apachePort: +document.getElementById("apachePort").value,
    mysqlPort: +document.getElementById("mysqlPort").value,
  };
  ipcRenderer.send("save-settings", cfg);
  localStorage.setItem("serverdesk_cfg", JSON.stringify(cfg));
  log("Settings saved", "success");
  showToast("Settings saved successfully", "success");
};

// --- Buttons ---
els.refreshBtn.onclick = () => ipcRenderer.send("check-status");
els.openLocal.onclick = () => ipcRenderer.send("open-localhost");
els.openPHPMyAdmin.onclick = () => ipcRenderer.send("open-phpmyadmin");

// --- Toast (Dismissible + No Duplicates) ---
function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container fixed top-5 right-5 flex flex-col space-y-3 z-[9999]";
    document.body.appendChild(container);
  }

  const config = {
    success: { icon: "check-circle", bg: "bg-emerald-900/90", text: "text-emerald-200", border: "border-emerald-500/50" },
    warning: { icon: "alert-triangle", bg: "bg-yellow-900/90", text: "text-yellow-200", border: "border-yellow-500/50" },
    error: { icon: "x-octagon", bg: "bg-red-900/90", text: "text-red-200", border: "border-red-500/50" },
    info: { icon: "info", bg: "bg-blue-900/90", text: "text-blue-200", border: "border-blue-500/50" },
  };
  const c = config[type] || config.info;

  const toast = document.createElement("div");
  toast.className = `flex items-center gap-3 px-4 py-3 border rounded-xl shadow-lg ${c.bg} ${c.text} ${c.border} backdrop-blur-md opacity-0 translate-x-10 transition-all duration-300 ease-out`;
  toast.innerHTML = `
    <i data-lucide="${c.icon}" class="w-5 h-5"></i>
    <span class="font-medium">${message}</span>
    <button class="ml-auto p-1 hover:bg-white/10 rounded-full dismiss-toast">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-x-10");
    toast.classList.add("opacity-100", "translate-x-0");
  });

  const removeToast = () => {
    toast.classList.add("opacity-0", "translate-x-10");
    setTimeout(() => toast.remove(), 300);
  };
  toast.querySelector(".dismiss-toast").onclick = removeToast;
  setTimeout(removeToast, 5000);
}

// --- Init ---
log("ServerDesk v1.0 Ready", "success");
loadSettings();
ipcRenderer.send("check-status");
setInterval(() => ipcRenderer.send("check-status"), 15000);
lucide.createIcons();