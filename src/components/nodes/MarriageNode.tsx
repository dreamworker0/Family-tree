import { Handle, Position, NodeProps } from '@xyflow/react';

export default function MarriageNode({ }: NodeProps) {
    return (
        <div style={{
            width: 1,
            height: 1,
            background: 'transparent',
            position: 'relative'
        }}>
            {/* 자녀들과 연결될 핸들 */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{ background: 'transparent', border: 'none' }}
                isConnectable={false}
            />
            {/* 부모들과 연결될 핸들 */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{ background: 'transparent', border: 'none' }}
                isConnectable={false}
            />
        </div>
    );
}
