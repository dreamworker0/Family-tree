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
                    if (edge.type === 'twin') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const twinIds = (edge.data as any)?.twinIds as string[];
                        if (!twinIds || twinIds.length === 0) return null;

                        const twinNodes = twinIds
                            .map((id) => nodes.find((n) => n.id === id))
                            .filter((n) => n !== undefined);

                        if (twinNodes.length === 0) return null;

                        // 쌍둥이들의 상단 중앙 위치
                        const twinPositions = twinNodes.map((tNode) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const tW = tNode.measured?.width ?? tNode.width ?? iconSize; // any casting if needed
                            const tXOffset = tW > iconSize ? (tW - iconSize) / 2 : 0;
                            const tDrawX = tNode.position.x + tXOffset;
                            // 일반 노드(Icon) 중심 기준 20(절반) + 핸들 위치? 
                            // getHandlePos 로직 재사용: top 핸들이면 (x + 20, y)
                            return getHandlePos(tNode, tDrawX, tNode.position.y, 'top');
                        });

                        // source(부모) 위치: bottom 핸들
                        // sourcePos는 이미 계산됨 (getHandlePos 호출)

                        // Hub 위치: 부모와 첫째 쌍둥이 사이의 53% 지점 (메인 뷰 TwinEdge 로직 참고)
                        const firstChildY = twinPositions[0].y;
                        const hubY = sourcePos.y + (firstChildY - sourcePos.y) * 0.53;
                        const hubX = sourcePos.x;

                        let pathD = `M ${sourcePos.x} ${sourcePos.y} L ${hubX} ${hubY} `;
                        twinPositions.forEach((pos) => {
                            pathD += `M ${hubX} ${hubY} L ${pos.x} ${pos.y} `;
                        });

                        return (
                            <path
                                key={edge.id}
                                d={pathD}
                                stroke="black"
                                strokeWidth={2} // 조금 더 얇게
                                fill="none"
                            />
                        );
                    }

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

                    // 일란성 연결선 등 일반 직선
                    // identical-link 체크
                    const isIdenticalLink = edge.id.startsWith('identical-link');
                    // 색상 결정: 이혼(빨강) > 일란성(검정) > 일반(파랑)
                    const strokeColor = isDivorce ? 'red' : (isIdenticalLink ? 'black' : '#3498db');

                    return (
                        <line
                            key={edge.id}
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke={strokeColor}
                            strokeDasharray={isDivorce ? '4,4' : undefined}
                            strokeWidth={isIdenticalLink ? 2 : 3}
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

                    // 임신 - 삼각형 (성별 색상)
                    if (node.type === 'pregnancy') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const gender = (node.data as any)?.gender;
                        const fill = gender === 'F' ? '#e74c96' : '#3498db';
                        return (
                            <polygon
                                key={node.id}
                                points={`${drawX + 20},${drawY} ${drawX + 40},${drawY + 40} ${drawX},${drawY + 40}`}
                                fill={fill}
                            />
                        );
                    }

                    // 성별 미상 - 물음표 텍스트
                    if (node.type === 'unknown') {
                        return (
                            <text
                                key={node.id}
                                x={drawX + 20}
                                y={drawY + 22}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#333"
                                fontSize="24"
                                fontWeight="bold"
                            >
                                ?
                            </text>
                        );
                    }

                    // 반려동물 - 마름모 (파란색)
                    if (node.type === 'pet') {
                        return (
                            <polygon
                                key={node.id}
                                points={`${drawX + 20},${drawY} ${drawX + 40},${drawY + 20} ${drawX + 20},${drawY + 40} ${drawX},${drawY + 20}`}
                                fill="#3498db"
                            />
                        );
                    }

                    // 여성 - 원 (분홍색)
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

                    // 남성 및 기본 - 사각형 (파란색)
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
