import { BaseEdge, EdgeProps } from '@xyflow/react';

export default function ChildEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    // data prop에서 속성 추출
    const isAdopted = data?.isAdopted;
    const isFoster = data?.isFoster;
    const isTwin = data?.isTwin;
    const isStem = data?.isStem; // stem 연결선 (부모 -> TwinHub)

    let path = '';

    // 쌍둥이 연결선 또는 stem 연결선은 직선
    if (isTwin || isStem) {
        path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
        // 기존 ChildEdge 곡선 로직
        const radius = 5;
        const splitY = sourceY + Math.abs(targetY - sourceY) * 0.67;

        path += `M ${sourceX} ${sourceY}`;

        if (Math.abs(sourceX - targetX) < 1) {
            path += ` L ${targetX} ${targetY}`;
        } else {
            const turn1Y = splitY - radius;
            path += ` L ${sourceX} ${turn1Y}`;

            const isRight = targetX > sourceX;
            path += ` Q ${sourceX} ${splitY} ${sourceX + (isRight ? radius : -radius)} ${splitY}`;

            const turn2X = targetX + (isRight ? -radius : radius);
            path += ` L ${turn2X} ${splitY}`;

            path += ` Q ${targetX} ${splitY} ${targetX} ${splitY + radius}`;
            path += ` L ${targetX} ${targetY}`;
        }
    }

    let edgeStyle = { ...style };

    // 입양/위탁 스타일 적용
    if (isAdopted) {
        edgeStyle = {
            ...edgeStyle,
            stroke: '#2196F3', // Blue
            strokeDasharray: '5,5',
        };
    } else if (isFoster) {
        edgeStyle = {
            ...edgeStyle,
            stroke: '#4CAF50', // Green
            strokeDasharray: '5,5',
        };
    }

    return (
        <BaseEdge path={path} markerEnd={markerEnd} style={edgeStyle} />
    );
}
