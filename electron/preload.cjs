const { contextBridge, ipcRenderer } = require('electron');
const subscribe = (channel, cb) => { const handler=(_event,value)=>cb(value);ipcRenderer.on(channel,handler);return()=>ipcRenderer.removeListener(channel,handler); };
contextBridge.exposeInMainWorld('netlens', {
  updateStatus:()=>ipcRenderer.invoke('updates:status'),
  checkUpdates:()=>ipcRenderer.invoke('updates:check'),
  installUpdate:()=>ipcRenderer.invoke('updates:install'),
  onUpdateStatus:cb=>subscribe('updates:status',cb),
  assistantEnable:enabled=>ipcRenderer.invoke('assistant:enable',enabled),
  assistantModels:()=>ipcRenderer.invoke('assistant:models'),
  assistantAsk:(model,question)=>ipcRenderer.invoke('assistant:ask',model,question),
  interfaces:()=>ipcRenderer.invoke('capture:interfaces'),
  start:name=>ipcRenderer.invoke('capture:start',name),
  stop:()=>ipcRenderer.invoke('capture:stop'),
  onData:cb=>subscribe('capture:data',cb),
  onError:cb=>subscribe('capture:error',cb),
  onStopped:cb=>subscribe('capture:stopped',cb),
});
