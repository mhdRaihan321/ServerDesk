// main.js
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const fetch = require("node-fetch");
const AutoLaunch = require('auto-launch');

let mainWindow, tray;
let apacheProcess = null, mysqlProcess = null;
let appStartTime = Date.now();
let isQuitting = false;

// === Config ===
const CONFIG_PATH = path.join(app.getPath("userData"), "serverdesk_config.json");
let config = {
  autoStartApache: false,
  autoStartMySQL: false,
  apachePort: 80,
  mysqlPort: 3306,
  autoStartApp: true,
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) };
  } catch (e) {
    console.warn("⚠️ Config reset due to parse error");
  }
}

const APACHE_PATH = "I:/MYXAMPP/MyServer/bin/apache/bin/httpd.exe";
const MYSQL_PATH = "I:/MYXAMPP/MyServer/bin/mysql/bin/mysqld.exe";


// === Window ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "ServerDesk",
    icon: path.join(__dirname, "assets", "favw.png"),
    backgroundColor: "#0f172a",
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    },
  });

  // Load your HTML
  mainWindow.loadFile("index.html");

  // ❌ Remove the default menu (Edit, View, Help, etc.)
  mainWindow.removeMenu();

  // Handle close/hide
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  app.on("before-quit", () => (isQuitting = true));

  createTray();

  // Auto-start settings
  if (config.autoStartApache) startApache();
  if (config.autoStartMySQL) startMySQL();
}

// === Tray ===
function createTray() {
  const iconPath = path.join(__dirname, "assets", "favw.png");
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  tray.setToolTip("ServerDesk - Local Server Control Panel");
  updateTray();
}

function updateTray() {
  if (!tray) return;

  const apacheRunning = !!apacheProcess;
  const mysqlRunning = !!mysqlProcess;
  const allRunning = apacheRunning && mysqlRunning;
  const label = allRunning
    ? "🟢 All Running"
    : apacheRunning || mysqlRunning
    ? "🟠 Partial"
    : "🔴 Offline";

  const menu = Menu.buildFromTemplate([
    { icon : nativeImage.createFromPath(path.join(__dirname, "assets", "favicon.ico",)), label: `ServerDesk • ${label}`, enabled: false },

    { type: "separator" },
    { label: "Show App", click: () => mainWindow.show() },
    { type: "separator" },
    {
      label: apacheRunning ? "Stop Apache" : "Start Apache",
      click: apacheRunning ? stopApache : startApache,
    },
    {
      label: mysqlRunning ? "Stop MySQL" : "Start MySQL",
      click: mysqlRunning ? stopMySQL : startMySQL,
    },    
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        stopApache();
        stopMySQL();
        isQuitting = true;
        setTimeout(() => app.quit(), 600);
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => mainWindow.show());
}

// === Auto-Launcher ===
const serverDeskAutoLauncher = new AutoLaunch({
  name: 'ServerDesk',
  path: process.execPath,
});

serverDeskAutoLauncher.isEnabled()
  .then(enabled => {
    if (!enabled) serverDeskAutoLauncher.enable();
  })
  .catch(err => console.error('AutoLaunch Error:', err));

  
// === Services ===
function startApache() {
  if (apacheProcess || !fs.existsSync(APACHE_PATH))
    return sendLog("Apache not found!", "error");

  sendLog(`Starting Apache on port ${config.apachePort}...`, "info");
  apacheProcess = spawn(APACHE_PATH, [], { detached: true, stdio: "ignore" });
  apacheProcess.unref();

  setTimeout(() => {
    sendStatus("apache", "running");
    sendLog("Apache started successfully.", "success");
    updateTray();
  }, 1200);
}

function stopApache() {
  exec("taskkill /F /IM httpd.exe", () => {
    apacheProcess = null;
    sendStatus("apache", "stopped");
    sendLog("Apache stopped.", "warning");
    updateTray();
  });
}

function startMySQL() {
  if (mysqlProcess || !fs.existsSync(MYSQL_PATH))
    return sendLog("MySQL not found!", "error");

  sendLog(`Starting MySQL on port ${config.mysqlPort}...`, "info");
  mysqlProcess = spawn(MYSQL_PATH, ["--console"], { detached: true, stdio: "ignore" });
  mysqlProcess.unref();

  setTimeout(() => {
    sendStatus("mysql", "running");
    sendLog("MySQL started successfully.", "success");
    updateTray();
  }, 1200);
}

function stopMySQL() {
  exec("taskkill /F /IM mysqld.exe", () => {
    mysqlProcess = null;
    sendStatus("mysql", "stopped");
    sendLog("MySQL stopped.", "warning");
    updateTray();
  });
}

// === Health Check ===
async function checkHealth() {
  const stats = {
    apache: { alive: false, pid: "-", mem: "-" },
    mysql: { alive: false, pid: "-", mem: "-" },
  };

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

  exec("tasklist /FO CSV", (e, out) => {
    const lines = out.split("\n");
    lines.forEach((line) => {
      const cols = line.split(",").map((s) => s.replace(/"/g, ""));
      if (cols[0] === "httpd.exe") {
        stats.apache.pid = cols[1];
        stats.apache.mem = cols[4]?.replace(" K", "");
      }
      if (cols[0] === "mysqld.exe") {
        stats.mysql.pid = cols[1];
        stats.mysql.mem = cols[4]?.replace(" K", "");
      }
    });
    mainWindow.webContents.send("service-stats", stats);
    mainWindow.webContents.send(
      "app-uptime",
      Math.floor((Date.now() - appStartTime) / 1000)
    );
  });
}

// === IPC ===
ipcMain.on("start-apache", startApache);
ipcMain.on("stop-apache", stopApache);
ipcMain.on("start-mysql", startMySQL);
ipcMain.on("stop-mysql", stopMySQL);

ipcMain.on("save-settings", (_, newCfg) => {
  try {
    // Merge and save config
    config = { ...config, ...newCfg };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    // 🔄 Restart Apache/MySQL if already running
    if (apacheProcess) {
      stopApache();
      setTimeout(startApache, 800);
    }
    if (mysqlProcess) {
      stopMySQL();
      setTimeout(startMySQL, 800);
    }

    // ⚙️ Update AutoLaunch dynamically
    if (config.autoStartApp) {
      serverDeskAutoLauncher.enable();
    } else {
      serverDeskAutoLauncher.disable();
    }

    // 🧾 Log success to renderer
    sendLog("Settings saved successfully.", "success");
  } catch (err) {
    console.error("⚠️ Error saving settings:", err);
    sendLog("Failed to save settings.", "error");
  }
});

ipcMain.on("open-localhost", () =>
  shell.openExternal(`http://localhost:${config.apachePort}`)
);
ipcMain.on("open-phpmyadmin", () =>
  shell.openExternal(`http://localhost:${config.apachePort}/phpmyadmin`)
);

ipcMain.handle("export-logs", async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `ServerDesk_Logs_${new Date().toISOString().slice(0, 10)}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (!filePath) return;
  const logs = await mainWindow.webContents.executeJavaScript(
    `document.getElementById('logBox').innerText`
  );
  fs.writeFileSync(filePath, logs);
  sendLog("Logs exported successfully.", "success");
});

ipcMain.on("check-status", () => {
  exec("tasklist", (err, stdout) => {
    sendStatus("apache", stdout.includes("httpd.exe") ? "running" : "stopped");
    sendStatus("mysql", stdout.includes("mysqld.exe") ? "running" : "stopped");
  });
  checkHealth();
});

// === Helpers ===
function sendLog(msg, type) {
  if (mainWindow) mainWindow.webContents.send("log", msg, type);
}
function sendStatus(service, status) {
  if (mainWindow) mainWindow.webContents.send(`${service}-status`, status);
}

// === App Lock ===
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
    }
  });
}

// === App Start ===
app.whenReady().then(() => {
  createWindow();
  setInterval(() => mainWindow.webContents.send("check-status"), 5000);
});

app.on("window-all-closed", (e) => e.preventDefault());
