import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Person, RelationStatus, GenogramData } from '../types/types';

// 스토어 상태 인터페이스
interface GenogramState {
    familyData: Person[];
    nextKey: number;
    selectedPersonKeys: number[];

    // Undo/Redo History
    past: { familyData: Person[]; nextKey: number }[];
    future: { familyData: Person[]; nextKey: number }[];

    // 액션
    addPerson: (person: Omit<Person, 'key'>) => number;
    updatePerson: (key: number, updates: Partial<Person>) => void;
    deletePerson: (key: number) => void;
    selectPerson: (key: number | null) => void;
    toggleSelectPerson: (key: number) => void; // 다중 선택 토글
    reset: () => void;
    importData: (data: GenogramData) => void;
    exportData: () => GenogramData;
    clearAllPositions: () => void;

    // Undo/Redo Actions
    undo: () => void;
    redo: () => void;
}

// Zustand 스토어
export const useGenogramStore = create<GenogramState>()(
    persist(
        (set, get) => ({
            familyData: [],
            nextKey: 1,
            selectedPersonKeys: [],
            past: [],
            future: [],

            addPerson: (personData) => {
                const { familyData, nextKey, past } = get();
                // Save history
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                const newKey = get().nextKey;
                set((state) => {
                    const newPerson: Person = {
                        ...personData,
                        key: newKey,
                        position: personData.position || null,
                    };

                    // 배우자 관계 동기화
                    let updatedFamilyData = [...state.familyData];
                    if (newPerson.spouse) {
                        updatedFamilyData = updatedFamilyData.map((p) =>
                            p.key === newPerson.spouse
                                ? { ...p, spouse: newPerson.key, relationStatus: newPerson.relationStatus }
                                : p
                        );
                    }

                    return {
                        familyData: [...updatedFamilyData, newPerson],
                        nextKey: state.nextKey + 1,
                        selectedPersonKeys: [],
                    };
                });
                return newKey;
            },

            updatePerson: (key, updates) => {
                const { familyData, nextKey, past } = get();
                // Save history only if there are actual changes
                // (Optimized: Assuming updatePerson is called when changes are intended)
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                set((state) => {
                    const person = state.familyData.find((p) => p.key === key);
                    if (!person) return state;

                    // 자기 자신을 부모로 설정하는지 체크
                    if (updates.father === key || updates.mother === key) {
                        console.warn('Cannot set self as parent.');
                        // revert history save if no change
                        return { past: state.past };
                    }

                    // 순환 참조 체크 (자식이 부모가 되는 경우 방지)
                    const isDescendant = (parentKey: number, targetKey: number): boolean => {
                        const children = state.familyData.filter(p => p.father === parentKey || p.mother === parentKey);
                        for (const child of children) {
                            if (child.key === targetKey) return true;
                            if (isDescendant(child.key, targetKey)) return true;
                        }
                        return false;
                    };

                    if ((updates.father && isDescendant(key, updates.father)) ||
                        (updates.mother && isDescendant(key, updates.mother))) {
                        console.warn('Circular reference detected: Cannot set descendant as parent.');
                        // revert history save if no change
                        return { past: state.past };
                    }

                    let updatedFamilyData = state.familyData.map((p) => {
                        if (p.key === key) {
                            return { ...p, ...updates };
                        }
                        return p;
                    });

                    // 기존 배우자 관계 해제
                    if (person.spouse && person.spouse !== updates.spouse) {
                        updatedFamilyData = updatedFamilyData.map((p) =>
                            p.key === person.spouse && p.spouse === key
                                ? { ...p, spouse: null, relationStatus: 'married' as RelationStatus }
                                : p
                        );
                    }

                    // 배우자 관계 및 상태 동기화
                    const currentSpouseKey = updates.spouse !== undefined ? updates.spouse : person.spouse;
                    const newRelationStatus = updates.relationStatus || person.relationStatus;

                    if (currentSpouseKey) {
                        updatedFamilyData = updatedFamilyData.map((p) =>
                            p.key === currentSpouseKey
                                ? {
                                    ...p,
                                    spouse: key,
                                    relationStatus: newRelationStatus
                                }
                                : p
                        );
                    }

                    return { familyData: updatedFamilyData };
                });
            },

            deletePerson: (key) => {
                const { familyData, nextKey, past } = get();
                // Save history
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                set((state) => {
                    // 이 사람을 부모로 가진 자녀들의 부모 정보 제거
                    const updatedFamilyData = state.familyData
                        .filter((p) => p.key !== key)
                        .map((p) => ({
                            ...p,
                            father: p.father === key ? null : p.father,
                            mother: p.mother === key ? null : p.mother,
                            spouse: p.spouse === key ? null : p.spouse,
                            relationStatus: p.spouse === key ? 'married' as RelationStatus : p.relationStatus,
                        }));

                    return {
                        familyData: updatedFamilyData,
                        selectedPersonKeys: state.selectedPersonKeys.filter(k => k !== key),
                    };
                });
            },

            selectPerson: (key) => {
                set({ selectedPersonKeys: key === null ? [] : [key] });
            },

            toggleSelectPerson: (key) => {
                set((state) => {
                    const isSelected = state.selectedPersonKeys.includes(key);
                    return {
                        selectedPersonKeys: isSelected
                            ? state.selectedPersonKeys.filter((k) => k !== key)
                            : [...state.selectedPersonKeys, key],
                    };
                });
            },

            reset: () => {
                const { familyData, nextKey, past } = get();
                // Save history
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                set({
                    familyData: [],
                    nextKey: 1,
                    selectedPersonKeys: [],
                });
            },

            importData: (data) => {
                const { familyData, nextKey, past } = get();
                // Save history
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                set({
                    familyData: data.familyData,
                    nextKey: data.nextKey,
                    selectedPersonKeys: [],
                });
            },

            exportData: () => {
                const state = get();
                return {
                    version: '1.0',
                    nextKey: state.nextKey,
                    familyData: state.familyData,
                };
            },
            clearAllPositions: () => {
                const { familyData, nextKey, past } = get();
                // Save history
                set({
                    past: [...past, { familyData, nextKey }],
                    future: []
                });

                set((state) => ({
                    familyData: state.familyData.map((p) => ({ ...p, position: null })),
                }));
            },

            undo: () => {
                set((state) => {
                    if (state.past.length === 0) return state;

                    const previous = state.past[state.past.length - 1];
                    const newPast = state.past.slice(0, state.past.length - 1);

                    return {
                        past: newPast,
                        future: [{ familyData: state.familyData, nextKey: state.nextKey }, ...state.future],
                        familyData: previous.familyData,
                        nextKey: previous.nextKey,
                        selectedPersonKeys: [], // Clear selection on undo for simplicity
                    };
                });
            },

            redo: () => {
                set((state) => {
                    if (state.future.length === 0) return state;

                    const next = state.future[0];
                    const newFuture = state.future.slice(1);

                    return {
                        past: [...state.past, { familyData: state.familyData, nextKey: state.nextKey }],
                        future: newFuture,
                        familyData: next.familyData,
                        nextKey: next.nextKey,
                        selectedPersonKeys: [], // Clear selection on redo
                    };
                });
            },
        }),
        {
            name: 'genogramFamilyData',
            partialize: (state) => ({
                familyData: state.familyData,
                nextKey: state.nextKey,
                selectedPersonKeys: state.selectedPersonKeys,
                // past와 future는 영구 저장하지 않음 (새로고침 시 초기화)
            }),
        }
    )
);

// 선택된 사람 정보 가져오기 헬퍼 (마지막 선택된 사람 기준 - 단일 편집 호환용)
export function useSelectedPerson(): Person | null {
    const familyData = useGenogramStore((state) => state.familyData);
    const selectedPersonKeys = useGenogramStore((state) => state.selectedPersonKeys);

    if (selectedPersonKeys.length === 0) return null;
    // 가장 최근에 선택(배열의 마지막)된 사람을 반환하여 LeftPanel 등에서 사용
    const lastKey = selectedPersonKeys[selectedPersonKeys.length - 1];
    return familyData.find((p) => p.key === lastKey) || null;
}
