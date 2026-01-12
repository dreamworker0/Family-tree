import { useGenogramStore } from '../store/useGenogramStore';

interface PaneContextMenuProps {
    top: number;
    left: number;
    flowX: number;
    flowY: number;
    onClose: () => void;
    onPersonAdded: (key: number) => void;
}

export default function PaneContextMenu({ top, left, flowX, flowY, onClose, onPersonAdded }: PaneContextMenuProps) {
    const addPerson = useGenogramStore((state) => state.addPerson);

    const handleAdd = (gender: 'M' | 'F') => {
        const newKey = addPerson({
            name: `${gender === 'M' ? '새 남성' : '새 여성'}`,
            gender,
            age: null,
            deceased: false,
            father: null,
            mother: null,
            spouse: null,
            relationStatus: 'married',
            attributes: [],
            position: { x: flowX, y: flowY }
        });
        onPersonAdded(newKey);
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: top,
                left: left,
                zIndex: 2000,
                backgroundColor: '#1a1a2e',
                border: '1px solid #00d9ff',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                width: '160px',
                color: '#e8e8e8',
                fontFamily: 'sans-serif',
                fontSize: '13px'
            }}>
            <div style={{ padding: '6px 8px', color: '#888', borderBottom: '1px solid #333', marginBottom: '4px', fontSize: '11px' }}>
                빈 공간 우클릭 메뉴
            </div>
            <button
                onClick={() => handleAdd('M')}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    background: 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                ♂ 남성 추가
            </button>
            <button
                onClick={() => handleAdd('F')}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    background: 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                ♀ 여성 추가
            </button>
            <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
            <button
                onClick={onClose}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    background: 'transparent',
                    color: '#aaa',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '11px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                닫기
            </button>
        </div>
    );
}
