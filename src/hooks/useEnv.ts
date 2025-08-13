import { useMemo } from "react";
import { CONFIG } from "../config";

export function useEnv() {
  return useMemo(() => CONFIG, []);
}
