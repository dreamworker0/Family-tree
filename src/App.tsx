import LeftPanel from './components/LeftPanel';
import GenogramDiagram from './components/GenogramDiagram';
import { ReactFlowProvider } from '@xyflow/react';
import './App.css';

function App() {
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
