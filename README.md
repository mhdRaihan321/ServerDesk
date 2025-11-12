# 🖥️ ServerDesk

<div align="center">

### 🚀 Local Apache & MySQL Control Panel — A Sleek Alternative to XAMPP

**ServerDesk** is a modern Electron-based control panel for managing your local Apache and MySQL servers.  
Fast, minimal, and built for developers who want simplicity and control — all in one elegant desktop app.

> 💡 Built with ❤️ by [**Mhd Raihan**](https://github.com/mhdRaihan321)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?logo=node.js)](https://nodejs.org/)

</div>

---

## ✨ Features

- ⚙️ **Start / Stop** Apache & MySQL servers instantly  
- 🧠 Auto-start options for each service  
- 📊 Real-time **health check & memory usage** display  
- 🪟 Background operation via **system tray**  
- 💬 Smart toast notifications for all actions  
- 📁 One-click access to **localhost** & **phpMyAdmin**  
- 🧰 Persistent settings stored automatically  
- 🖼️ Beautiful dark UI with custom icons  
- ⚡ Lightweight & portable — built with Electron  

---

## 🖼️ Preview

<div align="center">

![ServerDesk Screenshot](path/to/your/screenshot.png)

*Replace this with your actual app screenshot*

</div>

---

## 🏗️ Installation

### 🔹 From Source

```bash
# Clone this repository
git clone https://github.com/mhdRaihan321/ServerDesk.git
cd ServerDesk

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the app for Windows
npm run build
```

After building, your installer (e.g., `ServerDesk Setup.exe`) will appear in the `dist/` folder.

### 🔹 Download Release

Download the latest pre-built installer from the [Releases](https://github.com/mhdRaihan321/ServerDesk/releases) page.

---

## ⚙️ Configuration

### Default Executable Paths

```
Apache: I:/MYXAMPP/MyServer/bin/apache/bin/httpd.exe
MySQL:  I:/MYXAMPP/MyServer/bin/mysql/bin/mysqld.exe
```

You can change these paths anytime from the **Settings Panel** in the app.

### Configuration File

Settings are stored here:

```
%APPDATA%/ServerDesk/serverdesk_config.json
```

---

## 🧠 Tech Stack

| Component | Description |
|-----------|-------------|
| 🪶 **Electron.js** | Framework for the desktop app |
| ⚡ **Node.js** | Backend process control |
| 💅 **Tailwind CSS** | Styling & layout |
| 🧩 **Lucide Icons** | Modern icon set |

---

## 🪟 Tray Menu

ServerDesk runs silently in your system tray.

**Right-click the tray icon** to quickly:

- 🔘 Show / Hide ServerDesk
- ▶️ Start / Stop Apache
- 🧱 Start / Stop MySQL
- ❌ Quit & stop all services

---

## 💾 Logs

Export logs in one click:

```
Menu → Export Logs → Save as .txt
```

All service actions, status changes, and errors are recorded for easy debugging.

---

## 👨‍💻 Developer

**Mhd Raihan**

🌐 [GitHub Profile](https://github.com/mhdRaihan321)

If you like this project, please ⭐ **star the repo** or contribute a PR!

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and share.

See [LICENSE](LICENSE) for more details.

---

## 💡 Roadmap / Future Ideas

- [ ] 🔍 Auto-detect Apache/MySQL paths
- [ ] 🧩 Add Nginx & Mail Services
- [ ] 🎨 Custom theme and UI color settings
- [ ] 🔔 Native desktop notifications
- [ ] 🌐 Multi-language support


---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](https://github.com/mhdRaihan321/ServerDesk/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- Inspired by XAMPP Control Panel
- Icons from [Lucide Icons](https://lucide.dev/)
- Built with [Electron](https://www.electronjs.org/)

---

<div align="center">

**Made with ❤️ by [Mhd Raihan](https://github.com/mhdRaihan321)**

⭐ **Star this repo if you find it helpful!** ⭐

</div>
