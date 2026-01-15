import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
    ReactFlow,
    Background,
    Controls,
    ControlButton,
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
    const undo = useGenogramStore((state) => state.undo);
    const redo = useGenogramStore((state) => state.redo);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, getViewport, zoomIn, zoomOut, fitView, getNodesBounds } = useReactFlow();

    // 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState<{ id: string; top: number; left: number } | null>(null);
    const [paneContextMenu, setPaneContextMenu] = useState<{ x: number; y: number; top: number; left: number } | null>(null);
    const [isInteractive, setIsInteractive] = useState(true);

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

    // 이미지 저장 (수정: 뷰포트 직접 캡처 및 좌표 보정)
    const handleExportImage = useCallback(() => {
        if (diagramRef.current === null) {
            return;
        }

        // React Flow 뷰포트 요소 찾기 (노드와 엣지가 들어있는 레이어)
        const viewportElem = diagramRef.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportElem) {
            console.error('뷰포트를 찾을 수 없습니다.');
            return;
        }

        // 전체 노드의 경계 계산 (여백 포함)
        const nodesBounds = getNodesBounds(nodes);

        // 노드가 하나도 없는 경우 처리
        if (nodesBounds.width === 0 || nodesBounds.height === 0) {
            alert('저장할 인물이 없습니다.');
            return;
        }

        const padding = 50; // 여백
        const width = nodesBounds.width + padding * 2;
        const height = nodesBounds.height + padding * 2;

        // 뷰포트 요소를 직접 캡처
        // transform을 강제로 설정하여 현재 줌/팬 상태와 무관하게 모든 노드가 (padding, padding) 위치에서 시작하도록 함
        toPng(viewportElem, {
            cacheBust: true,
            backgroundColor: '#ffffff', // 배경 완전 흰색
            width: width,
            height: height,
            pixelRatio: 3, // 인쇄용 고해상도 (기본 해상도의 3배)
            style: {
                width: `${width}px`,
                height: `${height}px`,
                // 1. 스케일을 1로 고정 (확대/축소 무시)
                // 2. 가장 왼쪽/위쪽 노드가 (padding, padding)에 오도록 이동
                transform: `translate(${-(nodesBounds.x - padding)}px, ${-(nodesBounds.y - padding)}px) scale(1)`,
            },
            // viewport만 찍으므로 그리드(background)나 컨트롤은 이미 제외됨. 별도 필터 불필요.
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
    }, [diagramRef, nodes, getNodesBounds]);

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

    // 키보드 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 입력 폼 내에서는 단축키 동작 안 함 (Ctrl+S, Ctrl+O 등 브라우저 기본 동작 방지 필요한 경우 제외...하지만 보통은 막는게 좋음)
            // 하지만 Ctrl+S, Ctrl+O는 전역으로 동작시키는게 좋음. 
            // 단, input/textarea focus일 때는 글자 입력에 방해되지 않는 선에서.
            // 여기서는 Ctrl 조합키는 허용.

            // 정렬: Alt + L
            if (e.altKey && (e.key === 'l' || e.key === 'L')) {
                e.preventDefault();
                handleRelayout();
            }
            // 이미지 저장: Ctrl + E
            if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                handleExportImage();
            }
            // 프로젝트 저장: Ctrl + S
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                handleExportProject();
            }
            // 불러오기: Ctrl + O
            if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
                e.preventDefault();
                fileInputRef.current?.click();
            }
            // 초기화: Ctrl + Alt + R
            if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                handleReset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRelayout, handleExportImage, handleExportProject, handleReset]);

    return (
        <div className="right-panel">
            <div className="diagram-header">
                <div className="diagram-title">📊 가계도</div>
                <div className="diagram-actions">
                    <button className="btn btn-secondary" onClick={undo} title="실행 취소 (Ctrl+Z)">
                        ↩️ 실행 취소
                    </button>
                    <button className="btn btn-secondary" onClick={redo} title="다시 실행 (Ctrl+Shift+Z / Ctrl+Y)">
                        ↪️ 다시 실행
                    </button>
                    <button className="btn btn-secondary" onClick={handleRelayout} title="자동 정렬 (Alt+L)">
                        📐 정렬
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportImage} title="이미지로 저장 (Ctrl+E)">
                        💾 저장
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportProject} title="프로젝트 파일 저장 (Ctrl+S)">
                        📄 프로젝트 저장
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }} title="프로젝트 불러오기 (Ctrl+O)">
                        📂 불러오기
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                    </label>
                    <button className="btn btn-danger" onClick={handleReset} title="전체 초기화 (Ctrl+Alt+R)">
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
                    nodesDraggable={isInteractive}
                    nodesConnectable={isInteractive}
                    elementsSelectable={isInteractive}
                    panOnDrag={isInteractive ? true : [1, 2]} // 락 상태에서도 마우스 휠이나 버튼으로 이동은 가능하게 할 수도 있지만, panOnDrag false면 아예 드래그 안됨. [1,2]는 우클릭/휠클릭 드래그 허용 의미.
                >
                    <Background color="#ddd" gap={20} />
                    <Controls
                        showZoom={false}
                        showFitView={false}
                        showInteractive={false}
                    >
                        <ControlButton
                            onClick={() => zoomIn()}
                            title="확대"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </ControlButton>
                        <ControlButton
                            onClick={() => zoomOut()}
                            title="축소"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </ControlButton>
                        <ControlButton
                            onClick={() => fitView({ padding: 0.2 })}
                            title="전체 보기"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6"></path></svg>
                        </ControlButton>
                        <ControlButton
                            onClick={() => setIsInteractive(!isInteractive)}
                            title={isInteractive ? "이동/편집 잠금" : "이동/편집 허용"}
                        >
                            {isInteractive ? (
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            )}
                        </ControlButton>
                    </Controls>
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
