import type { Person } from '../types/types';
import type { Node, Edge } from '@xyflow/react';

// === Layout Constants ===
const NODE_WIDTH = 80;
// const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 30; // 간격 좁힘 (더 촘촘하게)
const SPOUSE_SPACING = 50;     // 부부 사이 간격
const VERTICAL_SPACING = 150;  // 세대 간격

interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

interface TreeNode {
    person: Person;
    spouse?: Person;
    children: TreeNode[];
    width: number;  // This subtree's total width
    centerX: number; // The center X of the root (or root pair) relative to the subtree's left edge
    x: number;      // Final absolute X
    y: number;      // Final absolute Y
}

// === Main Layout Function ===
export function calculateGenogramLayout(familyData: Person[]): LayoutResult {
    if (familyData.length === 0) return { nodes: [], edges: [] };

    // 1. Data Preparation: Map & Roots
    const personMap = new Map<number, Person>();
    familyData.forEach(p => personMap.set(p.key, p));

    // Find roots: People with no parents in the dataset
    // (Note: If a loop exists, this simple logic might miss nodes, but standard genograms are DAGs)
    const roots = familyData.filter(p => !p.father && !p.mother);

    // If everyone has parents (circular?), pick the one with lowest ID as fallback root
    if (roots.length === 0 && familyData.length > 0) {
        roots.push(familyData.sort((a, b) => a.key - b.key)[0]);
    }

    // Processed set to handle multi-parent links or re-entrant nodes safely (prevent infinite loops)
    const visited = new Set<number>();

    // 2. Build Tree Structure
    // We group by "Family Unit" (Person + Spouse). 
    // If a person is already visited (e.g. as a spouse of someone else), we skip.
    const forest: TreeNode[] = [];

    function buildTree(person: Person): TreeNode | null {
        if (visited.has(person.key)) return null;
        visited.add(person.key);

        const node: TreeNode = {
            person,
            children: [],
            width: 0,
            centerX: 0,
            x: 0,
            y: 0
        };

        // Find Spouse
        // Priority: Explicit spouse field. 
        // Note: We only handle ONE main spouse for the tree layout to keep it simple.
        // Complex multiple marriages would require a more advanced graph layout.
        if (person.spouse) {
            const spouse = personMap.get(person.spouse);
            if (spouse && !visited.has(spouse.key)) {
                node.spouse = spouse;
                visited.add(spouse.key);
            }
        }

        // Find Children
        // Children of this person OR this person's spouse
        const children = familyData.filter(p => {
            const isChildOfPerson = p.father === person.key || p.mother === person.key;
            const isChildOfSpouse = node.spouse && (p.father === node.spouse.key || p.mother === node.spouse.key);
            return isChildOfPerson || isChildOfSpouse;
        });

        // Recursively build children
        children.forEach(child => {
            const childNode = buildTree(child);
            if (childNode) {
                node.children.push(childNode);
            }
            // If child was already visited (e.g. child of both parents), buildTree returns null, which is correct.
        });

        return node;
    }

    roots.forEach(root => {
        const tree = buildTree(root);
        if (tree) forest.push(tree);
    });

    // Handle disconnected nodes (orphans or separate families not linked to roots)
    familyData.forEach(p => {
        if (!visited.has(p.key)) {
            const tree = buildTree(p);
            if (tree) forest.push(tree);
        }
    });

    // 3. Calculate Sizes (Bottom-Up)
    function calculateSize(node: TreeNode) {
        // Recurse first
        node.children.forEach(calculateSize);

        // A. Parents Width
        const parentsWidth = node.spouse
            ? NODE_WIDTH + SPOUSE_SPACING + NODE_WIDTH
            : NODE_WIDTH;

        // B. Children Width
        let childrenTotalWidth = 0;
        if (node.children.length > 0) {
            node.children.forEach(c => {
                childrenTotalWidth += c.width + HORIZONTAL_SPACING;
            });
            childrenTotalWidth -= HORIZONTAL_SPACING; // Remove last gap
        }

        // C. Final Dimension
        // The node needs enough space for itself AND its children.
        node.width = Math.max(parentsWidth, childrenTotalWidth);

        // D. Center X Calculation
        // center X is the offset from the left edge of 'node.width' where the main parent node should be placed.
        // If children are wider, parents are centered over children.
        // If parents are wider, children are centered under parents.
        if (childrenTotalWidth > parentsWidth) {
            node.centerX = childrenTotalWidth / 2;
        } else {
            node.centerX = parentsWidth / 2;
        }
    }

    forest.forEach(calculateSize);

    // 4. Assign Absolute Positions (Top-Down)
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const marriageNodeMap = new Map<string, string>(); // key: "p1-p2", value: nodeId

    function layoutNode(node: TreeNode, x: number, y: number) {
        node.x = x;
        node.y = y;

        // Position Parent(s)
        let mainPersonX: number;
        let spouseX: number | null = null;

        // Determine left start position for parents to be centered in node.width
        // node.centerX is the center point.
        // Parent block width is (NODE + SPOUSE_GAP + NODE) or (NODE).
        // We want Center(ParentBlock) == node.centerX + x

        const parentsWidth = node.spouse
            ? NODE_WIDTH + SPOUSE_SPACING + NODE_WIDTH
            : NODE_WIDTH;

        const parentsLeft = x + node.centerX - (parentsWidth / 2);

        // --- Create Main Person Node ---
        mainPersonX = parentsLeft;

        // Manual override? (Only if single selection move logic is not desired, but here we strictly auto-layout)
        // If we want to respect manual positions, we would check person.position here.
        // But "Auto Layout" implies resetting positions. We'll use the calculated ones.

        // 노드 타입 결정: Gender 및 birthStatus 기반
        const getNodeType = (person: Person): string => {
            // birthStatus가 있고 pregnancy/miscarriage/abortion이면 pregnancy 노드
            if (person.birthStatus && person.birthStatus !== 'normal') {
                return 'pregnancy';
            }
            switch (person.gender) {
                case 'M': return 'male';
                case 'F': return 'female';
                case 'U': return 'unknown';
                case 'P': return 'pet';
                default: return 'male';
            }
        };

        nodes.push({
            id: String(node.person.key),
            type: getNodeType(node.person),
            position: { x: mainPersonX, y: y },
            data: {
                name: node.person.name,
                gender: node.person.gender,
                age: node.person.age,
                deceased: node.person.deceased,
                isAdopted: node.person.isAdopted,
                isFoster: node.person.isFoster,
                birthStatus: node.person.birthStatus,
                attributes: node.person.attributes || [],
            },
        });

        // --- Create Spouse Node ---
        if (node.spouse) {
            spouseX = mainPersonX + NODE_WIDTH + SPOUSE_SPACING;
            nodes.push({
                id: String(node.spouse.key),
                type: getNodeType(node.spouse),
                position: { x: spouseX, y: y },
                data: {
                    name: node.spouse.name,
                    gender: node.spouse.gender,
                    age: node.spouse.age,
                    deceased: node.spouse.deceased,
                    isAdopted: node.spouse.isAdopted,
                    isFoster: node.spouse.isFoster,
                    birthStatus: node.spouse.birthStatus,
                    attributes: node.spouse.attributes || [],
                },
            });

            // Create Marriage Edge & Node
            createMarriageCheck(node.person, node.spouse, mainPersonX, spouseX, y, nodes, edges, marriageNodeMap);
        }

        // --- Position Children ---
        if (node.children.length > 0) {
            // Children start X based on centering under this node
            let currentChildX = x + (node.width / 2) - (getChildrenTotalWidth(node) / 2);
            const childY = y + VERTICAL_SPACING;

            // Group children logic (Twin Handling)
            const groups = groupChildrenByTwin(node.children);

            groups.forEach(group => {
                // If single child or no twin group (0 is falsy, but twinGroup is number | null)
                // Assuming twinGroup is positive integer.
                if (group.length === 1 || !group[0].person.twinGroup) {
                    group.forEach(child => {
                        layoutNode(child, currentChildX, childY);
                        createChildEdge(node, child, marriageNodeMap, edges);
                        currentChildX += child.width + HORIZONTAL_SPACING;
                    });
                } else {
                    // Twin Group
                    const twinTrees = group;
                    twinTrees.forEach(child => {
                        layoutNode(child, currentChildX, childY);
                        currentChildX += child.width + HORIZONTAL_SPACING;
                    });
                    createTwinEdges(node, twinTrees, marriageNodeMap, nodes, edges);
                }
            });
        }
    }

    function getChildrenTotalWidth(node: TreeNode): number {
        if (node.children.length === 0) return 0;
        let w = 0;
        node.children.forEach(c => w += c.width + HORIZONTAL_SPACING);
        return w - HORIZONTAL_SPACING;
    }

    // Run Layout for each tree in forest
    let currentX = 0;
    forest.forEach(tree => {
        layoutNode(tree, currentX, 0);
        currentX += tree.width + 100; // Gap between separate family trees
    });

    return { nodes, edges };
}


// === Helpers for Edge Generation ===

function createMarriageCheck(
    p1: Person,
    p2: Person,
    x1: number,
    x2: number,
    y: number,
    nodes: Node[],
    edges: Edge[],
    marriageNodeMap: Map<string, string>
) {
    // Relationship Status
    const relationStatus = (p1.relationStatus === 'divorced' || p2.relationStatus === 'divorced') ? 'divorced' : 'married';

    // Check if they really have an edge? Yes, they are spouse pair in the tree.
    const k1 = p1.key;
    const k2 = p2.key;

    // Edge ID
    const edgeId = `marriage-${k1}-${k2}`;

    edges.push({
        id: edgeId,
        source: String(k1),
        target: String(k2),
        sourceHandle: 'right',
        targetHandle: 'left',
        type: relationStatus === 'divorced' ? 'divorced' : 'marriage',
        data: {
            edgeType: relationStatus,
            hasChildren: true, // We assume true for layout visualization or check actual children
        },
    });

    // Marriage Node (Anchor for children)
    // Position: Middle of the marriage line
    // Handle Offsets: Right handle is +60, Left handle is +20 relative to Node Position?
    // Wait, Generic node: width 80.
    // Right handle (source) is commonly at x=80? No, checking MaleNode/FemaleNode CSS/logic.
    // Assuming Handles are at standard positions: Right of LeftNode, Left of RightNode.
    // Let's rely on geometric center for the MarriageNode.

    // MaleNode width 80. handle at right.
    // Spouse spacing 50.
    // Line length = 50. Midpoint = 25 from Male Right.
    // Male Left = x1. Male Right = x1 + 80.
    // Midpoint X = x1 + 80 + (x2 - (x1 + 80)) / 2 = x1 + 80 + (x2 - x1 - 80)/2
    // Simplify: (x1 + 80 + x2) / 2.
    // Check handles: If handle is inset, visual line is shorter.
    // Re-using logic from original:
    // husbandRightHandle = husbandPos.x + 60;
    // wifeLeftHandle = wifePos.x + 20;

    const midX = (x1 + 60 + x2 + 20) / 2;
    const midY = y + 20; // Center of node height (40px icon centered in 80px box? or just +20?) 
    // Logic from original: y + 20.

    const mNodeId = `marriage-node-${k1}-${k2}`;
    marriageNodeMap.set(`${k1}-${k2}`, mNodeId);
    marriageNodeMap.set(`${k2}-${k1}`, mNodeId); // Bi-directional lookup

    nodes.push({
        id: mNodeId,
        type: 'marriageNode',
        position: { x: midX, y: midY },
        data: { label: '' },
        style: { width: 1, height: 1, visibility: 'visible' },
    });
}

function createChildEdge(
    parentTree: TreeNode,
    childTree: TreeNode,
    marriageNodeMap: Map<string, string>,
    edges: Edge[]
) {
    const child = childTree.person;

    let sourceId: string;
    let sourceHandle = 'bottom';

    // If parent has spouse, link from MarriageNode
    if (parentTree.spouse) {
        const mKey = `${parentTree.person.key}-${parentTree.spouse.key}`;
        if (marriageNodeMap.has(mKey)) {
            sourceId = marriageNodeMap.get(mKey)!;
        } else {
            // Fallback (should not happen if created correctly)
            sourceId = String(parentTree.person.key);
        }
    } else {
        // Single parent
        sourceId = String(parentTree.person.key);
    }

    edges.push({
        id: `child-${sourceId}-${child.key}`,
        source: sourceId,
        target: String(child.key),
        sourceHandle: sourceHandle,
        targetHandle: 'top',
        type: 'child',
        style: { stroke: 'gray', strokeWidth: 2 },
        data: {
            isAdopted: child.isAdopted,
            isFoster: child.isFoster,
        },
    });
}

function groupChildrenByTwin(children: TreeNode[]): TreeNode[][] {
    const map = new Map<number, TreeNode[]>();
    const singles: TreeNode[] = [];

    // Separate twins and singles
    children.forEach(c => {
        if (c.person.twinGroup) {
            if (!map.has(c.person.twinGroup)) map.set(c.person.twinGroup, []);
            map.get(c.person.twinGroup)!.push(c);
        } else {
            singles.push(c);
        }
    });

    const groups: TreeNode[][] = [];
    // Add twins groups
    map.forEach(g => groups.push(g));
    // Add singles as individual groups
    singles.forEach(s => groups.push([s]));

    // Sort groups by age (oldest first/left)
    groups.sort((a, b) => {
        const ageA = a[0].person.age || 0;
        const ageB = b[0].person.age || 0;
        return ageB - ageA;
    });

    return groups;
}

function createTwinEdges(
    parentTree: TreeNode,
    twins: TreeNode[],
    marriageNodeMap: Map<string, string>,
    nodes: Node[],
    edges: Edge[]
) {
    if (twins.length === 0) return;

    // 1. Calculate Source Point
    let sourceId: string;

    if (parentTree.spouse) {
        const mKey = `${parentTree.person.key}-${parentTree.spouse.key}`;
        if (marriageNodeMap.has(mKey)) {
            sourceId = marriageNodeMap.get(mKey)!;
        } else {
            sourceId = String(parentTree.person.key);
        }
    } else {
        sourceId = String(parentTree.person.key);
    }

    // 2. 쌍둥이 ID 배열 생성
    const twinIds = twins.map(t => String(t.person.key));
    const isIdentical = twins[0].person.isIdenticalTwin || false;

    // 3. 하나의 TwinEdge로 전체 그룹 연결
    edges.push({
        id: `twin-group-${twins[0].person.key}`,
        source: sourceId,
        target: twinIds[0],
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'twin',
        data: {
            twinIds: twinIds,
            isIdentical: isIdentical
        },
        style: { stroke: 'black', strokeWidth: 2 }
    });


    // 4. 일란성 쌍둥이인 경우: 도형(노드) 끼리 직접 연결하는 수평선 추가
    if (isIdentical && twins.length > 1) {
        for (let i = 0; i < twins.length - 1; i++) {
            const current = twins[i].person;
            const next = twins[i + 1].person;

            edges.push({
                id: `identical-link-${current.key}-${next.key}`,
                source: String(current.key),
                target: String(next.key),
                sourceHandle: 'right', // 왼쪽 노드의 오른쪽 핸들
                targetHandle: 'left',  // 오른쪽 노드의 왼쪽 핸들
                type: 'default',       // 일반 직선
                style: { stroke: 'black', strokeWidth: 2 },
            });
        }
    }
}
