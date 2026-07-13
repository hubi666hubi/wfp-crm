export interface KnowledgeNode {
  id: string;
  agentId: string;
  topic: string;
  summary: string;
  createdAt: string;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  strength: number;
}

export class SwarmKnowledgeGraph {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly edges = new Map<string, KnowledgeEdge>();

  upsertNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
  }

  linkNodes(fromId: string, toId: string, strength: number): void {
    const key = `${fromId}->${toId}`;
    this.edges.set(key, { from: fromId, to: toId, strength });
  }

  getNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): KnowledgeEdge[] {
    return Array.from(this.edges.values());
  }
}
