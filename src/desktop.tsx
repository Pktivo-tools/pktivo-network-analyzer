import { createRoot } from 'react-dom/client';
import { NetpackWorkspace } from './components/netlens-workspace';
import './styles.css';
const root=document.getElementById('root');
if(root)createRoot(root).render(<NetpackWorkspace/>);
