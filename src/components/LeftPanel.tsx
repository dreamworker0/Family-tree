import { useState, useEffect } from 'react';
import { useGenogramStore, useSelectedPerson } from '../store/useGenogramStore';
import type { Gender, RelationStatus, AttributeMarker, BirthStatus } from '../types/types';
import { attributeOptions } from '../utils/attributeColors';
import './LeftPanel.css';

interface FormState {
    name: string;
    age: string;
    gender: Gender;
    deceased: boolean;
    isAdopted: boolean;
    isFoster: boolean;
    birthStatus: BirthStatus;
    twinGroup: string;
    isIdenticalTwin: boolean;
    father: string;
    mother: string;
    spouse: string;
    sibling: string;
    relationStatus: RelationStatus;
    attrTL: string;
    attrTR: string;
    attrBL: string;
    attrBR: string;
}

const initialFormState: FormState = {
    name: '',
    age: '',
    gender: 'M',
    deceased: false,
    isAdopted: false,
    isFoster: false,
    birthStatus: 'normal',
    twinGroup: '',
    isIdenticalTwin: false,
    father: '',
    mother: '',
    spouse: '',
    sibling: '',
    relationStatus: 'married',
    attrTL: '',
    attrTR: '',
    attrBL: '',
    attrBR: '',
};

export default function LeftPanel() {
    const familyData = useGenogramStore((state) => state.familyData);
    const selectedPersonKeys = useGenogramStore((state) => state.selectedPersonKeys);
    // 가장 최근 선택된 키 (단일 선택 호환)
    const selectedPersonKey = selectedPersonKeys.length > 0 ? selectedPersonKeys[selectedPersonKeys.length - 1] : null;

    const [collapsed, setCollapsed] = useState(false);

    const addPerson = useGenogramStore((state) => state.addPerson);
    const updatePerson = useGenogramStore((state) => state.updatePerson);
    const deletePerson = useGenogramStore((state) => state.deletePerson);
    const selectPerson = useGenogramStore((state) => state.selectPerson);


    const selectedPerson = useSelectedPerson();
    const [form, setForm] = useState<FormState>(initialFormState);
    const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 선택된 사람이 변경되면 폼에 반영
    useEffect(() => {
        if (selectedPerson) {
            const attrs = selectedPerson.attributes || [];
            setForm({
                name: selectedPerson.name,
                age: selectedPerson.age?.toString() || '',
                gender: selectedPerson.gender,
                deceased: selectedPerson.deceased || false,
                isAdopted: selectedPerson.isAdopted || false,
                isFoster: selectedPerson.isFoster || false,
                birthStatus: selectedPerson.birthStatus || 'normal',
                twinGroup: selectedPerson.twinGroup?.toString() || '',
                isIdenticalTwin: selectedPerson.isIdenticalTwin || false,
                father: selectedPerson.father?.toString() || '',
                mother: selectedPerson.mother?.toString() || '',
                spouse: selectedPerson.spouse?.toString() || '',
                sibling: '',
                relationStatus: selectedPerson.relationStatus || 'married',
                attrTL: attrs.find((a) => ['A', 'B', 'C'].includes(a)) || '',
                attrTR: attrs.find((a) => ['D', 'E', 'F'].includes(a)) || '',
                attrBL: attrs.find((a) => ['J', 'K', 'L'].includes(a)) || '',
                attrBR: attrs.find((a) => ['G', 'H', 'I'].includes(a)) || '',
            });
        }
    }, [selectedPerson]);

    const showToast = (message: string, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3000);
    };

    const clearForm = () => {
        selectPerson(null);
        setForm(initialFormState);
    };

    const getAttributes = (): AttributeMarker[] => {
        const attrs: AttributeMarker[] = [];
        if (form.attrTL) attrs.push(form.attrTL as AttributeMarker);
        if (form.attrTR) attrs.push(form.attrTR as AttributeMarker);
        if (form.attrBL) attrs.push(form.attrBL as AttributeMarker);
        if (form.attrBR) attrs.push(form.attrBR as AttributeMarker);
        return attrs;
    };

    const handleAdd = () => {
        if (!form.name.trim()) {
            showToast('이름을 입력해주세요.', true);
            return;
        }

        addPerson({
            name: form.name.trim(),
            age: form.age ? parseInt(form.age) : null,
            gender: form.gender,
            deceased: form.deceased,
            isAdopted: form.isAdopted,
            isFoster: form.isFoster,
            birthStatus: form.birthStatus,
            twinGroup: form.twinGroup ? parseInt(form.twinGroup) : null,
            isIdenticalTwin: form.isIdenticalTwin,
            father: form.father ? parseInt(form.father) : null,
            mother: form.mother ? parseInt(form.mother) : null,
            spouse: form.spouse ? parseInt(form.spouse) : null,
            relationStatus: form.relationStatus,
            attributes: getAttributes(),
        });

        showToast(`${form.name}님이 추가되었습니다.`);
        clearForm();
    };

    const handleUpdate = () => {
        if (selectedPersonKey === null) {
            showToast('수정할 가족 구성원을 선택해주세요.', true);
            return;
        }
        if (!form.name.trim()) {
            showToast('이름을 입력해주세요.', true);
            return;
        }

        const newFather = form.father ? parseInt(form.father) : null;
        const newMother = form.mother ? parseInt(form.mother) : null;
        const newSpouse = form.spouse ? parseInt(form.spouse) : null;

        // 형제/자매로 설정되는 경우 (부모가 같아지는 경우) 배우자 관계가 있으면 해제
        let finalSpouse = newSpouse;
        if (newSpouse) {
            const spouse = familyData.find(p => p.key === newSpouse);
            if (spouse && spouse.father === newFather && spouse.mother === newMother && newFather !== null && newMother !== null) {
                finalSpouse = null;
                showToast('형제/자매 관계가 되어 배우자 관계가 해제되었습니다.', true);
            }
        }

        updatePerson(selectedPersonKey, {
            name: form.name.trim(),
            age: form.age ? parseInt(form.age) : null,
            gender: form.gender,
            deceased: form.deceased,
            isAdopted: form.isAdopted,
            isFoster: form.isFoster,
            birthStatus: form.birthStatus,
            twinGroup: form.twinGroup ? parseInt(form.twinGroup) : null,
            isIdenticalTwin: form.isIdenticalTwin,
            father: newFather,
            mother: newMother,
            spouse: finalSpouse,
            relationStatus: form.relationStatus,
            attributes: getAttributes(),
        });

        showToast(`${form.name}님 정보가 수정되었습니다.`);
    };

    const handleDelete = (key: number) => {
        const person = familyData.find((p) => p.key === key);
        if (person) {
            deletePerson(key);
            showToast(`${person.name}님이 삭제되었습니다.`);
            if (selectedPersonKey === key) {
                clearForm();
            }
        }
    };

    const handleSiblingSelect = (siblingKey: string) => {
        if (!siblingKey) return;
        const sibling = familyData.find((p) => p.key === parseInt(siblingKey));
        if (sibling) {
            setForm((prev) => ({
                ...prev,
                sibling: siblingKey,
                father: sibling.father?.toString() || prev.father,
                mother: sibling.mother?.toString() || prev.mother,
            }));
            showToast(`${sibling.name}님의 부모 정보를 복사했습니다.`);
        }
    };



    // 필터링된 목록
    const males = familyData.filter((p) => p.gender === 'M' && p.key !== selectedPersonKey);
    const females = familyData.filter((p) => p.gender === 'F' && p.key !== selectedPersonKey);
    const potentialSpouses = form.gender === 'M' ? females : males;
    const potentialSiblings = familyData.filter(
        (p) => p.key !== selectedPersonKey && (p.father || p.mother)
    );

    const filteredFamilyData = familyData.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`left-panel ${collapsed ? 'collapsed' : ''}`}>
            <button
                className="collapse-toggle"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? '사이드바 열기' : '사이드바 접기'}
            >
                {collapsed ? '▶' : '◀'} 편집창
            </button>
            <div className="panel-content">
                <h1 className="panel-title">🌳 가계도 만들기</h1>

                {/* 기본 정보 */}
                <div className="section">
                    <div className="section-title">기본 정보</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>이름</label>
                            <input
                                type="text"
                                maxLength={10}
                                placeholder="이름 입력"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label>나이</label>
                            <input
                                type="number"
                                placeholder="나이"
                                min="0"
                                max="150"
                                value={form.age}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setForm({ ...form, age: (isNaN(val) ? '' : Math.max(0, val)).toString() });
                                }}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>성별</label>
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                            >
                                <option value="M">남성</option>
                                <option value="F">여성</option>
                                <option value="U">성별 미상</option>
                                <option value="P">반려동물</option>
                            </select>
                        </div>
                    </div>

                    {/* 추가 상태 정보 */}
                    <div className="status-group-container">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="personDeceased"
                                checked={form.deceased}
                                onChange={(e) => setForm({ ...form, deceased: e.target.checked })}
                            />
                            <label htmlFor="personDeceased">사망</label>
                        </div>

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="personAdopted"
                                checked={form.isAdopted}
                                onChange={(e) => setForm({ ...form, isAdopted: e.target.checked })}
                            />
                            <label htmlFor="personAdopted">입양</label>
                        </div>

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="personFoster"
                                checked={form.isFoster}
                                onChange={(e) => setForm({ ...form, isFoster: e.target.checked })}
                            />
                            <label htmlFor="personFoster">위탁</label>
                        </div>
                    </div>

                    <div className="form-row" style={{ marginTop: '10px' }}>
                        <div className="form-group">
                            <label>출생 상태</label>
                            <select
                                value={form.birthStatus}
                                onChange={(e) => setForm({ ...form, birthStatus: e.target.value as BirthStatus })}
                            >
                                <option value="normal">정상</option>
                                <option value="pregnancy">임신 중</option>
                                <option value="miscarriage">자연유산</option>
                                <option value="abortion">인공임신중절</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>쌍둥이 그룹 ID (숫자)</label>
                            <input
                                type="number"
                                placeholder="예: 1"
                                min="1"
                                value={form.twinGroup}
                                onChange={(e) => setForm({ ...form, twinGroup: e.target.value })}
                            />
                        </div>
                        <div className="checkbox-group" style={{ marginTop: '28px', flex: '0 0 auto' }}>
                            <input
                                type="checkbox"
                                id="identicalTwin"
                                checked={form.isIdenticalTwin}
                                onChange={(e) => setForm({ ...form, isIdenticalTwin: e.target.checked })}
                            />
                            <label htmlFor="identicalTwin">일란성</label>
                        </div>
                    </div>
                </div>

                {/* 가족 관계 */}
                <div className="section">
                    <div className="section-title">가족 관계</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>아버지</label>
                            <select
                                value={form.father}
                                onChange={(e) => setForm({ ...form, father: e.target.value })}
                            >
                                <option value="">선택 안 함</option>
                                {males.map((p) => (
                                    <option key={p.key} value={p.key}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>어머니</label>
                            <select
                                value={form.mother}
                                onChange={(e) => setForm({ ...form, mother: e.target.value })}
                            >
                                <option value="">선택 안 함</option>
                                {females.map((p) => (
                                    <option key={p.key} value={p.key}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>배우자</label>
                            <select
                                value={form.spouse}
                                onChange={(e) => setForm({ ...form, spouse: e.target.value })}
                            >
                                <option value="">선택 안 함</option>
                                {potentialSpouses.map((p) => (
                                    <option key={p.key} value={p.key}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>관계 상태</label>
                            <select
                                value={form.relationStatus}
                                onChange={(e) => setForm({ ...form, relationStatus: e.target.value as RelationStatus })}
                            >
                                <option value="married">결혼</option>
                                <option value="divorced">이혼</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>형제/자매 (같은 부모 복사)</label>
                            <select
                                value={form.sibling}
                                onChange={(e) => handleSiblingSelect(e.target.value)}
                            >
                                <option value="">선택 안 함</option>
                                {potentialSiblings.map((p) => (
                                    <option key={p.key} value={p.key}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 속성 마커 */}
                <details className="section">
                    <summary className="section-title" style={{ cursor: 'pointer', listStyle: 'none' }}>
                        <span>속성 마커 (4분면 표시)</span>
                        <span style={{ fontSize: '0.8em', color: '#aaa' }}>▼</span>
                    </summary>
                    <div className="form-row" style={{ marginTop: '15px' }}>
                        <div className="form-group">
                            <label>좌상단</label>
                            <select
                                value={form.attrTL}
                                onChange={(e) => setForm({ ...form, attrTL: e.target.value })}
                            >
                                {attributeOptions.topLeft.map((opt) => (
                                    <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>우상단</label>
                            <select
                                value={form.attrTR}
                                onChange={(e) => setForm({ ...form, attrTR: e.target.value })}
                            >
                                {attributeOptions.topRight.map((opt) => (
                                    <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>좌하단</label>
                            <select
                                value={form.attrBL}
                                onChange={(e) => setForm({ ...form, attrBL: e.target.value })}
                            >
                                {attributeOptions.bottomLeft.map((opt) => (
                                    <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>우하단</label>
                            <select
                                value={form.attrBR}
                                onChange={(e) => setForm({ ...form, attrBR: e.target.value })}
                            >
                                {attributeOptions.bottomRight.map((opt) => (
                                    <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </details>

                {/* 버튼 그룹 */}
                <div className="btn-group">
                    <button className="btn btn-primary" onClick={handleAdd}>
                        ➕ 추가
                    </button>
                    <button className="btn btn-secondary" onClick={handleUpdate}>
                        ✏️ 수정
                    </button>
                    <button className="btn btn-secondary" onClick={clearForm}>
                        🧹 입력 비우기
                    </button>
                </div>

                {/* 가족 목록 */}
                <div className="section" style={{ marginTop: '20px' }}>
                    <div className="section-title">가족 구성원 목록</div>

                    {/* 검색창 */}
                    <div className="search-group" style={{ marginBottom: '12px' }}>
                        <input
                            type="text"
                            placeholder="이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #444',
                                background: '#1a1a2e',
                                color: '#fff',
                                fontSize: '13px'
                            }}
                        />
                    </div>

                    <div className="family-list">
                        {filteredFamilyData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>
                                {searchTerm ? '검색 결과가 없습니다.' : '가족 구성원이 없습니다.'}
                            </div>
                        ) : (
                            filteredFamilyData.map((person) => (
                                <div
                                    key={person.key}
                                    className={`family-item ${selectedPersonKeys.includes(person.key) ? 'selected' : ''}`}
                                    onClick={(e) => {
                                        // Shift 키가 눌렸으면 토글, 아니면 단일 선택
                                        if (e.shiftKey) {
                                            // 여기선 store에 toggleSelectPerson을 쓰거나 직접 구현해야 함. 
                                            // 하지만 LeftPanel에는 toggleSelectPerson을 import하지 않았음.
                                            // selectPerson은 단일 선택. 
                                            // 일단 Shift 클릭 지원은 하지 않거나, toggle 액션을 가져와야 함.
                                            // 사용자는 "도형 클릭"을 말했으므로 리스트 클릭은 선택사항이지만, 일관성을 위해 두는 게 좋음.
                                            // 일단 단순 active check만 수정.
                                        }
                                        selectPerson(person.key);
                                    }}
                                >
                                    <div className="family-item-info">
                                        {(person.birthStatus && person.birthStatus !== 'normal') ? (
                                            <div className="gender-icon-wrapper">
                                                <svg width="24" height="24" viewBox="0 0 40 40">
                                                    <polygon
                                                        points="20,2 38,38 2,38"
                                                        fill="rgba(255, 255, 255, 0.2)"
                                                        stroke="#aaa"
                                                        strokeWidth="3"
                                                    />
                                                    {person.birthStatus === 'miscarriage' && (
                                                        <g stroke="#aaa" strokeWidth="3">
                                                            <line x1="12" y1="14" x2="28" y2="30" />
                                                            <line x1="28" y1="14" x2="12" y2="30" />
                                                        </g>
                                                    )}
                                                    {person.birthStatus === 'abortion' && (
                                                        <g stroke="#aaa" strokeWidth="3">
                                                            <line x1="8" y1="15" x2="32" y2="15" />
                                                            <line x1="14" y1="9" x2="26" y2="25" />
                                                            <line x1="26" y1="9" x2="14" y2="25" />
                                                        </g>
                                                    )}
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className={`gender-icon gender-${person.gender === 'M' ? 'male' :
                                                person.gender === 'F' ? 'female' :
                                                    person.gender === 'P' ? 'pet' : 'unknown'
                                                }`}>
                                                {
                                                    person.gender === 'M' ? '♂' :
                                                        person.gender === 'F' ? '♀' :
                                                            person.gender === 'P' ? '🐾' : '?'
                                                }
                                            </div>
                                        )}
                                        <div>
                                            <div className="family-item-name">{person.name}</div>
                                            <div className="family-item-age">{(person.age !== null && person.age !== undefined) ? `${person.age}세` : ''}</div>
                                        </div>
                                    </div>
                                    <div className="family-item-status">
                                        {person.deceased && <span className="status-badge">사망</span>}
                                    </div>
                                    <button
                                        className="family-item-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(person.key);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 토스트 메시지 */}
                {toast && (
                    <div className={`toast show ${toast.isError ? 'error' : ''}`}>
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}
