// 성별 타입
export type Gender = 'M' | 'F';

// 관계 상태 타입
export type RelationStatus = 'married' | 'divorced';

// 속성 마커 타입 (A-L)
export type AttributeMarker = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

// 가족 구성원 인터페이스
export interface Person {
    key: number;
    name: string;
    age?: number | null;
    gender: Gender;
    deceased?: boolean;
    father?: number | null;
    mother?: number | null;
    spouse?: number | null;
    relationStatus?: RelationStatus;
    attributes?: AttributeMarker[];
    position?: { x: number; y: number } | null;
}

// 가계도 저장 데이터 형식
export interface GenogramData {
    version: string;
    nextKey: number;
    familyData: Person[];
}

// React Flow 노드 데이터
export interface PersonNodeData {
    person: Person;
    label: string;
}

// 엣지 타입
export type EdgeType = 'parent-child' | 'marriage' | 'divorce';

// React Flow 엣지 데이터
export interface RelationEdgeData {
    edgeType: EdgeType;
}
