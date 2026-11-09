import { createRoot } from 'react-dom/client';
import { DesktopWorkspace } from './components/desktop-workspace';
import './styles.css';
const root=document.getElementById('root');
if(root)createRoot(root).render(<DesktopWorkspace/>);
