import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {buildCaptureArgs,validateOptions,setupPlan}=require('../../electron/capture.cjs');
const allowed=[{name:'eth0'},{name:'wlan0'}];
const dumpcap={dumpcap:true},tcpdump={dumpcap:false};
const base={interfaces:['eth0'],filter:'',stop:{},ring:{enabled:false}};
describe('capture options',()=>{
  it('records several interfaces with a capture filter and packet limit',()=>{
    const o=validateOptions({...base,interfaces:['eth0','wlan0'],filter:'tcp port 443',stop:{packets:500}},allowed,dumpcap);
    expect(buildCaptureArgs(dumpcap,o,null)).toEqual(['-i','eth0','-i','wlan0','-f','tcp port 443','-c','500','-q','-w','-']);
  });
  it('writes a ring buffer of 10 files of 100 MB to the main-chosen file',()=>{
    const o=validateOptions({...base,stop:{seconds:60},ring:{enabled:true,megabytes:100,files:10}},allowed,dumpcap);
    expect(buildCaptureArgs(dumpcap,o,'/tmp/x.pcapng')).toEqual(['-i','eth0','-a','duration:60','-b','filesize:100000','-b','files:10','-q','-w','/tmp/x.pcapng']);
  });
  it('rejects unknown interfaces and unsafe filters',()=>{
    expect(()=>validateOptions({...base,interfaces:['evil']},allowed,dumpcap)).toThrow();
    expect(()=>validateOptions({...base,filter:'-w /etc/passwd'},allowed,dumpcap)).toThrow();
    expect(()=>validateOptions({...base,filter:'port 80; rm -rf'},allowed,dumpcap)).toThrow();
  });
  it('requires dumpcap for multiple interfaces and ring buffers',()=>{
    expect(()=>validateOptions({...base,interfaces:['eth0','wlan0']},allowed,tcpdump)).toThrow();
    expect(()=>validateOptions({...base,ring:{enabled:true,megabytes:10}},allowed,tcpdump)).toThrow();
  });
  it('passes the tcpdump filter as trailing arguments',()=>{
    const o=validateOptions({...base,filter:'udp port 53',stop:{packets:5}},allowed,tcpdump);
    expect(buildCaptureArgs(tcpdump,o,null)).toEqual(['-i','eth0','-U','-n','-s','0','-c','5','-w','-','udp','port','53']);
  });
  it('uses fixed setup recipes per Linux family',()=>{
    expect(setupPlan('linux','debian').script).toContain('wireshark-common');
    expect(setupPlan('linux','arch').script).toContain('wireshark-cli');
    expect(setupPlan('win32').kind).toBe('download');
  });
});
