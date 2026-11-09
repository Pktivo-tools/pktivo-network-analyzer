import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {captureArgs}=require('../../electron/capture.cjs');
describe('Native capture process arguments',()=>{
 it('streams dumpcap output from only the selected interface',()=>{expect(captureArgs({dumpcap:true},'eth0')).toEqual(['-i','eth0','-q','-w','-'])});
 it('streams tcpdump with complete frames and immediate output',()=>{expect(captureArgs({dumpcap:false},'en0')).toEqual(['-i','en0','-U','-n','-s','0','-w','-'])});
});
