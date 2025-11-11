// main.js
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const fetch = require("node-fetch");

let mainWindow, tray, apacheProcess = null, mysqlProcess = null;
let appStartTime = Date.now();

const CONFIG_PATH = path.join(app.getPath("userData"), "serverdesk_config.json");
let config = {
  autoStartApache: false,
  autoStartMySQL: false,
  apachePort: 80,
  mysqlPort: 3306
};

if (fs.existsSync(CONFIG_PATH)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) }; }
  catch (e) { console.warn("Config reset"); }
}

const APACHE_PATH = "I:/MYXAMPP/MyServer/bin/apache/bin/httpd.exe";
const MYSQL_PATH  = "I:/MYXAMPP/MyServer/bin/mysql/bin/mysqld.exe";

// === Window ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    title: "ServerDesk",
    icon: path.join(__dirname, "assets", "favicon.ico"),
    // icon: path.join(__dirname, "assets", "icon512.png"),
    backgroundColor: "#0f172a",
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  mainWindow.loadFile("index.html");
  mainWindow.on("close", e => { e.preventDefault(); mainWindow.hide(); });

  // Create tray AFTER window
  createTray();

  if (config.autoStartApache) startApache();
  if (config.autoStartMySQL) startMySQL();
}

// === Tray ===
function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.png"));
  tray = new Tray(icon);
  tray.setToolTip("ServerDesk");
  tray.on("click", () => mainWindow.show());
  updateTray(); // Safe: tray exists now
}

function updateTray() {
  if (!tray) return; // Extra safety
  const running = (apacheProcess ? 1 : 0) + (mysqlProcess ? 1 : 0);
  const label = running === 2 ? "🟢 All Running" : running === 1 ? "🟠 Partial" : "🔴 Offline";
  const menu = Menu.buildFromTemplate([
    { label: `ServerDesk • ${label}`, enabled: false },
    { type: "separator" },
    { label: "Show App", click: () => mainWindow.show() },
    { label: "Start Apache", click: startApache, enabled: !apacheProcess },
    { label: "Stop Apache",  click: stopApache,  enabled: !!apacheProcess },
    { label: "Start MySQL",  click: startMySQL,  enabled: !mysqlProcess },
    { label: "Stop MySQL",   click: stopMySQL,   enabled: !!mysqlProcess },
    { type: "separator" },
    { label: "Quit", click: () => { stopApache(); stopMySQL(); app.quit(); } }
  ]);
  tray.setContextMenu(menu);
}

// === Services ===
function startApache() {
  if (apacheProcess || !fs.existsSync(APACHE_PATH)) return sendLog("Apache not found!", "error");
  sendLog(`Starting Apache on port ${config.apachePort}...`, "info");
  apacheProcess = spawn(APACHE_PATH, [], { detached: true, stdio: "ignore" });
  apacheProcess.unref();
  setTimeout(() => sendStatus("apache", "running"), 1200);
  updateTray();
}

function stopApache() {
  exec('taskkill /F /IM httpd.exe', () => {
    apacheProcess = null;
    sendStatus("apache", "stopped");
    sendLog("Apache stopped", "warning");
    updateTray();
  });
}

function startMySQL() {
  if (mysqlProcess || !fs.existsSync(MYSQL_PATH)) return sendLog("MySQL not found!", "error");
  sendLog(`Starting MySQL on port ${config.mysqlPort}...`, "info");
  mysqlProcess = spawn(MYSQL_PATH, ["--console"], { detached: true, stdio: "ignore" });
  mysqlProcess.unref();
  setTimeout(() => sendStatus("mysql", "running"), 1200);
  updateTray();
}

function stopMySQL() {
  exec('taskkill /F /IM mysqld.exe', () => {
    mysqlProcess = null;
    sendStatus("mysql", "stopped");
    sendLog("MySQL stopped", "warning");
    updateTray();
  });
}

// === Health Check ===
async function checkHealth() {
  const stats = { apache: { alive: false, pid: "-", mem: "-" }, mysql: { alive: false, pid: "-", mem: "-" } };

  try {
    const res = await fetch(`http://127.0.0.1:${config.apachePort}`, { timeout: 2000 });
    stats.apache.alive = res.ok;
  } catch {}

  try {
    const net = require("net");
    await new Promise((resolve, reject) => {
      const s = net.createConnection(config.mysqlPort, "127.0.0.1", resolve);
      s.setTimeout(1500);
      s.on("error", reject);
      s.on("timeout", () => reject());
    });
    stats.mysql.alive = true;
  } catch {}

  exec('tasklist /FO CSV', (e, out) => {
    const lines = out.split("\n");
    lines.forEach(line => {
      const cols = line.split(",").map(s => s.replace(/"/g, ""));
      if (cols[0] === "httpd.exe") {
        stats.apache.pid = cols[1]; 
        stats.apache.mem = cols[4].replace(" K", "");
      }
      if (cols[0] === "mysqld.exe") {
        stats.mysql.pid = cols[1]; 
        stats.mysql.mem = cols[4].replace(" K", "");
      }
    });
    mainWindow.webContents.send("service-stats", stats);
    mainWindow.webContents.send("app-uptime", Math.floor((Date.now() - appStartTime) / 1000));
  });
}

// === IPC ===
ipcMain.on("start-apache", startApache);
ipcMain.on("stop-apache", stopApache);
ipcMain.on("start-mysql", startMySQL);
ipcMain.on("stop-mysql", stopMySQL);

ipcMain.on("save-settings", (_, cfg) => {
  config = { ...config, ...cfg };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  sendLog("Settings saved", "success");
  if (apacheProcess) { stopApache(); setTimeout(startApache, 600); }
  if (mysqlProcess)  { stopMySQL();  setTimeout(startMySQL, 600);  }
});

ipcMain.on("open-localhost", () => shell.openExternal(`http://localhost:${config.apachePort}`));
ipcMain.on("open-phpmyadmin", () => shell.openExternal(`http://localhost:${config.apachePort}/phpmyadmin`));

ipcMain.handle("export-logs", async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `ServerDesk_Logs_${new Date().toISOString().slice(0,10)}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }]
  });
  if (!filePath) return;
  const logs = await mainWindow.webContents.executeJavaScript(`document.getElementById('logBox').innerText`);
  fs.writeFileSync(filePath, logs);
  sendLog("Logs exported", "success");
});

ipcMain.on("check-status", () => {
  exec('tasklist', (err, stdout) => {
    sendStatus("apache", stdout.includes("httpd.exe") ? "running" : "stopped");
    sendStatus("mysql", stdout.includes("mysqld.exe") ? "running" : "stopped");
  });
  checkHealth();
});

// === Helpers ===
function sendLog(msg, type) { if (mainWindow) mainWindow.webContents.send("log", msg, type); }
function sendStatus(service, status) { if (mainWindow) mainWindow.webContents.send(`${service}-status`, status); }

// === App ===
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); }
  });
}

app.whenReady().then(() => {
  createWindow();
  setInterval(() => mainWindow.webContents.send("check-status"), 5000);
});

app.on("window-all-closed", e => e.preventDefault());