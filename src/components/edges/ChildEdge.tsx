import { BaseEdge, EdgeProps } from '@xyflow/react';

export default function ChildEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
}: EdgeProps) {
    // 2/3 지점에서 꺾이도록 center Y 계산
    // sourceY (위) ~ targetY (아래) 사이의 거리를 계산

    // 만약 getSmoothStepPath가 centerY를 지원하지 않거나 의도대로 동작하지 않으면 직접 path를 그려야 함.
    // React Flow 12+ 에서는 pathOptions에 centerY가 있을 수 있음.
    // 하지만 확실하지 않으므로 직접 path를 계산하는 로직을 fallback으로 고려할 수 있음.
    // 여기서는 일단 직접 path string을 구성하는 것이 가장 확실함.

    // 직접 Path 계산 (SmoothStep 흉내)
    // M sx sy L sx splitY Q sx splitY, ... (radius logic needed)
    // 간단하게 radius 없이 테스트하거나, radius 구현.

    // Radius 구현이 복잡하므로 일단 getSmoothStepPath의 centerY 활용 시도해보고, 
    // Typescript 에러가 나거나 동작 안하면 수동 구현으로 변경.
    // @xyflow/react의 getSmoothStepPath 시그니처 확인이 어려우므로
    // 안전하게 커스텀 패스 로직을 작성합니다.

    const radius = 5;
    const splitY = sourceY + Math.abs(targetY - sourceY) * 0.67; // 약 2/3 지점

    // Custom Path Logic with Radius
    let path = '';

    // 1. Start
    path += `M ${sourceX} ${sourceY}`;

    // 2. Vertical down to splitY
    // We need to stop before splitY by radius if we are going to turn
    // If sourceX == targetX, straight line
    if (Math.abs(sourceX - targetX) < 1) {
        path += ` L ${targetX} ${targetY}`;
    } else {
        // Source Vertical Segment
        const turn1Y = splitY - radius;
        path += ` L ${sourceX} ${turn1Y}`;

        // Turn 1
        // Determine direction
        const isRight = targetX > sourceX;
        path += ` Q ${sourceX} ${splitY} ${sourceX + (isRight ? radius : -radius)} ${splitY}`;

        // Horizontal Segment
        const turn2X = targetX + (isRight ? -radius : radius);
        path += ` L ${turn2X} ${splitY}`;

        // Turn 2
        path += ` Q ${targetX} ${splitY} ${targetX} ${splitY + radius}`;

        // Target Vertical Segment
        path += ` L ${targetX} ${targetY}`;
    }

    return (
        <BaseEdge path={path} markerEnd={markerEnd} style={style} />
    );
}
