import { app, BrowserWindow, session, shell } from 'electron';
import path from 'node:path';

// Privacy-first: this app never talks to the network. No auto-updater,
// no analytics, no remote content. Everything is loaded from local files.

const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 560,
    title: 'Utility Toolbox',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // Design 3.0 «liquid glass»: on macOS the window is vibrant and the
    // renderer paints translucent backgrounds over it (html.is-mac in CSS).
    // On Windows 11 the same effect comes from the acrylic material.
    ...(process.platform === 'darwin'
      ? {
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const,
          backgroundColor: '#00000000',
          trafficLightPosition: { x: 16, y: 14 },
        }
      : {}),
    ...(process.platform === 'win32' ? { backgroundMaterial: 'acrylic' as const } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links in the system browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // A plain <a href> click must never navigate the app window either —
  // external http(s) URLs go to the system browser.
  win.webContents.on('will-navigate', (event, url) => {
    const isAppUrl = isDev
      ? url.startsWith(process.env.VITE_DEV_SERVER_URL as string)
      : url.startsWith('file:');
    if (!isAppUrl) {
      event.preventDefault();
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Spell Checker tool: on macOS Electron uses the native system
  // spellchecker (offline, all system languages) automatically.
  // On Windows/Linux Chromium's Hunspell needs an explicit language list.
  if (process.platform !== 'darwin') {
    try {
      session.defaultSession.setSpellCheckerLanguages(['en-US', 'ru']);
    } catch {
      /* unavailable language packs must not break startup */
    }
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
