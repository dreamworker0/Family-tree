import type { Person } from '../types/types';
import type { Node, Edge } from '@xyflow/react';

// 노드 크기 상수
const NODE_WIDTH = 80;
const HORIZONTAL_SPACING = 120;
const VERTICAL_SPACING = 120;
const SPOUSE_SPACING = 100;

interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

// 세대 정보를 계산
function calculateGenerations(familyData: Person[]): Map<number, number> {
    const generations = new Map<number, number>();
    const personMap = new Map<number, Person>();

    familyData.forEach((p) => personMap.set(p.key, p));

    // 부모가 없는 사람들부터 시작 (1세대)
    const roots = familyData.filter((p) => !p.father && !p.mother);

    function setGeneration(person: Person, gen: number) {
        const currentGen = generations.get(person.key);
        // 이미 더 깊은(더 큰 숫자) 세대에 있다면 업데이트하지 않음 (루프 방지 및 최대 깊이 유지)
        if (currentGen !== undefined && currentGen >= gen) return;

        generations.set(person.key, gen);

        // 자녀들의 세대 설정 (부모보다 1단계 아래)
        familyData.forEach((child) => {
            if (child.father === person.key || child.mother === person.key) {
                setGeneration(child, gen + 1);
            }
        });

        // 배우자는 같은 세대 (재귀적으로 동기화하여 배우자의 자녀/연결 관계도 업데이트)
        if (person.spouse) {
            const spouse = personMap.get(person.spouse);
            if (spouse) {
                setGeneration(spouse, gen);
            }
        }
    }

    roots.forEach((root) => setGeneration(root, 0));

    // 세대가 설정되지 않은 사람들 처리
    familyData.forEach((p) => {
        if (!generations.has(p.key)) {
            generations.set(p.key, 0);
        }
    });

    return generations;
}

// 결혼 쌍을 찾음 (배우자 설정 및 자녀의 부모 관계 확인)
function findMarriagePairs(familyData: Person[]): [Person, Person][] {
    const pairs: [Person, Person][] = [];
    const processed = new Set<string>(); // "minKey-maxKey" 형대로 저장

    const addPair = (p1: Person, p2: Person) => {
        const k1 = Math.min(p1.key, p2.key);
        const k2 = Math.max(p1.key, p2.key);
        const pairKey = `${k1}-${k2}`;

        if (!processed.has(pairKey)) {
            // 남성을 먼저 (관례상)
            if (p1.gender === 'M') {
                pairs.push([p1, p2]);
            } else if (p2.gender === 'M') {
                pairs.push([p2, p1]);
            } else {
                // 동성 확인 - 키 순서
                pairs.push(p1.key < p2.key ? [p1, p2] : [p2, p1]);
            }
            processed.add(pairKey);
        }
    };

    // 1. 명시적 배우자 관계 확인
    familyData.forEach((person) => {
        if (person.spouse) {
            const spouse = familyData.find((p) => p.key === person.spouse);
            if (spouse) {
                addPair(person, spouse);
            }
        }
    });

    // 2. 자녀의 부모 관계를 통한 암시적 관계 확인
    familyData.forEach((child) => {
        if (child.father && child.mother) {
            const father = familyData.find((p) => p.key === child.father);
            const mother = familyData.find((p) => p.key === child.mother);
            if (father && mother) {
                addPair(father, mother);
            }
        }
    });

    return pairs;
}

// 가계도 레이아웃 계산
export function calculateGenogramLayout(
    familyData: Person[]
): LayoutResult {
    if (familyData.length === 0) {
        return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const generations = calculateGenerations(familyData);
    const marriagePairs = findMarriagePairs(familyData);

    // 세대별로 그룹화
    const generationGroups = new Map<number, Person[]>();
    familyData.forEach((person) => {
        const gen = generations.get(person.key) || 0;
        if (!generationGroups.has(gen)) {
            generationGroups.set(gen, []);
        }
        generationGroups.get(gen)!.push(person);
    });

    // 이미 배치된 사람들
    const positioned = new Set<number>();
    const positions = new Map<number, { x: number; y: number }>();

    // 0. 수동 위치가 있는 노드들 미리 배치
    familyData.forEach((person) => {
        if (person.position) {
            positions.set(person.key, person.position);
            positioned.add(person.key);
        }
    });

    // 세대별로 노드 배치
    const sortedGens = Array.from(generationGroups.keys()).sort((a, b) => a - b);

    sortedGens.forEach((gen) => {
        const people = generationGroups.get(gen)!;
        let xOffset = 0;
        const y = gen * VERTICAL_SPACING;

        // 결혼 쌍을 먼저 배치 (수동 위치가 없는 경우에만)
        const pairedPeople = new Set<number>();
        marriagePairs.forEach(([husband, wife]) => {
            if (generations.get(husband.key) !== gen) return;

            // 남편과 아내 각각의 수동 위치 확인
            const husbandHasManualPos = positioned.has(husband.key);
            const wifeHasManualPos = positioned.has(wife.key);

            if (!husbandHasManualPos && !wifeHasManualPos) {
                // 둘 다 수동 위치가 없으면 자동 배치
                positions.set(husband.key, { x: xOffset, y });
                positioned.add(husband.key);
                pairedPeople.add(husband.key);

                positions.set(wife.key, { x: xOffset + NODE_WIDTH + SPOUSE_SPACING, y });
                positioned.add(wife.key);
                pairedPeople.add(wife.key);

                xOffset += (NODE_WIDTH + SPOUSE_SPACING) * 2 + HORIZONTAL_SPACING;
            } else {
                // 한쪽이라도 수동 위치가 있으면 그 사람은 건드리지 않음
                // 수동 위치가 없는 쪽만 배치
                if (!husbandHasManualPos) {
                    positions.set(husband.key, { x: xOffset, y });
                    positioned.add(husband.key);
                    xOffset += NODE_WIDTH + HORIZONTAL_SPACING;
                }
                if (!wifeHasManualPos) {
                    positions.set(wife.key, { x: xOffset, y });
                    positioned.add(wife.key);
                    xOffset += NODE_WIDTH + HORIZONTAL_SPACING;
                }
                pairedPeople.add(husband.key);
                pairedPeople.add(wife.key);
            }
        });

        // 미혼/독신 배치
        people.forEach((person) => {
            if (!positioned.has(person.key)) {
                positions.set(person.key, { x: xOffset, y });
                positioned.add(person.key);
                xOffset += NODE_WIDTH + HORIZONTAL_SPACING;
            }
        });
    });
    // 자녀들을 부모 중앙에 맞추기 (수동 배치된 노드는 제외)
    sortedGens.forEach((gen) => {
        const people = generationGroups.get(gen)!;

        people.forEach((person) => {
            // 수동 위치가 있으면 건드리지 않음
            if (person.position) return;

            if (person.father && person.mother) {
                const fatherPos = positions.get(person.father);
                const motherPos = positions.get(person.mother);

                if (fatherPos && motherPos) {
                    const parentCenterX = (fatherPos.x + motherPos.x) / 2;
                    const currentPos = positions.get(person.key);
                    if (currentPos) {
                        // 자녀들 간의 충돌을 피하면서 중앙 정렬
                        // 수동 위치가 없는 형제들만 고려
                        const siblings = people.filter(
                            (p) => p.father === person.father && p.mother === person.mother && !p.position
                        );
                        const siblingIndex = siblings.findIndex((s) => s.key === person.key);
                        // 형제들 사이의 간격을 부모 너비(노드+부부간격)만큼 확보하여 배우자 추가 시 겹침 방지
                        const siblingOffset = (siblingIndex - (siblings.length - 1) / 2) * (NODE_WIDTH + SPOUSE_SPACING);

                        positions.set(person.key, {
                            x: parentCenterX + siblingOffset,
                            y: currentPos.y,
                        });
                    }
                }
            }
        });
    });

    // 노드 생성
    familyData.forEach((person) => {
        const pos = positions.get(person.key) || { x: 0, y: 0 };

        nodes.push({
            id: String(person.key),
            type: person.gender === 'M' ? 'male' : 'female',
            position: pos,
            data: {
                name: person.name,
                age: person.age,
                deceased: person.deceased,
                attributes: person.attributes || [],
            },
        });
    });

    const marriageNodeMap = new Map<string, string>();

    // 결혼/이혼 엣지 생성 및 MarriageNode 생성
    marriagePairs.forEach(([husband, wife]) => {
        // 어느 한쪽이라도 이혼이면 이혼으로 판단
        const relationStatus = (husband.relationStatus === 'divorced' || wife.relationStatus === 'divorced')
            ? 'divorced'
            : 'married';

        // 이 부부에게 자녀가 있는지 확인
        const hasChildren = familyData.some(
            (child) =>
                (child.father === husband.key && child.mother === wife.key) ||
                (child.father === wife.key && child.mother === husband.key)
        );

        edges.push({
            id: `marriage-${husband.key}-${wife.key}`,
            source: String(husband.key),
            target: String(wife.key),
            sourceHandle: 'right',
            targetHandle: 'left',
            type: relationStatus === 'divorced' ? 'divorced' : 'marriage',
            data: {
                edgeType: relationStatus,
                hasChildren, // 자녀 유무에 따라 수직선 표시
            },
        });

        // MarriageNode 생성 (자녀 연결용)
        const husbandPos = positions.get(husband.key);
        const wifePos = positions.get(wife.key);

        if (husbandPos && wifePos) {
            // 핸들 위치 기준으로 중심점 계산 (MarriageEdge의 수직선과 일치시키기 위함)
            // 남편의 right 핸들: position.x + 60 (아이콘 40px가 노드 80px 중앙에 있으므로 20 + 40 = 60)
            // 아내의 left 핸들: position.x + 20
            const husbandRightHandle = husbandPos.x + 60;
            const wifeLeftHandle = wifePos.x + 20;
            const midX = (husbandRightHandle + wifeLeftHandle) / 2;
            // 핸들 Y 위치는 아이콘 중앙: position.y + 20
            // 부부선 중앙에 MarriageNode 배치 (기울어진 경우 대응을 위해 평균값 사용)
            const husbandCenterY = husbandPos.y + 20;
            const wifeCenterY = wifePos.y + 20;
            const midY = (husbandCenterY + wifeCenterY) / 2;

            const marriageNodeId = `marriage-node-${husband.key}-${wife.key}`;
            marriageNodeMap.set(`${husband.key}-${wife.key}`, marriageNodeId);

            nodes.push({
                id: marriageNodeId,
                type: 'marriageNode',
                position: { x: midX, y: midY }, // 중심점 맞춤 (1x1 크기)
                data: { label: '' },
                style: { width: 1, height: 1, visibility: 'visible' },
            });
        }
    });

    // 부모-자녀 엣지 생성
    familyData.forEach((person) => {
        if (person.father && person.mother) {
            // 부모가 모두 있는 경우 MarriageNode에서 연결
            // 부모 쌍 찾기 (순서 무관 확인 필요하지만 보통 남자가 father)
            let marriageKey = `${person.father}-${person.mother}`;
            // father/mother가 남/여가 바뀔 수 있으므로 확인 필요?
            // 데이터 구조상 father는 남성, mother는 여성 가정.
            // 하지만 marriagePairs는 findMarriagePairs로 구해짐.
            // pair key는 husband-wife 순서임.
            // person.father가 husband인지 mother인지 확인해야 하나,
            // 보통 father=husband.

            // 혹시 모르니 반대 케이스도 고려
            if (!marriageNodeMap.has(marriageKey)) {
                marriageKey = `${person.mother}-${person.father}`;
            }

            if (marriageNodeMap.has(marriageKey)) {
                edges.push({
                    id: `child-${marriageKey}-${person.key}`,
                    source: marriageNodeMap.get(marriageKey)!,
                    target: String(person.key),
                    sourceHandle: 'bottom', // MarriageNode의 bottom handle
                    targetHandle: 'top',
                    type: 'child',
                    style: { stroke: 'gray', strokeWidth: 2 },
                });
            } else {
                // MarriageNode를 못 찾은 경우 (이혼/사별 등으로 pair가 안잡혔을 수도 있음? 
                // findMarriagePairs는 현재 spouse 관계만 찾음.
                // 이혼해도 spouse 관계가 유지되나? types.ts에 relationStatus가 있지만 spouse필드는 유지됨.
                // 만약 spouse 연결이 끊겼다면 기존대로 father->child 연결
                edges.push({
                    id: `child-${person.father}-${person.key}`,
                    source: String(person.father),
                    target: String(person.key),
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                    type: 'child',
                    style: { stroke: 'gray', strokeWidth: 2 },
                });
            }

        } else if (person.father) {
            edges.push({
                id: `child-${person.father}-${person.key}`,
                source: String(person.father),
                target: String(person.key),
                sourceHandle: 'bottom',
                targetHandle: 'top',
                type: 'child',
                style: { stroke: 'gray', strokeWidth: 2 },
            });
        } else if (person.mother) {
            edges.push({
                id: `child-${person.mother}-${person.key}`,
                source: String(person.mother),
                target: String(person.key),
                sourceHandle: 'bottom',
                targetHandle: 'top',
                type: 'child',
                style: { stroke: 'gray', strokeWidth: 2 },
            });
        }
    });

    return { nodes, edges };
}
