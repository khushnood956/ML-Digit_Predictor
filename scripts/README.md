# 📁 Scripts - Startup and Utility Batch Files

Quick reference for all batch scripts used to manage the MNIST system.

## 📋 Available Scripts

### 🚀 Startup Scripts

| Script | Purpose | Time | Use Case |
|--------|---------|------|----------|
| **START_ALL.bat** | Complete setup with builds | 2-5 min | First run, fresh builds |
| **START_QUICK.bat** | Fast startup (no rebuild) | 30-60 sec | Daily development |
| **STOP_ALL.bat** | Stop all services | 2 sec | Clean shutdown |

### 🔧 Utility Scripts

| Script | Purpose |
|--------|---------|
| **CHECK_SETUP.bat** | Verify prerequisites installed |
| **MENU.bat** | Interactive menu-driven control |

---

## ⚡ Quick Start

**First Time:**
```bash
START_ALL.bat
```

**Every Time After:**
```bash
START_QUICK.bat
```

**To Stop:**
```bash
STOP_ALL.bat
```

---

## 📍 Services

```
Frontend:    http://localhost:5500
Spring Boot: http://localhost:8080
Python:      http://localhost:8000
```

---

## 🎯 Usage

1. Navigate to scripts folder
2. Double-click desired .bat file
3. Or run from command line: `START_QUICK.bat`

---

**All scripts work with services running on default ports (8000, 8080, 5500)**

For detailed documentation, see: [../README.md](../README.md)
