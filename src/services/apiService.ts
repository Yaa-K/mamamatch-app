import { Nurse, RegionRiskCluster } from "../types";

export async function fetchNurses(region?: string, language?: string): Promise<Nurse[]> {
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (language) params.append('language', language);
  
  const res = await fetch(`/api/nurses?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch nurses');
  return res.json();
}

export async function fetchRiskClusters(): Promise<RegionRiskCluster[]> {
  const res = await fetch('/api/risk-clusters');
  if (!res.ok) throw new Error('Failed to fetch risk clusters');
  return res.json();
}
