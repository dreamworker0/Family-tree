import {
    BaseEdge,
    getStraightPath,
} from '@xyflow/react';

interface MarriageEdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    data?: {
        edgeType?: 'marriage' | 'divorced';
        hasChildren?: boolean; // 자녀가 있으면 수직선 표시
    };
}

export default function MarriageEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
}: MarriageEdgeProps) {
    const edgeType = data?.edgeType || 'marriage';
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    const strokeStyle = edgeType === 'divorced'
        ? { stroke: 'red', strokeWidth: 2.5, strokeDasharray: '10,4' }
        : { stroke: 'blue', strokeWidth: 2.5 };

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={strokeStyle}
            />
        </>
    );
}
