const { EventEmitter } = require('node:events');
function validateRelease(config) {
  if (!config?.enabled) return null;
  let url;
  try { url=new URL(config.baseUrl); } catch { throw new Error('Invalid release address.'); }
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Updates require a trusted HTTPS release address.');
  if(!['nsis','mac','deb','pacman'].includes(config.packageType))throw new Error('Portable previews cannot install automatic updates.');
  if((config.packageType==='nsis'||config.packageType==='mac')&&(!config.publisherName||typeof config.publisherName!=='string'))throw new Error('Signed releases require a publisher identity.');
  return {...config,baseUrl:url.href.endsWith('/')?url.href:url.href+'/'};
}
function createUpdates({app,config,loadUpdater,isCapturing=()=>false}) {
  const events=new EventEmitter();let updater=null;let checking=false;let timer=null;
  let status={state:'unconfigured',version:app.getVersion(),message:'Automatic updates are not active in this unsigned preview. A release host and installer setup are still needed.'};
  function send(state,message,extra={}) {status={state,version:app.getVersion(),message,...extra};events.emit('status',status);}
  function init() {
    const release=validateRelease(config);
    if(!release||!app.isPackaged)return;
    updater=loadUpdater(release.packageType);
    updater.setFeedURL({provider:'generic',url:release.baseUrl});
    updater.autoDownload=true;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;updater.allowDowngrade=false;
    updater.on('checking-for-update',()=>send('checking','Checking for a new version…'));
    updater.on('update-available',info=>send('downloading','A new version is downloading.',{nextVersion:info.version}));
    updater.on('download-progress',info=>send('downloading','A new version is downloading.',{percent:Math.round(info.percent)}));
    updater.on('update-not-available',()=>send('current','You have the latest version.'));
    updater.on('update-downloaded',info=>send('ready','Update ready. Save your capture, then restart to install.',{nextVersion:info.version}));
    updater.on('error',()=>send('error','The update could not be verified or downloaded. Your current version is unchanged.'));
    send('idle','Automatic checks are on. Only release information is sent; captures stay on this device.');
    void check();timer=setInterval(()=>void check(),6*60*60*1000);timer.unref?.();
  }
  async function check() {
    if(!updater)return status;
    if(isCapturing()){send('paused','Updates are paused while recording traffic.');return status;}
    if(checking||status.state==='downloading'||status.state==='ready')return status;
    checking=true;try{await updater.checkForUpdates()}catch{send('error','Could not check for updates. Your current version is unchanged.')}finally{checking=false;}
    return status;
  }
  function install(){if(!updater||status.state!=='ready')throw new Error('No verified update is ready.');if(isCapturing())throw new Error('Stop and save the capture before restarting.');updater.quitAndInstall(false,true);}
  return {init,check,install,status:()=>status,onStatus:cb=>{events.on('status',cb);return()=>events.off('status',cb)},dispose:()=>{if(timer)clearInterval(timer)}};
}
module.exports={validateRelease,createUpdates};