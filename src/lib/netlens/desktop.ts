export interface CaptureInterface { name: string; description: string }
export interface DesktopBridge {
  interfaces(): Promise<CaptureInterface[]>;
  start(name: string): Promise<void>;
  stop(): Promise<void>;
  onData(cb: (bytes: number[]) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onStopped(cb: () => void): () => void;
}
declare global { interface Window { netlens?: DesktopBridge } }