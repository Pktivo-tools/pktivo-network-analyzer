export interface CaptureInterface { name: string; description: string }
export interface CaptureOptions { interfaces: string[]; filter: string; stop: {packets:number;seconds:number;megabytes:number}; ring: {enabled:boolean;megabytes:number;seconds:number;files:number} }
export interface CaptureDiagnosis { ok:boolean; step:'tool'|'permission'|'ready'; message:string; tool:string|null; interfaces:CaptureInterface[]; fix:{kind:'pkexec'|'manual'|'download';label:string;commands:string[];after:string;url:string|null;canRun:boolean} }
export interface UpdateStatus { state: 'unconfigured'|'idle'|'paused'|'checking'|'current'|'downloading'|'ready'|'error'; version:string; message:string; nextVersion?:string; percent?:number }
export interface DesktopBridge {
  updateStatus(): Promise<UpdateStatus>;
  checkUpdates(): Promise<UpdateStatus>;
  installUpdate(): Promise<void>;
  onUpdateStatus(cb: (status: UpdateStatus)=>void):()=>void;
  assistantEnable(enabled: boolean): Promise<boolean>;
  assistantModels(): Promise<string[]>;
  assistantAsk(model: string, question: string): Promise<string>;
  interfaces(): Promise<CaptureInterface[]>;
  start(options: string|CaptureOptions): Promise<{toFiles:boolean;folder:string|null}|void>;
  captureTool(): Promise<{dumpcap:boolean;version:string}|null>;
  chooseFolder(): Promise<string|null>;
  diagnose(): Promise<CaptureDiagnosis>;
  runSetup(): Promise<{started:boolean;message:string}>;
  stop(): Promise<void>;
  onData(cb: (bytes: number[]) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onStopped(cb: () => void): () => void;
}
declare global { interface Window { netlens?: DesktopBridge } }