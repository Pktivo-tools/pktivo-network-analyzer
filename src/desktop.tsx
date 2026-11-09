import { createRoot } from 'react-dom/client';
import { PktivoWorkspace } from './components/netlens-workspace';
import './styles.css';
const root=document.getElementById('root');
if(root)createRoot(root).render(<PktivoWorkspace/>);
