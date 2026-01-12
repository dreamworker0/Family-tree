import { useNodes, useEdges, getNodesBounds, useStore, type ReactFlowState } from '@xyflow/react';
import { useMemo } from 'react';

const selector = (s: ReactFlowState) => ({
    width: s.width,
    height: s.height,
    transform: s.transform,
});

export default function CustomMiniMap() {
    // edges from store
    const { width, height, transform } = useStore(selector);
    const nodes = useNodes();
    const edges = useEdges(); // Hook for reactivity
    const [x, y, zoom] = transform;

    // 전체 노드 영역 계산
    const bounds = useMemo(() => {
        if (nodes.length === 0) {
            return { x: 0, y: 0, width: 100, height: 100 };
        }
        const b = getNodesBounds(nodes);
        // 여백 추가
        const padding = 50;
        return {
            x: b.x - padding,
            y: b.y - padding,
            width: b.width + padding * 2,
            height: b.height + padding * 2,
        };
    }, [nodes]);

    // 뷰포트(현재 보이는 영역) 계산
    const viewportRect = useMemo(() => {
        return {
            x: -x / zoom,
            y: -y / zoom,
            width: width / zoom,
            height: height / zoom,
        };
    }, [x, y, zoom, width, height]);

    const iconSize = 40;

    return (
        <div className="react-flow__minimap" style={{ backgroundColor: '#fff', width: 200, height: 150, border: '1px solid #ccc', position: 'absolute', bottom: 12, right: 12, zIndex: 5 }}>
            <svg
                width="100%"
                height="100%"
                viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
                style={{ display: 'block' }}
            >
                {/* 엣지 렌더링 */}
                {edges.map((edge) => {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    const targetNode = nodes.find((n) => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    // 아이콘 위치 계산
                    const sw = sourceNode.measured?.width ?? sourceNode.width ?? iconSize;
                    const tw = targetNode.measured?.width ?? targetNode.width ?? iconSize;

                    // sourceNode X offset
                    const sxOffset = sw > iconSize ? (sw - iconSize) / 2 : 0;
                    const drawSX = sourceNode.position.x + sxOffset;

                    // targetNode X offset
                    const txOffset = tw > iconSize ? (tw - iconSize) / 2 : 0;
                    const drawTX = targetNode.position.x + txOffset;

                    // 핸들 위치 계산
                    const getHandlePos = (node: any, nodeX: number, nodeY: number, handleId?: string | null) => {
                        const isMarriageNode = node.type === 'marriageNode';

                        // MarriageNode는 중앙이 연결점이므로 그대로 사용 (혹은 중앙값)
                        if (isMarriageNode) {
                            return { x: nodeX + 2, y: nodeY + 2 }; // 4x4 크기 중앙
                        }

                        // 일반 노드 (40x40 가정)
                        const cx = nodeX + 20;
                        const cy = nodeY + 20;

                        if (handleId === 'top') return { x: cx, y: nodeY };
                        if (handleId === 'bottom') return { x: cx, y: nodeY + 40 };
                        if (handleId === 'left') return { x: nodeX, y: cy };
                        if (handleId === 'right') return { x: nodeX + 40, y: cy };

                        return { x: cx, y: cy };
                    };

                    const sourcePos = getHandlePos(sourceNode, drawSX, sourceNode.position.y, edge.sourceHandle);
                    const targetPos = getHandlePos(targetNode, drawTX, targetNode.position.y, edge.targetHandle);

                    const isDivorce = edge.data?.edgeType === 'divorced';
                    const isChildEdge = edge.type === 'child' || edge.type === 'smoothstep';

                    if (isChildEdge) {
                        // ChildEdge (step path) calculation
                        // Main diagram uses 2/3 split.
                        const splitY = sourcePos.y + (targetPos.y - sourcePos.y) * 0.67;

                        const pathD = `M ${sourcePos.x} ${sourcePos.y} 
                                     L ${sourcePos.x} ${splitY} 
                                     L ${targetPos.x} ${splitY} 
                                     L ${targetPos.x} ${targetPos.y}`;

                        return (
                            <path
                                key={edge.id}
                                d={pathD}
                                stroke="#999" // Gray color for child links
                                strokeWidth={3}
                                fill="none"
                            />
                        );
                    }

                    return (
                        <line
                            key={edge.id}
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke={isDivorce ? 'red' : '#3498db'}
                            strokeDasharray={isDivorce ? '4,4' : undefined}
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* 노드 렌더링 */}
                {nodes.map((node) => {
                    const w = node.measured?.width ?? node.width ?? iconSize;
                    const xOffset = w > iconSize ? (w - iconSize) / 2 : 0;
                    const drawX = node.position.x + xOffset;
                    const drawY = node.position.y;

                    if (node.type === 'marriageNode') return null;

                    if (node.type === 'female') {
                        return (
                            <circle
                                key={node.id}
                                cx={drawX + 20}
                                cy={drawY + 20}
                                r={20}
                                fill="#e74c96"
                            />
                        );
                    }
                    return (
                        <rect
                            key={node.id}
                            x={drawX}
                            y={drawY}
                            width={iconSize}
                            height={iconSize}
                            fill="#3498db"
                        />
                    );
                })}

                {/* 뷰포트 인디케이터 */}
                <rect
                    x={viewportRect.x}
                    y={viewportRect.y}
                    width={viewportRect.width}
                    height={viewportRect.height}
                    fill="rgba(0, 0, 0, 0.1)"
                    stroke="rgba(200, 0, 0, 0.5)"
                    strokeWidth={2}
                />
            </svg>
        </div>
    );
}
