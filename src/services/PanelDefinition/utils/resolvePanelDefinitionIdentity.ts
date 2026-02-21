import { PanelDefinitionIdentifier, PanelDefinitionIdentifierKey } from "../types.js";

export function resolvePanelDefinitionIdentifier(params: {
  panelDefinitionId?: string | null;
  canonicalName?: string | null;
}): { key: PanelDefinitionIdentifierKey; value: string } {
  if (params.panelDefinitionId) {
    return { key: "panelDefinitionId", value: params.panelDefinitionId };
  }
  if (params.canonicalName) {
    return { key: "canonicalName", value: params.canonicalName };
  }
  throw new Error("PanelDefinition identifier required: panelDefinitionId or canonicalName");
}
