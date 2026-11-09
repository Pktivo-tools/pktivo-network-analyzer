const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const run = promisify(execFile);
const WIN_DUMPCAP=()=>path.join(process.env.ProgramFiles||'C:\\Program Files','Wireshark','dumpcap.exe');
function candidates(platform=process.platform){
  return platform==='win32'?[WIN_DUMPCAP(),'dumpcap.exe']:['/usr/bin/dumpcap','/usr/local/bin/dumpcap','/opt/homebrew/bin/dumpcap','/Applications/Wireshark.app/Contents/MacOS/dumpcap','/usr/sbin/tcpdump','/usr/bin/tcpdump','/opt/homebrew/bin/tcpdump'];
}
async function findTool(platform=process.platform) {
  for(const executable of candidates(platform)){try{const {stdout}=await run(executable,['--version'],{timeout:4000,windowsHide:true});return{executable,dumpcap:path.basename(executable).startsWith('dumpcap'),version:String(stdout).split(/\r?\n/)[0]||''}}catch{}}
  throw new Error(platform==='win32'?'Install Wireshark with Npcap to enable live capture.':'Install dumpcap or tcpdump and grant your user capture permission.');
}
function parseInterfaces(stdout){return String(stdout).trim().split(/\r?\n/).map(line=>{const m=/^\d+\.\s*([^\s]+)(?:\s+\((.*)\))?/.exec(line);return m?{name:m[1],description:m[2]||m[1]}:null}).filter(Boolean);}
async function listInterfaces(tool) {const { stdout }=await run(tool.executable,['-D'],{timeout:8000,windowsHide:true});return parseInterfaces(stdout);}

const FILTER_RE=/^[A-Za-z0-9 .:/_\-()!&|<>=\[\]*+]*$/;
const MAX={packets:100000000,seconds:604800,megabytes:1000000,files:1000};
function int(v,max,label){if(v===undefined||v===null||v==='')return 0;const n=Number(v);if(!Number.isInteger(n)||n<0||n>max)throw new Error(`${label} must be a whole number between 0 and ${max}.`);return n;}
/** Validates renderer-supplied capture options against the interfaces main discovered. */
function validateOptions(raw,allowed,tool){
  if(!raw||typeof raw!=='object')throw new Error('Invalid capture options.');
  const names=Array.isArray(raw.interfaces)?raw.interfaces:[];
  if(!names.length)throw new Error('Select at least one network interface.');
  if(names.length>16||names.some(n=>typeof n!=='string'||!allowed.some(i=>i.name===n))||new Set(names).size!==names.length)throw new Error('Select a valid network interface.');
  if(names.length>1&&!tool.dumpcap)throw new Error('Recording several interfaces at once needs dumpcap (from Wireshark).');
  const filter=typeof raw.filter==='string'?raw.filter.trim():'';
  if(filter.length>500||!FILTER_RE.test(filter)||filter.startsWith('-'))throw new Error('The capture filter contains characters that are not allowed.');
  const stop={packets:int(raw.stop?.packets,MAX.packets,'Packet limit'),seconds:int(raw.stop?.seconds,MAX.seconds,'Time limit'),megabytes:int(raw.stop?.megabytes,MAX.megabytes,'Size limit')};
  let ring=null;
  if(raw.ring&&raw.ring.enabled){
    if(!tool.dumpcap)throw new Error('Saving to rotating files needs dumpcap (from Wireshark).');
    ring={megabytes:int(raw.ring.megabytes,MAX.megabytes,'File size'),seconds:int(raw.ring.seconds,MAX.seconds,'File duration'),files:int(raw.ring.files,MAX.files,'Number of files')};
    if(!ring.megabytes&&!ring.seconds)throw new Error('Choose when to start a new file (size or time).');
  }
  return {interfaces:names,filter,stop,ring};
}
/** Builds arguments for spawn() (never a shell). outFile is chosen in main, never by the renderer. */
function buildCaptureArgs(tool,options,outFile){
  const {interfaces,filter,stop,ring}=options;
  if(tool.dumpcap){
    const args=[];for(const i of interfaces)args.push('-i',i);
    if(filter)args.push('-f',filter);
    if(stop.packets)args.push('-c',String(stop.packets));
    if(ring){
      if(stop.seconds)args.push('-a',`duration:${stop.seconds}`);
      if(ring.megabytes)args.push('-b',`filesize:${ring.megabytes*1000}`);
      if(ring.seconds)args.push('-b',`duration:${ring.seconds}`);
      if(ring.files)args.push('-b',`files:${ring.files}`);
      args.push('-q','-w',outFile);
    }else args.push('-q','-w','-');
    return args;
  }
  const args=['-i',interfaces[0],'-U','-n','-s','0'];
  if(stop.packets)args.push('-c',String(stop.packets));
  args.push('-w','-');
  if(filter)args.push(...filter.split(/\s+/));
  return args;
}
function captureArgs(tool,name){return buildCaptureArgs(tool,{interfaces:[name],filter:'',stop:{packets:0,seconds:0,megabytes:0},ring:null});}

function osRelease(){try{const t=fs.readFileSync('/etc/os-release','utf8');const get=k=>(new RegExp(`^${k}=\"?([^\"\\n]*)`,'m').exec(t)||[])[1]||'';return(get('ID')+' '+get('ID_LIKE')).toLowerCase()}catch{return''}}
function linuxFamily(){const r=osRelease();if(/arch|manjaro|endeavouros/.test(r))return'arch';if(/debian|ubuntu|mint/.test(r))return'debian';return'other';}
/** Fixed, non-user-controlled setup recipes per OS. */
function setupPlan(platform=process.platform,family=platform==='linux'?linuxFamily():''){
  const user=os.userInfo().username;
  if(platform==='linux'&&family==='debian')return{kind:'pkexec',label:'Install dumpcap and allow your user to capture',script:'set -e; export DEBIAN_FRONTEND=noninteractive; apt-get install -y wireshark-common; echo "wireshark-common wireshark-common/install-setuid boolean true" | debconf-set-selections; dpkg-reconfigure wireshark-common; usermod -aG wireshark "$1"',user,commands:['sudo apt install wireshark-common','sudo dpkg-reconfigure wireshark-common','sudo usermod -aG wireshark $USER'],after:'Log out and back in so the new permission takes effect.'};
  if(platform==='linux'&&family==='arch')return{kind:'pkexec',label:'Install dumpcap and allow your user to capture',script:'set -e; pacman -S --needed --noconfirm wireshark-cli; usermod -aG wireshark "$1"',user,commands:['sudo pacman -S wireshark-cli','sudo usermod -aG wireshark $USER'],after:'Log out and back in so the new permission takes effect.'};
  if(platform==='linux')return{kind:'manual',label:'Install your distribution\u2019s Wireshark/dumpcap package',commands:['sudo usermod -aG wireshark $USER'],after:'Log out and back in afterwards.'};
  if(platform==='darwin')return{kind:'download',label:'Download Wireshark for macOS',url:'https://www.wireshark.org/download.html',commands:['brew install --cask wireshark'],after:'Run \u201cInstall ChmodBPF.pkg\u201d and \u201cAdd Wireshark to the system path.pkg\u201d from the Wireshark disk image, then restart.'};
  return{kind:'download',label:'Download Wireshark for Windows (includes Npcap)',url:'https://www.wireshark.org/download.html',commands:[],after:'Keep \u201cDumpcap\u201d selected and install Npcap when asked, then restart Windows.'};
}
async function diagnose(platform=process.platform){
  const plan=setupPlan(platform);const {kind,label,commands,after,url}=plan;const fix={kind,label,commands,after,url:url||null,canRun:kind==='pkexec'||kind==='download'};
  let tool=null;try{tool=await findTool(platform)}catch{return{ok:false,step:'tool',message:'No capture tool was found on this computer.',tool:null,interfaces:[],fix}}
  try{const interfaces=await listInterfaces(tool);if(!interfaces.length)return{ok:false,step:'permission',message:'The capture tool found no network interfaces you are allowed to use.',tool:tool.version,interfaces:[],fix};return{ok:true,step:'ready',message:`Ready to capture with ${tool.dumpcap?'dumpcap':'tcpdump'}.`,tool:tool.version,interfaces,fix}}
  catch(e){return{ok:false,step:'permission',message:'The capture tool is installed, but your user is not allowed to capture yet.',tool:tool.version,interfaces:[],fix}}
}
module.exports={findTool,listInterfaces,parseInterfaces,captureArgs,buildCaptureArgs,validateOptions,setupPlan,diagnose,linuxFamily};
