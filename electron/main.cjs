const { app, BrowserWindow, ipcMain, dialog, shell }=require('electron');
const { spawn }=require('node:child_process');
const path=require('node:path');
const { pathToFileURL }=require('node:url');
const { findTool, listInterfaces, buildCaptureArgs, validateOptions, diagnose, setupPlan }=require('./capture.cjs');
const { createAssistant }=require('./assistant.cjs');
const assistant=createAssistant();
const {createUpdates}=require('./updates.cjs');
const updates=createUpdates({app,config:require('./release-config.json'),isCapturing:()=>Boolean(processCapture),loadUpdater:type=>{
  const runtime=require('./updater-runtime.cjs');
  return type==='deb'?new runtime.DebUpdater():type==='pacman'?new runtime.PacmanUpdater():runtime.autoUpdater;
}});
let win=null,processCapture=null,tool=null,allowed=[],ringFolder=null,stopTimer=null;
const index=path.join(__dirname,'..','dist','index.html');
const localUrl=pathToFileURL(index).href;
function checkSender(event){if(!win||event.sender!==win.webContents||event.senderFrame?.url!==localUrl)throw new Error('Untrusted capture request');}
function stop(){clearTimeout(stopTimer);stopTimer=null;const child=processCapture;if(!child)return;processCapture=null;
  // Stop forwarding immediately, then make sure the tool really exits.
  child.stdout.removeAllListeners('data');try{child.kill('SIGTERM')}catch{}
  const force=setTimeout(()=>{try{if(child.exitCode===null)child.kill('SIGKILL')}catch{}},1500);child.once('close',()=>clearTimeout(force));
  send('capture:stopped');}
const send=(channel,value)=>{if(win&&!win.isDestroyed())win.webContents.send(channel,value)};
ipcMain.handle('capture:interfaces',async event=>{checkSender(event);tool=await findTool();allowed=await listInterfaces(tool);return allowed;});
ipcMain.handle('capture:tool',event=>{checkSender(event);return tool?{dumpcap:tool.dumpcap,version:tool.version}:null});
ipcMain.handle('capture:start',async(event,raw)=>{
  checkSender(event);if(processCapture)throw new Error('A capture is already running.');
  if(!tool)throw new Error('Select a valid network interface.');
  const options=validateOptions(typeof raw==='string'?{interfaces:[raw]}:raw,allowed,tool);
  let outFile=null;
  if(options.ring){if(!ringFolder)throw new Error('Choose a folder for the capture files first.');outFile=path.join(ringFolder,`pktivo-${new Date().toISOString().replace(/[:.]/g,'-')}.pcapng`);}
  const child=spawn(tool.executable,buildCaptureArgs(tool,options,outFile),{stdio:['ignore','pipe','pipe'],windowsHide:true});processCapture=child;
  let diagnostic='',received=false,bytes=0;const limit=options.ring?0:options.stop.megabytes*1e6;
  if(options.stop.seconds&&!options.ring)stopTimer=setTimeout(()=>{if(processCapture===child)stop()},options.stop.seconds*1000);
  let pending=[],flushTimer=null;const flush=()=>{flushTimer=null;if(!pending.length)return;const data=Buffer.concat(pending);pending=[];send('capture:data',new Uint8Array(data.buffer,data.byteOffset,data.length));};
  child.stdout.on('data',chunk=>{received=true;bytes+=chunk.length;pending.push(chunk);if(!flushTimer)flushTimer=setTimeout(flush,100);if(limit&&bytes>=limit&&processCapture===child){flush();stop();}});
  child.stdout.on('end',()=>{clearTimeout(flushTimer);flush();});
  child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk.toString()).slice(-4000);});
  child.on('error',err=>send('capture:error',err.message));
  child.on('close',code=>{if(processCapture===child){processCapture=null;clearTimeout(stopTimer);}if(code&&code!==0&&!received&&!options.ring)send('capture:error',diagnostic.trim()||'Capture failed. Check interface permissions.');else if(code&&code!==0&&options.ring)send('capture:error',diagnostic.trim()||'Capture to files failed.');send('capture:stopped');});
  return {toFiles:Boolean(options.ring),folder:options.ring?ringFolder:null};
});
ipcMain.handle('capture:chooseFolder',async event=>{checkSender(event);const r=await dialog.showOpenDialog(win,{title:'Folder for capture files',properties:['openDirectory','createDirectory']});if(r.canceled||!r.filePaths[0])return null;ringFolder=r.filePaths[0];return ringFolder;});
ipcMain.handle('capture:diagnose',async event=>{checkSender(event);const result=await diagnose();if(result.ok){tool=await findTool();allowed=result.interfaces;}return result;});
ipcMain.handle('capture:setup',async event=>{
  checkSender(event);if(processCapture)throw new Error('Stop the capture first.');
  const plan=setupPlan();
  if(plan.kind==='download'){await shell.openExternal(plan.url);return{started:true,message:'The Wireshark download page opened in your browser.'};}
  if(plan.kind!=='pkexec'||!/^[a-z_][a-z0-9_.-]{0,31}$/i.test(plan.user))throw new Error('Automatic setup is not available on this system. Use the commands shown.');
  // Fixed script; the system's own password prompt (polkit) handles elevation. Pktivo never sees the password.
  await new Promise((resolve,reject)=>{const c=spawn('pkexec',['/bin/sh','-c',plan.script,'pktivo-setup',plan.user],{stdio:['ignore','ignore','pipe']});let err='';c.stderr.on('data',d=>{err=(err+d).slice(-2000)});c.on('error',()=>reject(new Error('The system password prompt (pkexec) is not available. Use the commands shown.')));c.on('close',code=>code===0?resolve():reject(new Error(code===126||code===127?'Setup was cancelled.':err.trim()||'Setup failed.')));});
  return{started:true,message:plan.after};
});
ipcMain.handle('capture:stop',event=>{checkSender(event);stop()});
ipcMain.handle('assistant:enable',(event,value)=>{checkSender(event);return assistant.enable(value)});
ipcMain.handle('assistant:models',event=>{checkSender(event);return assistant.models()});
ipcMain.handle('assistant:ask',(event,model,question)=>{checkSender(event);return assistant.ask(model,question)});
ipcMain.handle('updates:status',event=>{checkSender(event);return updates.status()});
ipcMain.handle('updates:check',event=>{checkSender(event);return updates.check()});
ipcMain.handle('updates:install',event=>{checkSender(event);updates.install()});
app.whenReady().then(()=>{
  win=new BrowserWindow({width:1440,height:1000,minWidth:760,minHeight:600,title:'Pktivo',icon:path.join(__dirname,'icons','pktivo.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(url!==localUrl)event.preventDefault()});
  win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  updates.onStatus(status=>{if(win&&!win.isDestroyed())win.webContents.send('updates:status',status)});
  try{updates.init()}catch{ /* Invalid release configuration cannot enable updates. */ }
  win.loadFile(index);win.on('closed',()=>{assistant.enable(false);stop();win=null});
});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{updates.dispose();stop()});
