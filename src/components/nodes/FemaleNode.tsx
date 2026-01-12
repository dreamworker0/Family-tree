import { Handle, Position } from '@xyflow/react';
import type { AttributeMarker } from '../../types/types';
import { getAttributeColor, getQuadrant } from '../../utils/attributeColors';
import './PersonNode.css';

interface FemaleNodeProps {
    data: {
        name: string;
        age?: number | null;
        deceased?: boolean;
        attributes?: AttributeMarker[];
    };
    selected?: boolean;
}

export default function FemaleNode({ data, selected }: FemaleNodeProps) {
    const { name, age, deceased, attributes = [] } = data;

    // 속성 마커를 분면별로 분리
    const quadrantColors: Record<string, string> = {};
    attributes.forEach((attr) => {
        const quadrant = getQuadrant(attr);
        if (quadrant) {
            quadrantColors[quadrant] = getAttributeColor(attr);
        }
    });

    return (
        <div className={`person-node female-node ${selected ? 'selected' : ''}`}>
            <div className="node-icon female-icon">
                {/* 연결 핸들 (Top) */}
                <Handle
                    type="target"
                    position={Position.Top}
                    id="top"
                    style={{ background: '#555' }}
                />

                {/* 파이 형태 속성 마커 */}
                {quadrantColors.topLeft && (
                    <div className="attr-pie tl" style={{ backgroundColor: quadrantColors.topLeft }} />
                )}
                {quadrantColors.topRight && (
                    <div className="attr-pie tr" style={{ backgroundColor: quadrantColors.topRight }} />
                )}
                {quadrantColors.bottomLeft && (
                    <div className="attr-pie bl" style={{ backgroundColor: quadrantColors.bottomLeft }} />
                )}
                {quadrantColors.bottomRight && (
                    <div className="attr-pie br" style={{ backgroundColor: quadrantColors.bottomRight }} />
                )}

                {/* 사망 표시 */}
                {deceased && <div className="deceased-slash" />}

                {/* 연결 핸들 (Bottom, Left, Right) - 아이콘 내부로 이동하여 경계에 밀착 */}
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
