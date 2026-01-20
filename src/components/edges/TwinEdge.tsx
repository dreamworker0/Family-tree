import { memo } from 'react';
import { EdgeProps, useNodes, Node } from '@xyflow/react';

interface TwinEdgeDataProps {
    twinIds: string[];       // 쌍둥이 자녀들의 ID 배열
    isIdentical?: boolean;   // 일란성 쌍둥이 여부
}

function TwinEdge({
    id,
    sourceX,
    sourceY,
    data,
}: EdgeProps) {
    const nodes = useNodes();

    const edgeData = data as TwinEdgeDataProps | undefined;
    const twinIds = edgeData?.twinIds || [];
    const isIdentical = edgeData?.isIdentical || false;

    // 쌍둥이 노드들의 위치 가져오기
    const twinNodes = twinIds
        .map((twinId: string) => nodes.find((n: Node) => n.id === twinId))
        .filter((n): n is Node => n !== undefined);

    if (twinNodes.length === 0) {
        return null;
    }

    // 각 쌍둥이 노드의 상단 중앙 좌표 계산 (NODE_WIDTH = 80)
    const twinPositions = twinNodes.map((node: Node) => ({
        x: (node.position?.x || 0) + 40,  // 노드 중앙
        y: node.position?.y || 0           // 노드 상단
    }));

    // 허브 위치: sourceX (부모 중앙), hubY는 부모와 쌍둥이 사이 53% 지점
    const hubX = sourceX;
    const hubY = sourceY + (twinPositions[0].y - sourceY) * 0.53;

    // SVG 경로 생성
    let pathD = '';

    // 1. 부모(source)에서 허브까지 수직선
    pathD += `M ${sourceX} ${sourceY} L ${hubX} ${hubY} `;

    // 2. 허브에서 각 쌍둥이까지 직선 (V자 형태)
    twinPositions.forEach((pos: { x: number; y: number }) => {
        pathD += `M ${hubX} ${hubY} L ${pos.x} ${pos.y} `;
    });

    // 일란성 쌍둥이: V자 분기선의 중간 지점을 가로선으로 연결하는 로직 제거 (노드 간 직접 연결로 변경됨)
    const identicalBarPath = '';


    return (
        <g className="react-flow__edge">
            {/* 메인 연결선 (부모 → 허브 → 쌍둥이들) */}
            <path
                id={id}
                className="react-flow__edge-path"
                d={pathD}
                style={{
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'none'
                }}
            />
            {/* 일란성 쌍둥이 바 - V자 분기선 중간을 가로로 연결 */}
            {isIdentical && identicalBarPath && (
                <path
                    className="react-flow__edge-path identical-bar"
                    d={identicalBarPath}
                    style={{
                        stroke: 'black',
                        strokeWidth: 2,
                        fill: 'none'
                    }}
                />
            )}
        </g>
    );
}

export default memo(TwinEdge);
