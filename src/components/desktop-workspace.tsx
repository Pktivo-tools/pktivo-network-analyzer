import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpToLine, ChevronDown, ChevronUp, Copy, FolderOpen, Play, RotateCcw, Save, Search, Settings2, ShieldAlert, Square, Wrench, X, ZoomIn, ZoomOut, Palette, ListEnd, CornerDownRight, Bookmark, Check, Radio, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '@/components/ui/menubar';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PacketBytes, PacketTree } from '@/components/netlens-inspector';
import { PktivoUpdateStatus } from '@/components/netlens-update-status';
import { PktivoLocalHelp } from '@/components/netlens-local-help';
import { ThemeGrid, useTheme } from '@/components/theme-picker';
import { CaptureParser } from '@/lib/netlens/capture-parser';
import { Dissector } from '@/lib/netlens/dissect';
import { demoPackets } from '@/lib/netlens/demo';
import { compileFilter, FILTER_EXAMPLES } from '@/lib/netlens/filter';
import { computeStats } from '@/lib/netlens/stats';
import { followStream } from '@/lib/netlens/streams';
import { writePcapng } from '@/lib/netlens/writer';
import { formatBytes } from '@/lib/netlens/format';
import { analyzePackets } from '@/lib/netlens/findings';
import { bindTabLifetime } from '@/lib/netlens/tab-lifetime';
import type { Packet, TreeNode } from '@/lib/netlens/types';
import type { CaptureDiagnosis, CaptureInterface } from '@/lib/netlens/desktop';

const ROW=20;
const CAPTURE_FILTERS=[{label:'Only web traffic',filter:'tcp port 80 or tcp port 443'},{label:'Only DNS',filter:'udp port 53'},{label:'Only one computer',filter:'host 192.168.1.10'},{label:'Skip ARP and broadcast',filter:'not arp and not broadcast'},{label:'Only TCP',filter:'tcp'}];
type Modal='options'|'setup'|'filters'|'stream'|'expert'|'summary'|'hierarchy'|'conversations'|'endpoints'|'io'|'goto'|'about'|'help'|'theme'|null;
type TimeFmt='rel'|'delta'|'abs';
function download(bytes:Uint8Array,name:string){const url=URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
const num=(v:string)=>{const n=Math.floor(Number(v));return Number.isFinite(n)&&n>0?n:0};

export function DesktopWorkspace(){
  const [packets,setPackets]=useState<Packet[]>([]);const [filename,setFilename]=useState('');
  const [selected,setSelected]=useState(0);const [range,setRange]=useState<TreeNode|null>(null);
  const [draft,setDraft]=useState('');const [applied,setApplied]=useState('');const [recent,setRecent]=useState<string[]>([]);
  const [modal,setModal]=useState<Modal>(null);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [live,setLive]=useState(false);const [toFiles,setToFiles]=useState<string|null>(null);const [busy,setBusy]=useState(false);
  const [interfaces,setInterfaces]=useState<CaptureInterface[]>([]);const [chosen,setChosen]=useState<string[]>([]);
  const [isDumpcap,setIsDumpcap]=useState(true);const [diag,setDiag]=useState<CaptureDiagnosis|null>(null);const [setupBusy,setSetupBusy]=useState(false);
  const [capFilter,setCapFilter]=useState('');const [stop,setStop]=useState({packets:'',seconds:'',megabytes:''});
  const [ring,setRing]=useState({enabled:false,megabytes:'100',seconds:'',files:'10'});const [folder,setFolder]=useState<string|null>(null);
  const [show,setShow]=useState({toolbar:true,filter:true,details:true,bytes:true});const [colorize,setColorize]=useState(true);
  const [autoScroll,setAutoScroll]=useState(true);const [timeFmt,setTimeFmt]=useState<TimeFmt>('rel');const [zoom,setZoom]=useState(1);
  const [marked,setMarked]=useState<Set<number>>(new Set());const [find,setFind]=useState<string|null>(null);const [gotoNo,setGotoNo]=useState('');
  const [scrollTop,setScrollTop]=useState(0);const [listH,setListH]=useState(300);
  const {theme,select:selectTheme}=useTheme();
  const listRef=useRef<HTMLDivElement>(null);const fileInput=useRef<HTMLInputElement>(null);
  const parserRef=useRef(new CaptureParser());const dissectorRef=useRef(new Dissector());const gen=useRef(0);const lastOptions=useRef<unknown>(null);
  const compiled=useMemo(()=>compileFilter(applied),[applied]);const validation=useMemo(()=>compileFilter(draft),[draft]);
  const filtered=useMemo(()=>compiled.ok?packets.filter(p=>compiled.test(p)):packets,[packets,compiled]);
  const packet=filtered.find(p=>p.no===selected)??null;
  const findings=useMemo(()=>analyzePackets(packets),[packets]);const flagged=useMemo(()=>new Set(findings.flatMap(f=>f.packetNos)),[findings]);
  const stats=useMemo(()=>computeStats(filtered),[filtered]);
  const stream=useMemo(()=>packet?.stream&&modal==='stream'?followStream(packets,packet.stream.kind,packet.stream.index):null,[packet,packets,modal]);
  const bridge=typeof window!=='undefined'?window.netlens:undefined;

  useEffect(()=>bindTabLifetime(window,()=>{gen.current++;setPackets([]);setFilename('');setSelected(0);void window.netlens?.stop()}),[]);
  useEffect(()=>{const b=window.netlens;if(!b)return;
    const a=b.onData(bytes=>{try{const raw=parserRef.current.push(new Uint8Array(bytes));if(raw.length)setPackets(prev=>[...prev,...raw.map(p=>dissectorRef.current.dissect(p))])}catch(e){setError(e instanceof Error?e.message:'Capture decoding failed');void b.stop()}});
    const c=b.onError(m=>{setError(m);setLive(false)});const d=b.onStopped(()=>{setLive(false)});return()=>{a();c();d()}},[]);
  useEffect(()=>{const el=listRef.current;if(!el)return;const ro=new ResizeObserver(()=>setListH(el.clientHeight));ro.observe(el);return()=>ro.disconnect()},[show]);
  useEffect(()=>{if(live&&autoScroll&&listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight},[filtered.length,live,autoScroll]);

  const refreshInterfaces=useCallback(async()=>{if(!window.netlens)return null;setDiag(null);const d=await window.netlens.diagnose();setDiag(d);if(d.ok){setInterfaces(d.interfaces);setChosen(c=>c.filter(n=>d.interfaces.some(i=>i.name===n)).length?c:d.interfaces.slice(0,1).map(i=>i.name));const t=await window.netlens.captureTool();setIsDumpcap(Boolean(t?.dumpcap))}return d},[]);
  useEffect(()=>{void refreshInterfaces()},[refreshInterfaces]);

  function apply(v:string){setDraft(v);if(compileFilter(v).ok){setApplied(v);if(v)setRecent(r=>[v,...r.filter(x=>x!==v)].slice(0,8))}}
  function select(no:number){setSelected(no);setRange(null)}
  function scrollTo(no:number){const i=filtered.findIndex(p=>p.no===no);if(i<0||!listRef.current)return;const el=listRef.current;const top=i*ROW;if(top<el.scrollTop+ROW)el.scrollTop=top-ROW;else if(top>el.scrollTop+el.clientHeight-ROW*2)el.scrollTop=top-el.clientHeight+ROW*2}
  function go(no:number|undefined){if(no===undefined)return;select(no);requestAnimationFrame(()=>scrollTo(no))}
  const idx=packet?filtered.indexOf(packet):-1;
  const first=()=>go(filtered[0]?.no),last=()=>go(filtered.at(-1)?.no),prev=()=>go(filtered[Math.max(0,idx-1)]?.no),next=()=>go(filtered[Math.min(filtered.length-1,idx+1)]?.no);
  function findNext(q:string,dir=1){if(!q)return;const c=compileFilter(q);const match=(p:Packet)=>c.ok&&/[=<>]|\b(and|or|not)\b/.test(q)?c.test(p):`${p.src} ${p.dst} ${p.protocol} ${p.info}`.toLowerCase().includes(q.toLowerCase());const n=filtered.length;for(let k=1;k<=n;k++){const p=filtered[(idx+dir*k+n*k)%n];if(p&&match(p)){go(p.no);return}}setNotice(`No packet matches “${q}”.`)}
  async function openFile(file:File){if(live)return;const g=++gen.current;setBusy(true);setError('');try{const r=file.stream().getReader();const parser=new CaptureParser();const d=new Dissector();const out:Packet[]=[];for(;;){const {done,value}=await r.read();if(g!==gen.current){await r.cancel();return}if(done)break;out.push(...parser.push(value).map(p=>d.dissect(p)))}if(parser.detectedFormat==='unknown')throw new Error();setPackets(out);setFilename(file.name);setMarked(new Set());select(out[0]?.no??0);if(listRef.current)listRef.current.scrollTop=0}catch{if(g===gen.current)setError('Unable to read this capture. Choose a complete PCAP or PCAPNG file.')}finally{if(g===gen.current)setBusy(false)}}
  function save(which:'all'|'displayed'|'marked'){const list=which==='all'?packets:which==='marked'?packets.filter(p=>marked.has(p.no)):filtered;if(!list.length)return;download(writePcapng(list.map(p=>({ts:p.ts,data:p.data,origLen:p.len,linkType:p.linkType}))),(filename||'capture').replace(/\.(pcap|pcapng|cap)$/i,'')+(which==='all'?'':`-${which}`)+'.pcapng')}
  function closeFile(){if(live)return;gen.current++;setPackets([]);setFilename('');select(0);setMarked(new Set())}
  async function openOptions(){setModal('options');setError('');const d=await refreshInterfaces();if(d&&!d.ok)setModal('setup')}
  function buildOptions(){return{interfaces:chosen,filter:capFilter,stop:{packets:num(stop.packets),seconds:num(stop.seconds),megabytes:num(stop.megabytes)},ring:{enabled:ring.enabled,megabytes:num(ring.megabytes),seconds:num(ring.seconds),files:num(ring.files)}}}
  async function start(options:unknown=lastOptions.current??buildOptions()){
    if(!bridge)return;if(!interfaces.length){await openOptions();return}
    setError('');parserRef.current=new CaptureParser();dissectorRef.current=new Dissector();setPackets([]);setMarked(new Set());select(0);
    const opts=options as ReturnType<typeof buildOptions>;setFilename(`live-${opts.interfaces.join('+')}.pcapng`);setLive(true);setModal(null);lastOptions.current=opts;
    try{const r=await bridge.start(opts as never);setToFiles(r&&r.toFiles?r.folder:null)}catch(e){setError(e instanceof Error?e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/,''):'Could not start capture');setLive(false)}}
  const stopCapture=()=>void bridge?.stop();
  const restart=async()=>{if(live){await bridge?.stop();setTimeout(()=>void start(),400)}else void start()};
  async function runSetup(){if(!bridge)return;setSetupBusy(true);setError('');try{const r=await bridge.runSetup();setNotice(r.message);await refreshInterfaces()}catch(e){setError(e instanceof Error?e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/,''):'Setup failed')}finally{setSetupBusy(false)}}
  function toggleMark(no=packet?.no){if(!no)return;setMarked(m=>{const n=new Set(m);if(n.has(no))n.delete(no);else n.add(no);return n})}
  function copy(text:string){void navigator.clipboard?.writeText(text);setNotice('Copied.')}
  const fmtTime=(p:Packet)=>timeFmt==='rel'?p.rel.toFixed(6):timeFmt==='delta'?p.delta.toFixed(6):new Date(p.ts*1000).toISOString().slice(11,23);

  useEffect(()=>{const h=(e:KeyboardEvent)=>{const mod=e.ctrlKey||e.metaKey;const typing=(e.target as HTMLElement)?.tagName==='INPUT';
    if(mod&&e.key.toLowerCase()==='o'){e.preventDefault();fileInput.current?.click()}
    else if(mod&&e.key.toLowerCase()==='k'){e.preventDefault();void openOptions()}
    else if(mod&&e.key.toLowerCase()==='e'){e.preventDefault();live?stopCapture():void start()}
    else if(mod&&e.key.toLowerCase()==='r'){e.preventDefault();void restart()}
    else if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();save('all')}
    else if(mod&&e.key.toLowerCase()==='f'){e.preventDefault();setFind(f=>f??'')}
    else if(mod&&e.key.toLowerCase()==='g'){e.preventDefault();setModal('goto')}
    else if(mod&&e.key.toLowerCase()==='m'){e.preventDefault();toggleMark()}
    else if(mod&&(e.key==='='||e.key==='+')){e.preventDefault();setZoom(z=>Math.min(1.6,z+0.1))}
    else if(mod&&e.key==='-'){e.preventDefault();setZoom(z=>Math.max(0.7,z-0.1))}
    else if(mod&&e.key==='0'){e.preventDefault();setZoom(1)}
    else if(!typing&&!modal&&e.key==='ArrowDown'){e.preventDefault();next()}else if(!typing&&!modal&&e.key==='ArrowUp'){e.preventDefault();prev()}
    else if(!typing&&!modal&&e.key==='Home'){e.preventDefault();first()}else if(!typing&&!modal&&e.key==='End'){e.preventDefault();last()}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)});

  const startIdx=Math.max(0,Math.floor(scrollTop/ROW)-10);const endIdx=Math.min(filtered.length,startIdx+Math.ceil(listH/ROW)+20);
  const T=({icon:I,label,onClick,disabled,active,danger}:{icon:typeof Play;label:string;onClick:()=>void;disabled?:boolean;active?:boolean;danger?:boolean})=><Button variant="ghost" size="icon" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={`size-7 ${active?'bg-accent text-primary':''} ${danger?'text-destructive':''}`}><I className="size-4"/></Button>;
  const hasStream=Boolean(packet?.stream);
  const filterState=!draft?'':validation.ok?'ws-filter-ok':'ws-filter-bad';

  return <div className="ws-shell rr-block rr-mask" data-private="true" style={{fontSize:`${13*zoom}px`}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)void openFile(f)}}>
    <Menubar className="ws-menubar">
      <MenubarMenu><MenubarTrigger>File</MenubarTrigger><MenubarContent>
        <MenubarItem disabled={live} onSelect={()=>fileInput.current?.click()}>Open…<MenubarShortcut>Ctrl+O</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={live||!packets.length} onSelect={closeFile}>Close</MenubarItem><MenubarSeparator/>
        <MenubarItem disabled={!packets.length} onSelect={()=>save('all')}>Save all packets as…<MenubarShortcut>Ctrl+S</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={!filtered.length} onSelect={()=>save('displayed')}>Export displayed packets…</MenubarItem>
        <MenubarItem disabled={!marked.size} onSelect={()=>save('marked')}>Export marked packets…</MenubarItem>
        <MenubarItem disabled={!stream&&!hasStream} onSelect={()=>setModal('stream')}>Export stream payload…</MenubarItem><MenubarSeparator/>
        <MenubarItem disabled={live} onSelect={()=>{setPackets(demoPackets());setFilename('sample-traffic.pcapng');select(1)}}>Load sample capture</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Edit</MenubarTrigger><MenubarContent>
        <MenubarItem onSelect={()=>setFind(f=>f??'')}>Find packet…<MenubarShortcut>Ctrl+F</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={!packet} onSelect={()=>toggleMark()}>Mark / unmark packet<MenubarShortcut>Ctrl+M</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={!marked.size} onSelect={()=>setMarked(new Set())}>Unmark all</MenubarItem>
        <MenubarItem disabled={!marked.size} onSelect={()=>{const m=filtered.find(p=>marked.has(p.no)&&p.no>(packet?.no??0))??filtered.find(p=>marked.has(p.no));go(m?.no)}}>Next marked packet</MenubarItem><MenubarSeparator/>
        <MenubarItem disabled={!packet} onSelect={()=>packet&&copy(`${packet.no}\t${fmtTime(packet)}\t${packet.src}\t${packet.dst}\t${packet.protocol}\t${packet.len}\t${packet.info}`)}>Copy packet summary</MenubarItem>
        <MenubarItem disabled={!packet} onSelect={()=>packet&&copy(Array.from(packet.data,b=>b.toString(16).padStart(2,'0')).join(''))}>Copy bytes as hex</MenubarItem>
        <MenubarItem disabled={!range?.field} onSelect={()=>range?.field&&copy(range.label)}>Copy selected field</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>View</MenubarTrigger><MenubarContent>
        <MenubarCheckboxItem checked={show.toolbar} onCheckedChange={v=>setShow(s=>({...s,toolbar:Boolean(v)}))}>Main toolbar</MenubarCheckboxItem>
        <MenubarCheckboxItem checked={show.filter} onCheckedChange={v=>setShow(s=>({...s,filter:Boolean(v)}))}>Filter toolbar</MenubarCheckboxItem>
        <MenubarCheckboxItem checked={show.details} onCheckedChange={v=>setShow(s=>({...s,details:Boolean(v)}))}>Packet details</MenubarCheckboxItem>
        <MenubarCheckboxItem checked={show.bytes} onCheckedChange={v=>setShow(s=>({...s,bytes:Boolean(v)}))}>Packet bytes</MenubarCheckboxItem><MenubarSeparator/>
        <MenubarSub><MenubarSubTrigger>Time display format</MenubarSubTrigger><MenubarSubContent><MenubarRadioGroup value={timeFmt} onValueChange={v=>setTimeFmt(v as TimeFmt)}><MenubarRadioItem value="rel">Seconds since capture start</MenubarRadioItem><MenubarRadioItem value="delta">Seconds since previous packet</MenubarRadioItem><MenubarRadioItem value="abs">Time of day (UTC)</MenubarRadioItem></MenubarRadioGroup></MenubarSubContent></MenubarSub>
        <MenubarCheckboxItem checked={colorize} onCheckedChange={v=>setColorize(Boolean(v))}>Colorize packet list</MenubarCheckboxItem>
        <MenubarCheckboxItem checked={autoScroll} onCheckedChange={v=>setAutoScroll(Boolean(v))}>Auto-scroll during live capture</MenubarCheckboxItem><MenubarSeparator/>
        <MenubarItem onSelect={()=>setZoom(z=>Math.min(1.6,z+0.1))}>Zoom in<MenubarShortcut>Ctrl++</MenubarShortcut></MenubarItem><MenubarItem onSelect={()=>setZoom(z=>Math.max(0.7,z-0.1))}>Zoom out<MenubarShortcut>Ctrl+-</MenubarShortcut></MenubarItem><MenubarItem onSelect={()=>setZoom(1)}>Normal size<MenubarShortcut>Ctrl+0</MenubarShortcut></MenubarItem><MenubarSeparator/>
        <MenubarItem onSelect={()=>setModal('theme')}>Color theme…</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Go</MenubarTrigger><MenubarContent>
        <MenubarItem onSelect={()=>setModal('goto')}>Go to packet…<MenubarShortcut>Ctrl+G</MenubarShortcut></MenubarItem><MenubarSeparator/>
        <MenubarItem onSelect={first}>First packet<MenubarShortcut>Home</MenubarShortcut></MenubarItem><MenubarItem onSelect={prev}>Previous packet<MenubarShortcut>↑</MenubarShortcut></MenubarItem><MenubarItem onSelect={next}>Next packet<MenubarShortcut>↓</MenubarShortcut></MenubarItem><MenubarItem onSelect={last}>Last packet<MenubarShortcut>End</MenubarShortcut></MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Capture</MenubarTrigger><MenubarContent>
        <MenubarItem disabled={live} onSelect={()=>void openOptions()}>Options…<MenubarShortcut>Ctrl+K</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={live||!chosen.length} onSelect={()=>void start()}>Start<MenubarShortcut>Ctrl+E</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={!live} onSelect={stopCapture}>Stop<MenubarShortcut>Ctrl+E</MenubarShortcut></MenubarItem>
        <MenubarItem disabled={!chosen.length} onSelect={()=>void restart()}>Restart<MenubarShortcut>Ctrl+R</MenubarShortcut></MenubarItem><MenubarSeparator/>
        <MenubarItem onSelect={()=>{setModal('setup');void refreshInterfaces()}}>Check capture setup…</MenubarItem>
        <MenubarItem disabled={live} onSelect={()=>void refreshInterfaces()}>Refresh interfaces</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Analyze</MenubarTrigger><MenubarContent>
        <MenubarItem onSelect={()=>setModal('filters')}>Display filter examples…</MenubarItem>
        <MenubarItem disabled={!range?.field} onSelect={()=>range?.field&&apply(range.field)}>Apply selected field as filter</MenubarItem><MenubarSeparator/>
        <MenubarItem disabled={packet?.stream?.kind!=='tcp'} onSelect={()=>setModal('stream')}>Follow TCP stream</MenubarItem>
        <MenubarItem disabled={packet?.stream?.kind!=='udp'} onSelect={()=>setModal('stream')}>Follow UDP stream</MenubarItem><MenubarSeparator/>
        <MenubarItem onSelect={()=>setModal('expert')}>Expert information ({findings.length})</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Statistics</MenubarTrigger><MenubarContent>
        <MenubarItem onSelect={()=>setModal('summary')}>Capture file properties</MenubarItem><MenubarItem onSelect={()=>setModal('hierarchy')}>Protocol hierarchy</MenubarItem>
        <MenubarItem onSelect={()=>setModal('conversations')}>Conversations</MenubarItem><MenubarItem onSelect={()=>setModal('endpoints')}>Endpoints</MenubarItem><MenubarItem onSelect={()=>setModal('io')}>I/O graph</MenubarItem>
      </MenubarContent></MenubarMenu>
      <MenubarMenu><MenubarTrigger>Help</MenubarTrigger><MenubarContent>
        <MenubarItem onSelect={()=>setModal('help')}>Local AI help…</MenubarItem><MenubarItem onSelect={()=>{setModal('setup');void refreshInterfaces()}}>Capture setup help…</MenubarItem><MenubarSeparator/><MenubarItem onSelect={()=>setModal('about')}>About Pktivo & updates</MenubarItem>
      </MenubarContent></MenubarMenu>
    </Menubar>
    {show.toolbar&&<div className="ws-toolbar" role="toolbar" aria-label="Main toolbar">
      <T icon={Play} label="Start capturing (Ctrl+E)" disabled={live} onClick={()=>void start()}/>
      <T icon={Square} label="Stop capturing (Ctrl+E)" disabled={!live} danger={live} onClick={stopCapture}/>
      <T icon={RotateCcw} label="Restart capture (Ctrl+R)" disabled={!chosen.length} onClick={()=>void restart()}/>
      <T icon={Settings2} label="Capture options (Ctrl+K)" disabled={live} onClick={()=>void openOptions()}/>
      <span className="ws-sep"/>
      <T icon={FolderOpen} label="Open capture file (Ctrl+O)" disabled={live} onClick={()=>fileInput.current?.click()}/>
      <T icon={Save} label="Save packets (Ctrl+S)" disabled={!packets.length} onClick={()=>save('all')}/>
      <T icon={X} label="Close file" disabled={live||!packets.length} onClick={closeFile}/>
      <span className="ws-sep"/>
      <T icon={Search} label="Find packet (Ctrl+F)" active={find!==null} onClick={()=>setFind(f=>f===null?'':null)}/>
      <T icon={ChevronUp} label="Previous packet" onClick={prev}/><T icon={ChevronDown} label="Next packet" onClick={next}/>
      <T icon={CornerDownRight} label="Go to packet (Ctrl+G)" onClick={()=>setModal('goto')}/>
      <T icon={ArrowUpToLine} label="First packet" onClick={first}/><T icon={ArrowDownToLine} label="Last packet" onClick={last}/>
      <T icon={ListEnd} label="Auto-scroll during live capture" active={autoScroll} onClick={()=>setAutoScroll(a=>!a)}/>
      <span className="ws-sep"/>
      <T icon={Palette} label="Colorize packet list" active={colorize} onClick={()=>setColorize(c=>!c)}/>
      <T icon={ZoomIn} label="Zoom in" onClick={()=>setZoom(z=>Math.min(1.6,z+0.1))}/><T icon={ZoomOut} label="Zoom out" onClick={()=>setZoom(z=>Math.max(0.7,z-0.1))}/>
      <span className="ws-sep"/>
      <T icon={Bookmark} label="Mark packet (Ctrl+M)" disabled={!packet} active={Boolean(packet&&marked.has(packet.no))} onClick={()=>toggleMark()}/>
      <T icon={ShieldAlert} label="Expert information" active={findings.length>0} onClick={()=>setModal('expert')}/>
      <T icon={Wrench} label="Check capture setup" onClick={()=>{setModal('setup');void refreshInterfaces()}}/>
    </div>}
    {show.filter&&<form className={`ws-filter ${filterState}`} onSubmit={e=>{e.preventDefault();apply(draft)}}>
      <Bookmark className="size-3.5 shrink-0 text-muted-foreground"/>
      <input list="ws-recent" aria-label="Display filter" placeholder="Apply a display filter … <Ctrl-/>" value={draft} onChange={e=>setDraft(e.target.value)} className="min-w-0 flex-1 bg-transparent font-mono outline-none"/>
      <datalist id="ws-recent">{[...recent,...FILTER_EXAMPLES.map(f=>f.filter)].map(f=><option key={f} value={f}/>)}</datalist>
      {draft&&<Button type="button" variant="ghost" size="icon" className="size-6" aria-label="Clear filter" onClick={()=>apply('')}><X className="size-3.5"/></Button>}
      <Button type="submit" variant="ghost" size="sm" className="h-6" disabled={!validation.ok}>Apply</Button>
      <Button type="button" variant="ghost" size="sm" className="h-6" onClick={()=>setModal('filters')}>Expressions…</Button>
    </form>}
    {!validation.ok&&draft&&<div className="ws-msg text-destructive">{validation.error}</div>}
    {find!==null&&<form className="ws-find" onSubmit={e=>{e.preventDefault();findNext(find)}}><span className="text-muted-foreground">Find:</span><input autoFocus aria-label="Find packet" value={find} onChange={e=>setFind(e.target.value)} placeholder="Text in address, protocol or info — or a display filter" className="min-w-0 flex-1 rounded border bg-background px-2 py-0.5 outline-none"/><Button type="button" size="sm" variant="ghost" className="h-6" onClick={()=>findNext(find,-1)}>Previous</Button><Button type="submit" size="sm" variant="secondary" className="h-6">Find</Button><Button type="button" size="icon" variant="ghost" className="size-6" aria-label="Close find" onClick={()=>setFind(null)}><X className="size-3.5"/></Button></form>}
    {error&&<div role="alert" className="ws-msg flex items-center justify-between gap-2 bg-destructive/10 text-destructive"><span>{error}</span><span className="flex gap-1">{!live&&<Button size="sm" variant="outline" className="h-6" onClick={()=>{setModal('setup');void refreshInterfaces()}}>Fix capture setup</Button>}<Button size="icon" variant="ghost" className="size-6" aria-label="Dismiss" onClick={()=>setError('')}><X className="size-3.5"/></Button></span></div>}
    {notice&&<div role="status" className="ws-msg flex items-center justify-between bg-accent"><span>{notice}</span><Button size="icon" variant="ghost" className="size-6" aria-label="Dismiss" onClick={()=>setNotice('')}><X className="size-3.5"/></Button></div>}
    {toFiles&&live&&<div className="ws-msg bg-accent">Recording to rotating files in {toFiles}. Open them with File → Open after stopping.</div>}

    <div className="ws-panes">{!packets.length&&!live?<Welcome interfaces={interfaces} chosen={chosen} setChosen={setChosen} diag={diag} capFilter={capFilter} setCapFilter={setCapFilter} onStart={()=>void start(buildOptions())} onOptions={()=>void openOptions()} onOpen={()=>fileInput.current?.click()} onSetup={()=>{setModal('setup');void refreshInterfaces()}} onSample={()=>{setPackets(demoPackets());setFilename('sample-traffic.pcapng');select(1)}} desktop={Boolean(bridge)} busy={busy}/>:
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize={45} minSize={15}><div className="ws-list" ref={listRef} onScroll={e=>setScrollTop(e.currentTarget.scrollTop)}>
        <div className="ws-row ws-head"><span>No.</span><span>Time</span><span>Source</span><span>Destination</span><span>Protocol</span><span>Length</span><span>Info</span></div>
        <div style={{height:filtered.length*ROW,position:'relative'}}>{filtered.slice(startIdx,endIdx).map((p,k)=><div key={p.no} role="row" aria-selected={p.no===selected} onClick={()=>select(p.no)} onDoubleClick={()=>p.stream&&setModal('stream')} style={{top:(startIdx+k)*ROW}} className={`ws-row ${colorize?`ws-c-${flagged.has(p.no)?'alert':p.proto}`:''} ${p.no===selected?'ws-sel':''} ${marked.has(p.no)?'ws-marked':''}`}><span>{p.no}</span><span>{fmtTime(p)}</span><span>{p.src}</span><span>{p.dst}</span><span>{p.protocol}</span><span>{p.len}</span><span>{p.info}</span></div>)}</div>
        {!filtered.length&&<div className="p-6 text-center text-muted-foreground">{live?'Waiting for packets…':'No packets match this filter.'}</div>}
      </div></ResizablePanel>
      {show.details&&<><ResizableHandle/><ResizablePanel defaultSize={32} minSize={10}><div className="ws-pane">{packet?<PacketTree key={packet.no} packet={packet} onRange={setRange} onFilter={apply}/>:<p className="p-3 text-muted-foreground">Select a packet to see its details.</p>}{packet&&findings.filter(f=>f.packetNos.includes(packet.no)).map(f=><div key={f.id} className="mx-2 my-1 border-l-2 border-destructive px-2 text-xs"><strong>Expert: {f.title}</strong> — {f.explanation}</div>)}</div></ResizablePanel></>}
      {show.bytes&&<><ResizableHandle/><ResizablePanel defaultSize={23} minSize={8}><div className="ws-pane">{packet&&<PacketBytes packet={packet} range={range}/>}</div></ResizablePanel></>}
    </ResizablePanelGroup>}</div>

    <footer className="ws-status"><button type="button" className={`flex items-center gap-1 ${findings.some(f=>f.level==='review')?'text-destructive':findings.length?'text-primary':''}`} onClick={()=>setModal('expert')} title="Expert information"><span className={`size-2.5 rounded-full ${findings.some(f=>f.level==='review')?'bg-destructive':findings.length?'bg-primary':'bg-muted-foreground'}`}/></button>
      <span className="truncate">{live?<span className="text-destructive">● Capturing on {chosen.join(', ')}</span>:filename||'Ready to load or capture'}</span>
      <span className="ml-auto">Packets: {packets.length.toLocaleString()} · Displayed: {filtered.length.toLocaleString()} ({packets.length?(filtered.length/packets.length*100).toFixed(1):'0.0'}%){marked.size?` · Marked: ${marked.size}`:''}</span>
      {range?.field&&<span className="hidden font-mono md:inline">{range.field}</span>}<span>Profile: Default</span></footer>
    <input ref={fileInput} type="file" accept=".pcap,.pcapng,.cap" className="hidden" aria-label="Open capture file" onChange={e=>{const f=e.target.files?.[0];if(f)void openFile(f);e.target.value=''}}/>

    <Dialog open={modal!==null} onOpenChange={o=>{if(!o)setModal(null)}}><DialogContent data-private="true" className="rr-block rr-mask max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto">
      {modal==='options'&&<><DialogTitle>Capture options</DialogTitle><DialogDescription>Choose where to listen, what to keep and when to stop.</DialogDescription>
        <section className="space-y-2"><h3 className="text-sm font-medium">Interfaces {isDumpcap?'(choose one or more)':'(tcpdump records one at a time)'}</h3><div className="max-h-48 overflow-auto rounded border">{interfaces.map(i=><label key={i.name} className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-0 hover:bg-muted"><input type={isDumpcap?'checkbox':'radio'} name="iface" checked={chosen.includes(i.name)} onChange={e=>setChosen(c=>isDumpcap?(e.target.checked?[...c,i.name]:c.filter(n=>n!==i.name)):[i.name])}/><span className="font-mono">{i.name}</span><span className="truncate text-muted-foreground">{i.description!==i.name?i.description:''}</span></label>)}{!interfaces.length&&<p className="p-3 text-sm text-muted-foreground">No interfaces available. <Button variant="link" className="h-auto p-0" onClick={()=>setModal('setup')}>Check capture setup</Button></p>}</div></section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Capture filter <span className="font-normal text-muted-foreground">— only record matching traffic (BPF syntax)</span></h3><input aria-label="Capture filter" value={capFilter} onChange={e=>setCapFilter(e.target.value)} placeholder="e.g. tcp port 443   (leave empty to record everything)" className="w-full rounded border bg-background px-3 py-2 font-mono text-sm outline-none"/><div className="flex flex-wrap gap-1">{CAPTURE_FILTERS.map(f=><Button key={f.filter} size="sm" variant="outline" className="h-7 text-xs" onClick={()=>setCapFilter(f.filter)}>{f.label}</Button>)}</div></section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Stop automatically after <span className="font-normal text-muted-foreground">— leave empty for no limit</span></h3><div className="grid grid-cols-3 gap-2">{([['packets','packets'],['seconds','seconds'],['megabytes','megabytes']] as const).map(([k,l])=><label key={k} className="text-xs text-muted-foreground"><input aria-label={`Stop after ${l}`} inputMode="numeric" value={stop[k]} onChange={e=>setStop(s=>({...s,[k]:e.target.value.replace(/\D/g,'')}))} className="mb-1 w-full rounded border bg-background px-2 py-1.5 text-sm text-foreground outline-none"/>{l}</label>)}</div></section>
        <section className="space-y-2 rounded border p-3"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" disabled={!isDumpcap} checked={ring.enabled} onChange={e=>setRing(r=>({...r,enabled:e.target.checked}))}/>Save to rotating files (ring buffer) {!isDumpcap&&<span className="font-normal text-muted-foreground">— needs dumpcap</span>}</label>
          {ring.enabled&&<><p className="text-xs text-muted-foreground">For long recordings: packets go straight to files on disk and the oldest file is deleted when the limit is reached. The live list stays empty in this mode.</p><div className="grid grid-cols-3 gap-2">{([['megabytes','new file every … MB'],['seconds','new file every … seconds'],['files','keep at most … files']] as const).map(([k,l])=><label key={k} className="text-xs text-muted-foreground"><input aria-label={l} inputMode="numeric" value={ring[k]} onChange={e=>setRing(r=>({...r,[k]:e.target.value.replace(/\D/g,'')}))} className="mb-1 w-full rounded border bg-background px-2 py-1.5 text-sm text-foreground outline-none"/>{l}</label>)}</div><div className="flex items-center gap-2 text-sm"><Button size="sm" variant="outline" onClick={async()=>{const f=await bridge?.chooseFolder();if(f)setFolder(f)}}><FolderOpen/>Choose folder</Button><span className="truncate font-mono text-xs text-muted-foreground">{folder??'No folder chosen'}</span></div></>}
        </section>
        {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=>setModal(null)}>Close</Button><Button disabled={!chosen.length||(ring.enabled&&!folder)} onClick={()=>void start(buildOptions())}><Play/>Start</Button></div></>}
      {modal==='setup'&&<><DialogTitle>Capture setup</DialogTitle><DialogDescription>Pktivo records traffic with dumpcap, Wireshark’s small capture tool. This checks it’s ready.</DialogDescription>
        {!diag?<p className="text-sm text-muted-foreground">Checking…</p>:<div className="space-y-4 text-sm">
          <ol className="space-y-2">{[['Capture tool installed',diag.step!=='tool'],['Your user is allowed to capture',diag.ok],['Network interfaces found',diag.ok&&diag.interfaces.length>0]].map(([l,ok],i)=><li key={i} className="flex items-center gap-2">{ok?<Check className="size-4 text-primary"/>:<X className="size-4 text-destructive"/>}<span>{l as string}</span></li>)}</ol>
          <p className={diag.ok?'text-primary':'text-foreground'}>{diag.message}{diag.tool?<span className="block font-mono text-xs text-muted-foreground">{diag.tool}</span>:null}</p>
          {!diag.ok&&<div className="space-y-3 rounded border p-3"><h3 className="font-medium">Fix it</h3>
            {diag.fix.canRun&&<Button disabled={setupBusy} onClick={()=>void runSetup()}><Wrench/>{setupBusy?'Working… (approve the system prompt)':diag.fix.kind==='pkexec'?'Set it up for me':diag.fix.label}</Button>}
            {diag.fix.kind==='pkexec'&&<p className="text-xs text-muted-foreground">Your system will ask for your password in its own window. Pktivo never sees it.</p>}
            {diag.fix.commands.length>0&&<><p className="text-xs text-muted-foreground">{diag.fix.canRun?'Or run these in a terminal yourself:':'Run these in a terminal:'}</p>{diag.fix.commands.map(c=><div key={c} className="flex items-center gap-2 rounded bg-muted px-2 py-1 font-mono text-xs"><span className="flex-1">{c}</span><Button size="icon" variant="ghost" className="size-6" aria-label={`Copy ${c}`} onClick={()=>copy(c)}><Copy className="size-3"/></Button></div>)}</>}
            <p className="text-xs">{diag.fix.after}</p></div>}
          {error&&<p role="alert" className="text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>void refreshInterfaces()}><RotateCcw/>Check again</Button>{diag.ok&&<Button onClick={()=>setModal('options')}>Continue to capture options</Button>}</div></div>}</>}
      {modal==='filters'&&<><DialogTitle>Display filter expressions</DialogTitle><DialogDescription>Click one to apply it.</DialogDescription><div className="space-y-1">{FILTER_EXAMPLES.map(e=><Button key={e.filter} variant="ghost" className="h-auto w-full flex-col items-start gap-1 whitespace-normal py-2" onClick={()=>{apply(e.filter);setModal(null)}}><span className="text-xs text-muted-foreground">{e.label}</span><code className="font-mono text-xs text-primary">{e.filter}</code></Button>)}</div></>}
      {modal==='stream'&&<><DialogTitle>Follow {stream?.kind.toUpperCase()} stream</DialogTitle><DialogDescription>{stream?`${stream.client} ↔ ${stream.server} · stream ${stream.index} · ${stream.packetCount} packets`:'Select a TCP or UDP packet first.'}</DialogDescription>{stream&&<><div className="max-h-96 overflow-auto border bg-muted/30 p-3">{stream.segments.length?stream.segments.map((s,i)=><pre key={i} className={`mb-2 whitespace-pre-wrap break-all font-mono text-xs ${s.fromClient?'text-primary':'text-stream-server'}`}>{new TextDecoder().decode(s.bytes)}</pre>):<p className="text-sm text-muted-foreground">No payload in this stream.</p>}</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>download(new Uint8Array(stream.segments.flatMap(s=>Array.from(s.bytes))),`stream-${stream.index}.bin`)}><ArrowDownToLine/>Save payload</Button><Button onClick={()=>{apply(`${stream.kind}.stream == ${stream.index}`);setModal(null)}}>Filter on this stream</Button></div></>}</>}
      {modal==='expert'&&<><DialogTitle>Expert information</DialogTitle><DialogDescription>Automatic checks of the whole capture, explained simply.</DialogDescription>{findings.length?findings.map(f=><div key={f.id} className="border-b py-3 text-sm"><div className="flex items-center justify-between gap-2"><strong className={f.level==='review'?'text-destructive':''}>{f.level==='review'?'Warning':'Note'}: {f.title}</strong><Button size="sm" variant="outline" onClick={()=>{apply('');setModal(null);go(f.packetNos[0])}}>Go to #{f.packetNos[0]} ({f.packetNos.length})</Button></div><p className="mt-1 text-muted-foreground">{f.explanation}</p><p className="mt-1">{f.next}</p></div>):<p className="text-sm text-muted-foreground">Nothing unusual found.</p>}</>}
      {modal==='summary'&&<><DialogTitle>Capture file properties</DialogTitle><DialogDescription>{filename||'No file'}</DialogDescription><dl className="grid grid-cols-2 gap-2 text-sm">{[['Packets (displayed)',stats.packets.toLocaleString()],['Packets (total)',packets.length.toLocaleString()],['Data',formatBytes(stats.bytes)],['Duration',`${stats.duration.toFixed(3)} s`],['Average packets/s',stats.avgPps.toFixed(1)],['Average packet size',`${stats.avgSize.toFixed(0)} bytes`],['First packet',packets[0]?new Date(packets[0].ts*1000).toLocaleString():'—'],['Last packet',packets.at(-1)?new Date(packets.at(-1)!.ts*1000).toLocaleString():'—'],['Marked',String(marked.size)],['Display filter',applied||'none']].map(([k,v])=><div key={k} className="border-b py-1"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>)}</dl></>}
      {modal==='hierarchy'&&<><DialogTitle>Protocol hierarchy</DialogTitle><DialogDescription>Displayed packets by protocol.</DialogDescription><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th>Protocol</th><th>Packets</th><th>%</th><th>Bytes</th></tr></thead><tbody>{stats.protocols.map(p=><tr key={p.name} className="border-b"><td className="py-1"><button type="button" className="text-primary hover:underline" onClick={()=>{apply(p.proto==='other'?'':p.proto);setModal(null)}}>{p.name}</button></td><td>{p.packets}</td><td>{(p.packets/Math.max(1,stats.packets)*100).toFixed(1)}</td><td>{formatBytes(p.bytes)}</td></tr>)}</tbody></table></>}
      {(modal==='conversations'||modal==='endpoints')&&<><DialogTitle>{modal==='conversations'?'Conversations':'Endpoints'}</DialogTitle><DialogDescription>Click an address to filter on it.</DialogDescription><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground">{(modal==='conversations'?['Address A','Address B','Packets','Bytes','A → B','B → A']:['Address','Packets','Bytes','Sent','Received']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{modal==='conversations'?stats.conversations.map(c=><tr key={c.a+c.b} className="border-b font-mono text-xs"><td className="py-1"><button type="button" className="text-primary hover:underline" onClick={()=>{apply(`ip.addr == ${c.a} and ip.addr == ${c.b}`);setModal(null)}}>{c.a}</button></td><td>{c.b}</td><td>{c.packets}</td><td>{formatBytes(c.bytes)}</td><td>{formatBytes(c.aToB)}</td><td>{formatBytes(c.bToA)}</td></tr>):stats.endpoints.map(e=><tr key={e.addr} className="border-b font-mono text-xs"><td className="py-1"><button type="button" className="text-primary hover:underline" onClick={()=>{apply(`ip.addr == ${e.addr}`);setModal(null)}}>{e.addr}</button></td><td>{e.packets}</td><td>{formatBytes(e.bytes)}</td><td>{formatBytes(e.tx)}</td><td>{formatBytes(e.rx)}</td></tr>)}</tbody></table></>}
      {modal==='io'&&<><DialogTitle>I/O graph</DialogTitle><DialogDescription>Packets per {stats.ioStep} s interval (displayed packets).</DialogDescription><div className="io-chart">{stats.io.map((b,i)=><div key={i} title={`${b.t}s: ${b.packets} packets`} className="io-bar" style={{height:`${Math.max(1,b.packets/Math.max(1,...stats.io.map(x=>x.packets))*100)}%`}}/>)}</div></>}
      {modal==='goto'&&<><DialogTitle>Go to packet</DialogTitle><DialogDescription>Enter a packet number.</DialogDescription><form className="flex gap-2" onSubmit={e=>{e.preventDefault();const n=num(gotoNo);if(filtered.some(p=>p.no===n)){go(n);setModal(null)}else setNotice(`Packet ${gotoNo} is not displayed.`)}}><input autoFocus aria-label="Packet number" inputMode="numeric" value={gotoNo} onChange={e=>setGotoNo(e.target.value.replace(/\D/g,''))} className="flex-1 rounded border bg-background px-3 py-2 font-mono outline-none"/><Button type="submit">Go</Button></form></>}
      {modal==='theme'&&<><DialogTitle>Color theme</DialogTitle><DialogDescription>Saved on this computer.</DialogDescription><ThemeGrid theme={theme} className="grid-cols-3" onSelect={id=>selectTheme(id)}/></>}
      {modal==='help'&&<><DialogTitle>Local AI help</DialogTitle><DialogDescription>Optional, runs only on this computer.</DialogDescription><PktivoLocalHelp/></>}
      {modal==='about'&&<><DialogTitle>About Pktivo</DialogTitle><DialogDescription>Independent packet analyzer — not a Wireshark distribution.</DialogDescription><div className="space-y-3 text-sm"><PktivoUpdateStatus/><p className="text-muted-foreground">Captures stay on this computer. Live capture uses dumpcap or tcpdump with your capture permissions. Pktivo is pronounced “packet-ee-vo”.</p></div></>}
    </DialogContent></Dialog>
  </div>;
}

function Welcome({interfaces,chosen,setChosen,diag,capFilter,setCapFilter,onStart,onOptions,onOpen,onSetup,onSample,desktop,busy}:{interfaces:CaptureInterface[];chosen:string[];setChosen:(v:string[])=>void;diag:CaptureDiagnosis|null;capFilter:string;setCapFilter:(v:string)=>void;onStart:()=>void;onOptions:()=>void;onOpen:()=>void;onSetup:()=>void;onSample:()=>void;desktop:boolean;busy:boolean}){
  return <div className="ws-welcome"><h1 className="text-xl font-semibold">Welcome to Pktivo</h1>
    <section><h2 className="ws-wh">Open</h2><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={onOpen}><FolderOpen/>Open a capture file…</Button><Button variant="ghost" size="sm" onClick={onSample}><FlaskConical/>Load sample capture</Button></div>{busy&&<p className="mt-2 text-muted-foreground">Reading capture…</p>}</section>
    <section><h2 className="ws-wh">Capture</h2>
      {!desktop?<p className="text-muted-foreground">Live capture is only available in the desktop app.</p>:!diag?<p className="text-muted-foreground">Looking for capture tools…</p>:!diag.ok?<div className="rounded border border-destructive/40 p-3"><p>{diag.message}</p><Button className="mt-2" size="sm" onClick={onSetup}><Wrench/>Set up capturing</Button></div>:<>
      <div className="mb-2 flex items-center gap-2"><span className="text-muted-foreground">…using this filter:</span><input aria-label="Capture filter" value={capFilter} onChange={e=>setCapFilter(e.target.value)} placeholder="Enter a capture filter …" className="min-w-0 flex-1 rounded border bg-background px-2 py-1 font-mono outline-none"/></div>
      <div className="rounded border">{interfaces.map(i=><button type="button" key={i.name} onClick={()=>setChosen([i.name])} onDoubleClick={()=>{setChosen([i.name]);setTimeout(onStart,0)}} className={`flex w-full items-center gap-3 border-b px-3 py-1.5 text-left last:border-0 hover:bg-muted ${chosen.includes(i.name)?'bg-accent':''}`}><Radio className="size-3.5 text-primary"/><span className="font-mono">{i.name}</span><span className="truncate text-muted-foreground">{i.description!==i.name?i.description:''}</span></button>)}</div>
      <div className="mt-2 flex gap-2"><Button size="sm" disabled={!chosen.length} onClick={onStart}><Play/>Start capturing</Button><Button size="sm" variant="outline" onClick={onOptions}><Settings2/>More options…</Button></div><p className="mt-1 text-xs text-muted-foreground">Tip: double-click an interface to start right away.</p></>}
    </section></div>;
}
