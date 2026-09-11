import { contextBridge } from 'electron';

// Minimal bridge. The MVP keeps all data in the renderer (localStorage),
// so no IPC surface is needed yet. The bridge exists so future tools
// (file access, global shortcuts) have a typed, explicit place to land.
contextBridge.exposeInMainWorld('utb', {
  platform: process.platform,
  version: process.env.npm_package_version ?? '0.1.0',
});
