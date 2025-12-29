/**
 * v1 weights: tune later
 */
export const activityWeights: Record<string, number> = {
  VIEW_ENTITY: 2,
  CLICK_EVIDENCE: 3,
  OPEN_EPISODE: 1,
  PLAY_EPISODE: 1,
  APPLY_PROTOCOL: 4,
};

export const BASE_SAVED_WEIGHT = 10;

// "Goal alignment prior" (system protocols)
export const GOAL_PRIOR_PER_PRIORITY_POINT = 4; // increase to favor goal-fit protocols more
export const GOAL_MATCH_BONUS = 2; // small bonus per matching category

// Trending prior
export const TRENDING_PRIOR_CAP = 3; // cap how much trending can add per item

// Limits
export const MAX_PROTOCOL_GOAL_SEED = 60; // how many goal-aligned protocols to seed before personalization signals
export const MAX_ITEMS = 50;
