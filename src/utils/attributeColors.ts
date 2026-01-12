import type { AttributeMarker } from '../types/types';

// 속성 마커별 색상 매핑
export const attributeColors: Record<AttributeMarker, string> = {
    A: '#00af54', // green
    B: '#f27935', // orange
    C: '#d4071c', // red
    D: '#70bdc2', // cyan
    E: '#fcf384', // gold
    F: '#e69aaf', // pink
    G: '#08488f', // blue
    H: '#866310', // brown
    I: '#9270c2', // purple
    J: '#a3cf62', // chartreuse
    K: '#91a4c2', // lightgray bluish
    L: '#af70c2', // magenta
};

// 속성 마커 색상 반환 함수
export function getAttributeColor(attr: AttributeMarker): string {
    return attributeColors[attr] || 'transparent';
}

// 분면별 속성 마커 그룹
export const quadrantMarkers = {
    topLeft: ['A', 'B', 'C'] as AttributeMarker[],     // 좌상단
    topRight: ['D', 'E', 'F'] as AttributeMarker[],    // 우상단
    bottomLeft: ['J', 'K', 'L'] as AttributeMarker[],  // 좌하단
    bottomRight: ['G', 'H', 'I'] as AttributeMarker[], // 우하단
};

// 속성 마커가 어느 분면인지 반환
export function getQuadrant(attr: AttributeMarker): 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null {
    if (quadrantMarkers.topLeft.includes(attr)) return 'topLeft';
    if (quadrantMarkers.topRight.includes(attr)) return 'topRight';
    if (quadrantMarkers.bottomLeft.includes(attr)) return 'bottomLeft';
    if (quadrantMarkers.bottomRight.includes(attr)) return 'bottomRight';
    return null;
}

// 속성 마커 옵션 (드롭다운용)
export const attributeOptions = {
    topLeft: [
        { value: '', label: '없음' },
        { value: 'A', label: '● 녹색', color: '#00af54' },
        { value: 'B', label: '● 주황', color: '#f27935' },
        { value: 'C', label: '● 빨강', color: '#d4071c' },
    ],
    topRight: [
        { value: '', label: '없음' },
        { value: 'D', label: '● 시안', color: '#70bdc2' },
        { value: 'E', label: '● 금색', color: '#fcf384' },
        { value: 'F', label: '● 분홍', color: '#e69aaf' },
    ],
    bottomLeft: [
        { value: '', label: '없음' },
        { value: 'J', label: '● 연두', color: '#a3cf62' },
        { value: 'K', label: '● 회청', color: '#91a4c2' },
        { value: 'L', label: '● 자홍', color: '#af70c2' },
    ],
    bottomRight: [
        { value: '', label: '없음' },
        { value: 'G', label: '● 파랑', color: '#08488f' },
        { value: 'H', label: '● 갈색', color: '#866310' },
        { value: 'I', label: '● 보라', color: '#9270c2' },
    ],
};
