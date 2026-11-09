export interface CaptureInterface { name: string; description: string }
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
  start(name: string): Promise<void>;
  stop(): Promise<void>;
  onData(cb: (bytes: number[]) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onStopped(cb: () => void): () => void;
}
declare global { interface Window { netlens?: DesktopBridge } }