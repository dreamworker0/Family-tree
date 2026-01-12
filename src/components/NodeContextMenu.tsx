import { useState, useEffect } from 'react';
import { useGenogramStore } from '../store/useGenogramStore';
import { Person, Gender, RelationStatus } from '../types/types';
import { attributeOptions } from '../utils/attributeColors';

interface NodeContextMenuProps {
    id: string; // The person key as string
    top: number;
    left: number;
    onClose: () => void;
}

export default function NodeContextMenu({ id, top, left, onClose }: NodeContextMenuProps) {
    const familyData = useGenogramStore((state) => state.familyData);
    const selectedPersonKeys = useGenogramStore((state) => state.selectedPersonKeys);

    const personKey = parseInt(id);
    const person = familyData.find((p) => p.key === personKey);

    const updatePerson = useGenogramStore((state) => state.updatePerson);
    const deletePerson = useGenogramStore((state) => state.deletePerson);

    const [formData, setFormData] = useState<Partial<Person>>({});
    const [quadrants, setQuadrants] = useState({
        tl: '', tr: '', bl: '', br: ''
    });

    const [pos, setPos] = useState({ top, left });
    const [dragging, setDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (person) {
            setFormData({
                name: person.name,
                age: person.age,
                gender: person.gender,
                deceased: person.deceased,
                attributes: person.attributes || [],
            });

            const attrs = person.attributes || [];
            setQuadrants({
                tl: attrs.find((a) => ['A', 'B', 'C'].includes(a)) || '',
                tr: attrs.find((a) => ['D', 'E', 'F'].includes(a)) || '',
                bl: attrs.find((a) => ['J', 'K', 'L'].includes(a)) || '',
                br: attrs.find((a) => ['G', 'H', 'I'].includes(a)) || '',
            });
        }
    }, [person]);

    useEffect(() => {
        setPos({ top, left });
    }, [top, left]);

    const handleQuadrantChange = (posKey: 'tl' | 'tr' | 'bl' | 'br', val: string) => {
        setQuadrants(prev => {
            const next = { ...prev, [posKey]: val };
            const newAttrs: any[] = [];
            if (next.tl) newAttrs.push(next.tl);
            if (next.tr) newAttrs.push(next.tr);
            if (next.bl) newAttrs.push(next.bl);
            if (next.br) newAttrs.push(next.br);

            setFormData(prevForm => ({ ...prevForm, attributes: newAttrs }));
            return next;
        });
    };

    // 드래그 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents React Flow from starting a pane drag or node move
        setDragging(true);
        setDragOffset({
            x: e.clientX - pos.left,
            y: e.clientY - pos.top
        });
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPos({
                top: e.clientY - dragOffset.y,
                left: e.clientX - dragOffset.x
            });
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragOffset]);

    if (!person) return null;

    const isMultiSelect = selectedPersonKeys.length > 1 && selectedPersonKeys.includes(personKey);
    const others = selectedPersonKeys.filter(k => k !== personKey);
    const otherNames = others.map(k => familyData.find(p => p.key === k)?.name || '알 수 없음');
    const targetLabel = otherNames.length === 1 ? `${otherNames[0]} 님` : `${otherNames[0]} 외 ${otherNames.length - 1}명`;

    const handleSetRelationship = (type: 'father' | 'mother' | 'spouse', status: RelationStatus = 'married') => {
        others.forEach(otherKey => {
            if (type === 'spouse') {
                updatePerson(personKey, { spouse: otherKey, relationStatus: status, position: null });
                updatePerson(otherKey, { spouse: personKey, relationStatus: status, position: null });
            } else {
                updatePerson(otherKey, { [type]: personKey, position: null });
            }
        });
        // 관계가 설정된 당사자(부모)의 위치도 초기화하여 올바른 세대로 이동하게 함
        updatePerson(personKey, { position: null });

        const typeLabel = type === 'father' ? '[아버지]' : type === 'mother' ? '[어머니]' : status === 'married' ? '[배우자(결혼)]' : '[배우자(이혼)]';
        alert(`${person.name} 님을 ${targetLabel}의 ${typeLabel}로 설정했습니다.`);
        onClose();
    };

    const handleSetSiblings = () => {
        others.forEach(otherKey => {
            const other = familyData.find(p => p.key === otherKey);
            if (!other) return;

            // 형제면 배우자 관계일 수 없으므로 부부 관계 해제
            if (person.spouse === otherKey) {
                updatePerson(personKey, { spouse: null });
            }
            if (other.spouse === personKey) {
                updatePerson(otherKey, { spouse: null });
            }

            // 부모 정보 복사 및 위치 초기화
            updatePerson(otherKey, {
                father: person.father,
                mother: person.mother,
                position: null
            });
        });
        updatePerson(personKey, { position: null });
        alert(`${person.name} 님과 ${targetLabel}을 [형제/자매]로 설정했습니다. (기존 부부 관계는 해제되었습니다.)`);
        onClose();
    };

    // 다중 선택된 사람들 중 부부인 쌍을 찾아 나머지를 그들의 자녀로 설정
    const handleSetAsChildren = () => {
        const selectedPersons = selectedPersonKeys.map(k => familyData.find(p => p.key === k)).filter(p => !!p) as Person[];
        const husband = selectedPersons.find(p => p.gender === 'M' && p.spouse && selectedPersonKeys.includes(p.spouse));
        const wife = husband ? selectedPersons.find(p => p.key === husband.spouse) : null;

        if (!husband || !wife) {
            alert('부부(남성 1명, 여성 1명)가 포함되어 있어야 [자녀로 설정]이 가능합니다.');
            return;
        }

        const children = selectedPersons.filter(p => p.key !== husband.key && p.key !== wife.key);
        children.forEach(child => {
            updatePerson(child.key, {
                father: husband.key,
                mother: wife.key,
                position: null
            });
        });

        // 부모 위치도 초기화하여 레이아웃 갱신
        updatePerson(husband.key, { position: null });
        updatePerson(wife.key, { position: null });

        alert(`${husband.name}·${wife.name} 부부의 자녀로 ${children.length}명을 설정했습니다.`);
        onClose();
    };

    const handleChange = (field: keyof Person, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updatePerson(personKey, formData);
        onClose();
    };

    const handleDelete = () => {
        if (confirm('정말로 삭제하시겠습니까?')) {
            deletePerson(personKey);
            onClose();
        }
    }

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                zIndex: 1000,
                backgroundColor: '#1a1a2e',
                border: '1px solid #00d9ff',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                width: '280px',
                color: '#e8e8e8',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                userSelect: dragging ? 'none' : 'auto'
            }}>
            {/* 드래그용 헤더 */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '24px',
                    cursor: 'move',
                    borderRadius: '8px 8px 0 0',
                    zIndex: 1
                }}
            />

            {isMultiSelect && (
                <div style={{ marginBottom: '16px', paddingBottom: '12px' }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#ffcc00', fontSize: '14px' }}>
                        다중 선택 관계 설정 ({selectedPersonKeys.length}명 선택됨)
                    </h3>
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #444' }}>
                        {person.name} 님 → {targetLabel}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {others.includes(person.spouse || -1) && (
                            <div style={{ fontSize: '11px', color: '#ff4757', marginBottom: '4px' }}>
                                ⚠️ 배우자가 포함되어 있어 부모로 설정할 수 없습니다.
                            </div>
                        )}
                        <button
                            onClick={() => handleSetRelationship('father')}
                            disabled={others.includes(person.spouse || -1)}
                            style={{
                                padding: '6px',
                                background: others.includes(person.spouse || -1) ? '#222' : '#333',
                                color: others.includes(person.spouse || -1) ? '#666' : '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: others.includes(person.spouse || -1) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            [아버지]로 설정
                        </button>
                        <button
                            onClick={() => handleSetRelationship('mother')}
                            disabled={others.includes(person.spouse || -1)}
                            style={{
                                padding: '6px',
                                background: others.includes(person.spouse || -1) ? '#222' : '#333',
                                color: others.includes(person.spouse || -1) ? '#666' : '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: others.includes(person.spouse || -1) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            [어머니]로 설정
                        </button>
                        <button
                            onClick={handleSetSiblings}
                            style={{ padding: '6px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            [형제/자매]로 설정
                        </button>
                        {selectedPersonKeys.length === 2 && (
                            <>
                                <button
                                    onClick={() => handleSetRelationship('spouse', 'married')}
                                    style={{ padding: '6px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    [결혼]으로 설정
                                </button>
                                <button
                                    onClick={() => handleSetRelationship('spouse', 'divorced')}
                                    style={{ padding: '6px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    [이혼]으로 설정
                                </button>
                            </>
                        )}
                        {selectedPersonKeys.length >= 3 && (() => {
                            const selectedPersons = selectedPersonKeys.map(k => familyData.find(p => p.key === k)).filter(p => !!p) as Person[];
                            const husband = selectedPersons.find(p => p.gender === 'M' && p.spouse && selectedPersonKeys.includes(p.spouse));
                            const wife = husband ? selectedPersons.find(p => p.key === husband.spouse) : null;
                            if (husband && wife) {
                                return (
                                    <button
                                        onClick={handleSetAsChildren}
                                        style={{ padding: '6px', background: '#22a6b3', color: '#fff', border: '1px solid #1dd1a1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        [{husband.name}·{wife.name}]의 [자녀]로 설정
                                    </button>
                                );
                            }
                            return null;
                        })()}
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: '4px',
                                padding: '6px',
                                background: 'transparent',
                                color: '#ccc',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {!isMultiSelect && (
                <>
                    <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #555', paddingBottom: '8px', color: '#00d9ff' }}>
                        노드 속성 편집
                    </h3>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#ccc' }}>이름</label>
                        <input
                            maxLength={10}
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                background: '#333',
                                color: 'white'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#ccc' }}>나이</label>
                            <input
                                type="number"
                                value={formData.age || ''}
                                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: '1px solid #555',
                                    background: '#333',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#ccc' }}>성별</label>
                            <select
                                value={formData.gender || 'M'}
                                onChange={(e) => handleChange('gender', e.target.value as Gender)}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: '1px solid #555',
                                    background: '#333',
                                    color: 'white'
                                }}
                            >
                                <option value="M">남성</option>
                                <option value="F">여성</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.deceased || false}
                                onChange={(e) => handleChange('deceased', e.target.checked)}
                            />
                            사망
                        </label>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#ccc' }}>속성 마커 (4분면)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa' }}>좌상단</label>
                                <select
                                    value={quadrants.tl}
                                    onChange={(e) => handleQuadrantChange('tl', e.target.value)}
                                    style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                                >
                                    {attributeOptions.topLeft.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ color: opt.color }}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa' }}>우상단</label>
                                <select
                                    value={quadrants.tr}
                                    onChange={(e) => handleQuadrantChange('tr', e.target.value)}
                                    style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                                >
                                    {attributeOptions.topRight.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ color: opt.color }}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa' }}>좌하단</label>
                                <select
                                    value={quadrants.bl}
                                    onChange={(e) => handleQuadrantChange('bl', e.target.value)}
                                    style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                                >
                                    {attributeOptions.bottomLeft.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ color: opt.color }}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa' }}>우하단</label>
                                <select
                                    value={quadrants.br}
                                    onChange={(e) => handleQuadrantChange('br', e.target.value)}
                                    style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                                >
                                    {attributeOptions.bottomRight.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ color: opt.color }}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleDelete}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid #ff4757',
                                background: 'rgba(255, 71, 87, 0.1)',
                                color: '#ff4757',
                                cursor: 'pointer'
                            }}
                        >
                            삭제
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                background: 'transparent',
                                color: '#ccc',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#00d9ff',
                                color: '#000',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            저장
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
