import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    ConnectionMode,
    Node,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGenogramStore } from '../store/useGenogramStore';
import { calculateGenogramLayout } from '../utils/genogramLayout';
import type { GenogramData } from '../types/types';
import MaleNode from './nodes/MaleNode';
import FemaleNode from './nodes/FemaleNode';
import MarriageEdge from './edges/MarriageEdge';
import ChildEdge from './edges/ChildEdge';
import Legend from './Legend';
import './GenogramDiagram.css';
import CustomMiniMap from './CustomMiniMap';
import MarriageNode from './nodes/MarriageNode';
import NodeContextMenu from './NodeContextMenu';
import PaneContextMenu from './PaneContextMenu';

// 커스텀 노드 타입 등록
const nodeTypes = {
    male: MaleNode,
    female: FemaleNode,
    marriageNode: MarriageNode,
};

// 커스텀 엣지 타입 등록
const edgeTypes = {
    marriage: MarriageEdge,
    divorced: MarriageEdge,
    child: ChildEdge, // 등록
};

export default function GenogramDiagram() {
    const familyData = useGenogramStore((state) => state.familyData);
    const selectedPersonKeys = useGenogramStore((state) => state.selectedPersonKeys);
    // Layout centering uses the last selected key (Unused but kept if needed for future centering logic, or commented out)
    // const primarySelectedKey = selectedPersonKeys.length > 0 ? selectedPersonKeys[selectedPersonKeys.length - 1] : null;

    const selectPerson = useGenogramStore((state) => state.selectPerson);
    const toggleSelectPerson = useGenogramStore((state) => state.toggleSelectPerson);
    const reset = useGenogramStore((state) => state.reset);
    const importData = useGenogramStore((state) => state.importData);
    const exportData = useGenogramStore((state) => state.exportData);
    const updatePerson = useGenogramStore((state) => state.updatePerson);
    const clearAllPositions = useGenogramStore((state) => state.clearAllPositions);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, getViewport } = useReactFlow();

    // 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState<{ id: string; top: number; left: number } | null>(null);
    const [paneContextMenu, setPaneContextMenu] = useState<{ x: number; y: number; top: number; left: number } | null>(null);

    // 레이아웃 계산
    const layout = useMemo(() => {
        return calculateGenogramLayout(familyData);
    }, [familyData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

    // familyData 변경 시 노드/엣지 업데이트 (레이아웃 재계산)
    // 기존 노드의 position은 유지하면서 새 노드만 layout 위치 사용
    // 단, MarriageNode는 항상 layout 계산된 위치 사용 (부모 위치에 따라 동적으로 변해야 함)
    useEffect(() => {
        const updatedNodes = layout.nodes.map((layoutNode) => {
            // MarriageNode는 항상 layout 계산된 위치 사용
            if (layoutNode.type === 'marriageNode') {
                return layoutNode;
            }

            // familyData에서 해당 person의 position 확인
            const person = familyData.find((p) => String(p.key) === layoutNode.id);

            // 1. person.position이 있으면 무조건 그것 사용 (드래그/수동 배치)
            // 2. person.position이 없고(null), store 상 초기화된 상태라면 layoutNode.position 사용

            let finalPosition = layoutNode.position;
            if (person?.position) {
                finalPosition = person.position;
            }

            return {
                ...layoutNode,
                position: finalPosition,
                selected: selectedPersonKeys.includes(parseInt(layoutNode.id)),
            };
        });

        setNodes(updatedNodes);
        setEdges(layout.edges);
    }, [layout, familyData, setNodes, setEdges, selectedPersonKeys]);

    // 선택 상태만 변경될 때는 별도 처리 불필요 (위 useEffect에서 처리)

    // 노드 클릭 핸들러
    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: { id: string }) => {
            const key = parseInt(node.id);
            if (event.shiftKey) {
                toggleSelectPerson(key);
            } else {
                selectPerson(key);
            }
            setContextMenu(null); // 메뉴 닫기
        },
        [selectPerson, toggleSelectPerson]
    );

    // 노드 우클릭 핸들러 (컨텍스트 메뉴)
    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            // MarriageNode 등은 제외
            if (node.type === 'marriageNode') return;

            event.preventDefault();
            setContextMenu({
                id: node.id,
                top: event.clientY,
                left: event.clientX + 20, // Offset to the right to avoid covering the node
            });
        },
        []
    );

    // 빈 공간 클릭 시 선택 해제 및 메뉴 닫기
    const onPaneClick = useCallback(() => {
        selectPerson(null);
        setContextMenu(null);
        setPaneContextMenu(null);
    }, [selectPerson]);

    // 빈 공간 우클릭 핸들러
    const onPaneContextMenu = useCallback(
        (event: MouseEvent | React.MouseEvent) => {
            event.preventDefault();
            setContextMenu(null);

            // 화면 좌표를 React Flow 월드 좌표로 변환
            const flowPos = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            setPaneContextMenu({
                x: flowPos.x,
                y: flowPos.y,
                top: event.clientY,
                left: event.clientX,
            });
        },
        [screenToFlowPosition]
    );

    // 노드 드래그 종료 핸들러
    const onNodeDragStop = useCallback(
        (_: React.MouseEvent, node: Node) => {
            if (node.type === 'marriageNode') return;
            const key = parseInt(node.id);
            updatePerson(key, { position: node.position });
        },
        [updatePerson]
    );

    // 이미지 저장
    const handleExportImage = useCallback(() => {
        if (diagramRef.current === null) {
            return;
        }

        // React Flow 뷰포트 요소 선택 (전체 다이어그램 캡처)
        toPng(diagramRef.current, {
            cacheBust: true,
            backgroundColor: '#f0f4f8',
            filter: (node) => {
                // 미니맵과 컨트롤 제외
                const classList = node.classList;
                if (!classList) return true;
                if (classList.contains('react-flow__minimap') || classList.contains('react-flow__controls')) {
                    return false;
                }
                return true;
            }
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `가계도_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('이미지 저장 실패:', err);
                alert('이미지 저장 중 오류가 발생했습니다.');
            });
    }, [diagramRef]);

    // 레이아웃 재정렬
    const handleRelayout = useCallback(() => {
        clearAllPositions();
        // familyData가 변경되면서 useEffect가 자동 실행되어 layout이 갱신되므로 
        // 여기서 직접 setNodes를 호출할 필요는 없지만, 즉각적인 반응을 위해 유지할 수 있음.
    }, [clearAllPositions]);

    // 프로젝트 저장
    const handleExportProject = useCallback(() => {
        if (familyData.length === 0) {
            alert('저장할 가계도 데이터가 없습니다.');
            return;
        }
        const data = exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `가계도_프로젝트_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [familyData, exportData]);

    // 불러오기
    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string) as GenogramData;
                if (data.familyData) {
                    importData(data);
                }
            } catch {
                alert('파일을 읽는 중 오류가 발생했습니다.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }, [importData]);

    // 초기화
    const handleReset = useCallback(() => {
        if (confirm('모든 가계도 데이터를 초기화하시겠습니까?')) {
            reset();
        }
    }, [reset]);

    return (
        <div className="right-panel">
            <div className="diagram-header">
                <div className="diagram-title">📊 가계도</div>
                <div className="diagram-actions">
                    <button className="btn btn-secondary" onClick={handleRelayout}>
                        📐 정렬
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportImage}>
                        💾 저장
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportProject}>
                        📄 프로젝트 저장
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        📂 불러오기
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                    </label>
                    <button className="btn btn-danger" onClick={handleReset}>
                        🔄 초기화
                    </button>
                </div>
            </div>

            <div className="diagram-container" ref={diagramRef}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={onPaneClick}
                    onPaneContextMenu={onPaneContextMenu}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                >
                    <Background color="#ddd" gap={20} />
                    <Controls />
                    <CustomMiniMap />
                </ReactFlow>
            </div>

            {contextMenu && (
                <NodeContextMenu
                    id={contextMenu.id}
                    top={contextMenu.top}
                    left={contextMenu.left}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {paneContextMenu && (
                <PaneContextMenu
                    top={paneContextMenu.top}
                    left={paneContextMenu.left}
                    flowX={paneContextMenu.x}
                    flowY={paneContextMenu.y}
                    onClose={() => setPaneContextMenu(null)}
                    onPersonAdded={(key) => {
                        const { zoom } = getViewport();
                        // 노드 컨테이너 너비(80px) 중앙에 40px 아이콘이 있음.
                        // 아이콘 우측 끝은 60px 지점, 번짐 효과(shadow) 고려 시 약 64px.
                        // 이를 화면 좌표(zoom 반영)로 변환하고 여유 공간 10px 추가.
                        const dynamicLeftOffset = 64 * zoom + 10;

                        setPaneContextMenu(null);
                        // 새로 추가된 노드의 편집 팝업을 바로 띄움
                        setContextMenu({
                            id: String(key),
                            top: paneContextMenu.top,
                            left: paneContextMenu.left + dynamicLeftOffset,
                        });
                        // 선택 상태도 업데이트하여 왼쪽 패널과 동기화
                        selectPerson(key);
                    }}
                />
            )}

            <Legend />
        </div>
    );
}
