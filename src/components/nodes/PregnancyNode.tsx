import { Handle, Position } from '@xyflow/react';
import type { BirthStatus } from '../../types/types';
import './PersonNode.css';

interface PregnancyNodeProps {
    data: {
        name: string;
        birthStatus?: BirthStatus;
    };
    selected?: boolean;
}

export default function PregnancyNode({ data, selected }: PregnancyNodeProps) {
    const { name, birthStatus = 'pregnancy' } = data;

    return (
        <div className={`person-node pregnancy-node ${selected ? 'selected' : ''}`}>
            {/* SVG로 심볼 그리기 */}
            <svg width="40" height="40" viewBox="0 0 40 40" className="pregnancy-svg">
                {/* 선택 시 하늘색 테두리 효과 (뒤에 배치) */}
                {selected && (
                    <polygon
                        points="20,2 38,38 2,38"
                        fill="none"
                        stroke="rgba(0, 217, 255, 0.5)"
                        strokeWidth="10"
                        strokeLinejoin="round"
                    />
                )}

                {/* 
                   기본 삼각형 (임신) 
                   fill: 흰색 배경, stroke: 회색 테두리 (#919191 - 기존 CSS 색상)
                */}
                <polygon
                    points="20,2 38,38 2,38"
                    fill="white"
                    stroke="#919191"
                    strokeWidth="2"
                />

                {/* 자연유산 (Miscarriage): X */}
                {birthStatus === 'miscarriage' && (
                    <g stroke="#333" strokeWidth="2">
                        {/* X 자 표시 - 심볼은 검은색 유지 (보통 상태 표시는 진하게 함) 또는 회색? 
                           사용자 요청: "삼각형의 테두리는 다른 도형처럼 회색으로". 
                           내부 심볼(X, =) 색상은 언급 없으나, 보통 검은색이 명확함.
                           하지만 "적절한 선" 요청이었으므로 #333 유지.
                        */}
                        <line x1="12" y1="14" x2="28" y2="30" />
                        <line x1="28" y1="14" x2="12" y2="30" />
                        {/* 작은 원 점으로 찍고 싶다면 아래 사용 */}
                        {/* <circle cx="20" cy="24" r="4" fill="#333" /> */}
                    </g>
                )}

                {/* 인공임신중절 (Abortion): = */}
                {/* 인공임신중절 (Abortion): 작은 삼각형이 겹친 X 형태 + 가로줄 */}
                {birthStatus === 'abortion' && (
                    <g stroke="#333" strokeWidth="2">
                        {/* 가로줄 (삼각형 상단 관통) */}
                        <line x1="8" y1="15" x2="32" y2="15" />
                        {/* X 자 (가로줄 위아래로 걸침) */}
                        <line x1="14" y1="9" x2="26" y2="25" />
                        <line x1="26" y1="9" x2="14" y2="25" />
                    </g>
                )}
            </svg>

            {/* 연결 핸들 (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{ top: 0, background: '#555' }}
            />

            {/* 연결 핸들 (Bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{ bottom: 0, background: '#555' }}
            />

            <div className="node-label">
                {name || (birthStatus === 'pregnancy' ? '임신' : birthStatus === 'miscarriage' ? '유산' : '중절')}
            </div>
        </div>
    );
}
