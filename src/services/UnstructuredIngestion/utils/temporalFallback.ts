import { TemporalStamp } from "../DocumentWrite/types.js";

export function edgeStampOrDefault(
    stamp:
      | Partial<{
          validAt?: string | null;
          expiredAt?: string | null;
          invalidAt?: string | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        }>
      | undefined,
    fallback: TemporalStamp
  ): TemporalStamp {
    return {
      validAt: (stamp?.validAt ?? fallback.validAt) as string,
      expiredAt: (stamp?.expiredAt ?? fallback.expiredAt) ?? null,
      invalidAt: (stamp?.invalidAt ?? fallback.invalidAt) ?? null,
      createdAt: (stamp?.createdAt ?? fallback.createdAt) as string,
      updatedAt: (stamp?.updatedAt ?? fallback.updatedAt) as string,
    };
  }
  