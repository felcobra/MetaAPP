import type { OrgNode } from "@/types/orgchart";

export const NODE_WIDTH = 192;
export const NODE_HEIGHT = 76;
const H_GAP = 24;
const V_GAP = 132;

export interface LaidOutNode {
  node: OrgNode;
  x: number;
  y: number;
  depth: number;
}

export interface OrgEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface OrgLayout {
  nodes: LaidOutNode[];
  edges: OrgEdge[];
  width: number;
  height: number;
}

export function layoutOrgTree(root: OrgNode): OrgLayout {
  const nodes: LaidOutNode[] = [];
  const edges: OrgEdge[] = [];
  let cursorX = 0;

  function place(node: OrgNode, depth: number): number {
    const children = node.children ?? [];
    let centerX: number;

    if (children.length === 0) {
      centerX = cursorX + NODE_WIDTH / 2;
      cursorX += NODE_WIDTH + H_GAP;
    } else {
      const childCenters = children.map((child) => place(child, depth + 1));
      centerX = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    }

    const y = depth * V_GAP;
    nodes.push({ node, x: centerX, y, depth });

    for (const child of children) {
      const childLayout = nodes.find((entry) => entry.node.id === child.id);
      if (childLayout) {
        edges.push({
          from: { x: centerX, y: y + NODE_HEIGHT },
          to: { x: childLayout.x, y: childLayout.y },
        });
      }
    }

    return centerX;
  }

  place(root, 0);

  // cursorX carries a trailing H_GAP from the last leaf; dropping it makes the
  // measured width match the real tree, so the canvas centres it without drift.
  const width = Math.max(cursorX - H_GAP, NODE_WIDTH);
  const maxDepth = Math.max(...nodes.map((entry) => entry.depth));
  const height = maxDepth * V_GAP + NODE_HEIGHT;

  return { nodes, edges, width, height };
}
