import { Handle, Position } from '@xyflow/react';
import type { AttributeMarker } from '../../types/types';
import { getAttributeColor, getQuadrant } from '../../utils/attributeColors';
import './PersonNode.css';

interface PetNodeProps {
    data: {
        name: string;
        age?: number | null;
        deceased?: boolean;
        attributes?: AttributeMarker[];
    };
    selected?: boolean;
}

export default function PetNode({ data, selected }: PetNodeProps) {
    const { name, age, deceased, attributes = [] } = data;

    // 속성 마커 색상
    const quadrantColors: Record<string, string> = {};
    attributes.forEach((attr) => {
        const quadrant = getQuadrant(attr);
        if (quadrant) {
            quadrantColors[quadrant] = getAttributeColor(attr);
        }
    });

    return (
        <div className={`person-node pet-node ${selected ? 'selected' : ''}`}>
            {/* 노드 본체 (Handle 위치 기준점) */}
            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" className="pet-svg" style={{ overflow: 'visible' }}>
                    {/* 선택 시 파란 테두리 (뒤에 배치) */}
                    {selected && (
                        <polygon
                            points="20,0 40,20 20,40 0,20"
                            fill="none"
                            stroke="rgba(0, 217, 255, 0.5)"
                            strokeWidth="10"
                            strokeLinejoin="miter"
                        />
                    )}

                    {/* 기본 마름모 배경 (흰색) - 테두리 회색으로 변경 */}
                    <polygon
                        points="20,2 38,20 20,38 2,20"
                        fill="white"
                        stroke="#919191"
                        strokeWidth="2"
                    />

                    {/* 속성 마커 (4분면) */}
                    {quadrantColors.topLeft && (
                        <path d="M20,2 L20,20 L2,20 Z" fill={quadrantColors.topLeft} />
                    )}
                    {quadrantColors.topRight && (
                        <path d="M20,2 L38,20 L20,20 Z" fill={quadrantColors.topRight} />
                    )}
                    {quadrantColors.bottomLeft && (
                        <path d="M2,20 L20,20 L20,38 Z" fill={quadrantColors.bottomLeft} />
                    )}
                    {quadrantColors.bottomRight && (
                        <path d="M20,20 L38,20 L20,38 Z" fill={quadrantColors.bottomRight} />
                    )}

                    {/* 사망 표시 (사선 /) */}
                    {deceased && (
                        <g stroke="#333" strokeWidth="2">
                            <line x1="8" y1="32" x2="32" y2="8" />
                        </g>
                    )}
                </svg>

                {/* 연결 핸들 (Top, Bottom, Left, Right) 
                    relative div 안에 있으므로 40x40 영역 기준으로 배치됨.
                */}
                <Handle
                    type="target"
                    position={Position.Top}
                    id="top"
                    style={{ background: '#555' }}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="bottom"
                    style={{ background: '#555' }}
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    id="left"
                    style={{ background: '#555' }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="right"
                    style={{ background: '#555' }}
                />
            </div>

            <div className="node-label">
                {name}{age ? ` (${age}세)` : ''}
            </div>
        </div>
    );
}
