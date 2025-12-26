import {
  Kind,
  parse,
  type DocumentNode,
  type OperationDefinitionNode,
  type FragmentDefinitionNode,
  type SelectionNode,
} from "graphql";

export function getOperationDefinition(
  doc: DocumentNode,
  operationName?: string | null
): OperationDefinitionNode | undefined {
  const ops = doc.definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION
  );
  if (ops.length === 0) return undefined;
  if (!operationName) return ops[0];
  return ops.find((op) => op.name?.value === operationName) ?? ops[0];
}

function buildFragmentMap(
  doc: DocumentNode
): Map<string, FragmentDefinitionNode> {
  const map = new Map<string, FragmentDefinitionNode>();
  for (const def of doc.definitions) {
    if (def.kind === Kind.FRAGMENT_DEFINITION) {
      map.set(def.name.value, def);
    }
  }
  return map;
}

function collectRootFieldNames(params: {
  doc: DocumentNode;
  operationName?: string | null;
}): string[] {
  const { doc, operationName } = params;
  const op = getOperationDefinition(doc, operationName);
  if (!op) return [];

  const fragments = buildFragmentMap(doc);
  const out: string[] = [];

  const visitSelections = (selections: readonly SelectionNode[]) => {
    for (const sel of selections) {
      if (sel.kind === Kind.FIELD) {
        out.push(sel.name.value);
      } else if (sel.kind === Kind.INLINE_FRAGMENT) {
        visitSelections(sel.selectionSet.selections);
      } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
        const frag = fragments.get(sel.name.value);
        if (frag) visitSelections(frag.selectionSet.selections);
      }
    }
  };

  visitSelections(op.selectionSet.selections);
  return out;
}

export function computeOperationCost(params: {
  document?: DocumentNode | null;
  query?: string | null;
  operationName?: string | null;
  costByRootField: Record<string, number>;
  defaultCost?: number;

  maxRootsToConsider?: number;
}): { rootFields: string[]; cost: number } {
  const {
    document,
    query,
    operationName,
    costByRootField,
    defaultCost = 2,
    maxRootsToConsider = 50,
  } = params;

  let doc = document ?? undefined;
  if (!doc && query) {
    try {
      doc = parse(query);
    } catch {
      return { rootFields: ["anonymous"], cost: defaultCost };
    }
  }
  if (!doc) return { rootFields: ["anonymous"], cost: defaultCost };

  const roots = collectRootFieldNames({ doc, operationName }).slice(
    0,
    maxRootsToConsider
  );
  if (roots.length === 0)
    return { rootFields: ["anonymous"], cost: defaultCost };

  const cost = roots.reduce(
    (sum, f) => sum + (costByRootField[f] ?? defaultCost),
    0
  );
  return { rootFields: roots, cost };
}
