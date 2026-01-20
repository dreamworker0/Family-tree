// 성별 타입
// M: 남성, F: 여성, U: 성별 미상(Unknown), P: 반려동물(Pet)
export type Gender = 'M' | 'F' | 'U' | 'P';

// 관계 상태 타입
export type RelationStatus = 'married' | 'divorced';

// 출생 상태 타입
// normal: 정상 출생, pregnancy: 임신 중, miscarriage: 유산, abortion: 인공임신중절
export type BirthStatus = 'normal' | 'pregnancy' | 'miscarriage' | 'abortion';

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
    // 제노그램 표준 기호 추가
    isAdopted?: boolean;      // 입양 아동 (파란 점선)
    isFoster?: boolean;       // 위탁 아동 (초록 점선)
    birthStatus?: BirthStatus; // 출생 상태 (임신/유산/중절)
    twinGroup?: number | null; // 쌍둥이 그룹 ID
    isIdenticalTwin?: boolean; // 일란성 쌍둥이 여부
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
