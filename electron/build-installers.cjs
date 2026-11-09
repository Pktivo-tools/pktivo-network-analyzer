// Installer builds run on native release CI, not in the hosted web build.
const config=require('./release-config.json');
const {validateRelease}=require('./updates.cjs');
validateRelease(config);
if(!config.enabled)throw new Error('Configure the HTTPS release host and signing identity before building update-enabled installers.');
module.exports={
  appId:'dev.pktivo.desktop',productName:'Pktivo',directories:{output:'installer-release'},
  files:['dist/**/*','electron/main.cjs','electron/preload.cjs','electron/capture.cjs','electron/assistant.cjs','electron/updates.cjs','electron/updater-runtime.cjs','electron/release-config.json','package.json'],
  asar:true,publish:[{provider:'generic',url:config.baseUrl}],
  win:{target:[{target:'nsis',arch:['x64']}],publisherName:config.publisherName,forceCodeSigning:true},
  nsis:{oneClick:false,perMachine:false,allowToChangeInstallationDirectory:true},
  mac:{target:['dmg','zip'],hardenedRuntime:true,notarize:true,forceCodeSigning:true,category:'public.app-category.developer-tools'},
  linux:{target:['deb','pacman'],category:'Network',maintainer:'Pktivo release maintainer'},
};