import type {
  UserProtocolStatus,
  UserGoalType,
} from "../../models/UserProtocol.js";
import type {
  ProtocolStepGroupInput,
  EvidenceRefInput,
  SafetyBucketInput,
} from "./protocolPartsInputs.js";

export interface UserProtocolScalarFields {
  title: string;
  goalType?: UserGoalType;
  status?: UserProtocolStatus;
  sourceProtocolId?: string;
}

export interface UserProtocolScalarUpdateFields {
  title?: string;
  goalType?: UserGoalType;
  status?: UserProtocolStatus;
  sourceProtocolId?: string;
}

/**
 * Create user protocol.
 * userId comes from auth context (NOT input).
 *
 * stepsStructured/evidenceRefs are required for v1? (I recommend optional but default to [])
 */
export interface UserProtocolCreateInput extends UserProtocolScalarFields {
  stepsStructured?: ProtocolStepGroupInput[];
  evidenceRefs?: EvidenceRefInput[];
  safety?: SafetyBucketInput;
}

/**
 * Update user protocol by id.
 * Overwrites stepsStructured/evidenceRefs/safety if provided.
 */
export interface UserProtocolUpdateInput
  extends UserProtocolScalarUpdateFields {
  id: string;

  stepsStructured?: ProtocolStepGroupInput[];
  evidenceRefs?: EvidenceRefInput[];
  safety?: SafetyBucketInput;
}

/**
 * Simple filter + paging (optional; useful immediately for dashboard)
 */
export interface UserProtocolsFilterInput {
  status?: UserProtocolStatus;
  goalType?: UserGoalType;
  search?: string; // title substring
}
