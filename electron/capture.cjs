const { spawn, execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const run = promisify(execFile);
async function findTool(platform=process.platform) {
  const candidates=platform==='win32' ? [path.join(process.env.ProgramFiles||'C:\\Program Files','Wireshark','dumpcap.exe'),'dumpcap.exe'] : ['/usr/bin/dumpcap','/usr/local/bin/dumpcap','/opt/homebrew/bin/dumpcap','/usr/sbin/tcpdump','/usr/bin/tcpdump','/opt/homebrew/bin/tcpdump'];
  for(const executable of candidates){try{await run(executable,['--version'],{timeout:4000,windowsHide:true});return{executable,dumpcap:path.basename(executable).startsWith('dumpcap')}}catch{}}
  throw new Error(platform==='win32'?'Install Wireshark with Npcap to enable live capture.':'Install dumpcap or tcpdump and grant your user capture permission.');
}
async function listInterfaces(tool) {
  const { stdout }=await run(tool.executable,['-D'],{timeout:8000,windowsHide:true});
  return stdout.trim().split(/\r?\n/).map(line=>{const m=/^\d+\.([^\s]+)(?:\s+\((.*)\))?/.exec(line);return m?{name:m[1],description:m[2]||m[1]}:null}).filter(Boolean);
}
function captureArgs(tool,name) {return tool.dumpcap?['-i',name,'-q','-w','-']:['-i',name,'-U','-n','-s','0','-w','-'];}
module.exports={findTool,listInterfaces,captureArgs};
