import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UpdateStatus } from '@/lib/netlens/desktop';
export function NetlensUpdateStatus(){
  const [status,setStatus]=useState<UpdateStatus>();const [error,setError]=useState('');
  useEffect(()=>{const bridge=window.netlens;if(!bridge)return;void bridge.updateStatus().then(setStatus).catch(()=>{});return bridge.onUpdateStatus(setStatus)},[]);
  async function action(install=false){const bridge=window.netlens;if(!bridge)return;setError('');try{if(install)await bridge.installUpdate();else setStatus(await bridge.checkUpdates())}catch(e){setError(e instanceof Error?e.message:'Update unavailable.')}}
  if(!status)return null;
  return <div className="space-y-3 border-y py-4 text-sm"><h3 className="font-medium">Software updates · {status.version}</h3><p className="text-muted-foreground">{status.message}{status.percent!==undefined?` ${status.percent}%`:''}</p>{status.state!=='unconfigured'&&<Button variant="outline" disabled={status.state==='checking'||status.state==='downloading'} onClick={()=>void action(status.state==='ready')}><RefreshCw/>{status.state==='ready'?'Restart and install update':'Check for updates'}</Button>}{error&&<p role="alert" className="text-destructive">{error}</p>}</div>;
}