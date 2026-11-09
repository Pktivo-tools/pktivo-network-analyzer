const { app, BrowserWindow, ipcMain }=require('electron');
const { spawn }=require('node:child_process');
const path=require('node:path');
const { pathToFileURL }=require('node:url');
const { findTool, listInterfaces, captureArgs }=require('./capture.cjs');
const { createAssistant }=require('./assistant.cjs');
const assistant=createAssistant();
const {createUpdates}=require('./updates.cjs');
const updates=createUpdates({app,config:require('./release-config.json'),isCapturing:()=>Boolean(processCapture),loadUpdater:type=>{
  const runtime=require('./updater-runtime.cjs');
  return type==='deb'?new runtime.DebUpdater():type==='pacman'?new runtime.PacmanUpdater():runtime.autoUpdater;
}});
let win=null,processCapture=null,tool=null,allowed=[];
const index=path.join(__dirname,'..','dist','index.html');
const localUrl=pathToFileURL(index).href;
function checkSender(event){if(!win||event.sender!==win.webContents||event.senderFrame?.url!==localUrl)throw new Error('Untrusted capture request');}
function stop(){if(processCapture){processCapture.kill('SIGTERM');processCapture=null;}}
ipcMain.handle('capture:interfaces',async event=>{checkSender(event);tool=await findTool();allowed=await listInterfaces(tool);return allowed;});
ipcMain.handle('capture:start',async(event,name)=>{
  checkSender(event);if(processCapture)throw new Error('A capture is already running.');
  if(typeof name!=='string'||!allowed.some(i=>i.name===name)||!tool)throw new Error('Select a valid network interface.');
  const child=spawn(tool.executable,captureArgs(tool,name),{stdio:['ignore','pipe','pipe'],windowsHide:true});processCapture=child;
  let diagnostic='';let received=false;
  child.stdout.on('data',chunk=>{received=true;if(win&&!win.isDestroyed())win.webContents.send('capture:data',Array.from(chunk));});
  child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk.toString()).slice(-4000);});
  child.on('error',err=>{if(win&&!win.isDestroyed())win.webContents.send('capture:error',err.message)});
  child.on('close',code=>{if(processCapture===child)processCapture=null;if(win&&!win.isDestroyed()){if(code&&code!==0&&!received)win.webContents.send('capture:error',diagnostic.trim()||'Capture failed. Check interface permissions.');win.webContents.send('capture:stopped');}});
});
ipcMain.handle('capture:stop',event=>{checkSender(event);stop()});
ipcMain.handle('assistant:enable',(event,value)=>{checkSender(event);return assistant.enable(value)});
ipcMain.handle('assistant:models',event=>{checkSender(event);return assistant.models()});
ipcMain.handle('assistant:ask',(event,model,question)=>{checkSender(event);return assistant.ask(model,question)});
ipcMain.handle('updates:status',event=>{checkSender(event);return updates.status()});
ipcMain.handle('updates:check',event=>{checkSender(event);return updates.check()});
ipcMain.handle('updates:install',event=>{checkSender(event);updates.install()});
app.whenReady().then(()=>{
  win=new BrowserWindow({width:1440,height:1000,minWidth:760,minHeight:600,title:'Netpack',icon:path.join(__dirname,'icons','netpack.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(url!==localUrl)event.preventDefault()});
  win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  updates.onStatus(status=>{if(win&&!win.isDestroyed())win.webContents.send('updates:status',status)});
  try{updates.init()}catch{ /* Invalid release configuration cannot enable updates. */ }
  win.loadFile(index);win.on('closed',()=>{assistant.enable(false);stop();win=null});
});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{updates.dispose();stop()});
