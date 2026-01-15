import { useEffect } from 'react';
import LeftPanel from './components/LeftPanel';
import GenogramDiagram from './components/GenogramDiagram';
import { ReactFlowProvider } from '@xyflow/react';
import { useGenogramStore } from './store/useGenogramStore';
import './App.css';

function App() {
    const undo = useGenogramStore((state) => state.undo);
    const redo = useGenogramStore((state) => state.redo);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return (
        <div className="container">
            <ReactFlowProvider>
                <LeftPanel />
                <GenogramDiagram />
            </ReactFlowProvider>
        </div>
    );
}

export default App;
