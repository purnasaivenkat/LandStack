import adminDataRaw from '@/public/data/admin_hierarchy.json';

export interface AdminLocationLevel {
  id: string;
  name: string;
  type: 'country' | 'state' | 'district' | 'taluka';
  stateId?: string;
  districtId?: string;
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

export const INDIA_LOCATION: AdminLocationLevel = {
  id: 'country_india',
  name: 'India',
  type: 'country',
  center: [78.9629, 20.5937],
  zoom: 4.5,
  bounds: [[68.1, 6.7], [97.4, 35.7]]
};

interface RawAdminNode {
  id: string;
  name: string;
  type: 'country' | 'state' | 'district' | 'taluka';
  stateId?: string;
  districtId?: string;
  center: [number, number];
  bounds?: [[number, number], [number, number]];
}

interface AdminHierarchyData {
  metadata?: any;
  states: RawAdminNode[];
  districts: RawAdminNode[];
  talukas: RawAdminNode[];
}

const adminData = adminDataRaw as AdminHierarchyData;

const statesCache: AdminLocationLevel[] = (adminData.states || []).map(s => ({
  ...s,
  zoom: 7
}));

const districtsCache: AdminLocationLevel[] = (adminData.districts || []).map(d => ({
  ...d,
  zoom: 10
}));

const talukasCache: AdminLocationLevel[] = (adminData.talukas || []).map(t => ({
  ...t,
  zoom: 13
}));

const allNodesMap = new Map<string, AdminLocationLevel>();
allNodesMap.set(INDIA_LOCATION.id, INDIA_LOCATION);

for (const s of statesCache) allNodesMap.set(s.id, s);
for (const d of districtsCache) allNodesMap.set(d.id, d);
for (const t of talukasCache) allNodesMap.set(t.id, t);

export function getAllStates(): AdminLocationLevel[] {
  return statesCache;
}

export function getDistrictsForState(stateId: string): AdminLocationLevel[] {
  if (!stateId) return [];
  return districtsCache.filter(d => d.stateId === stateId);
}

export function getTalukasForDistrict(districtId: string): AdminLocationLevel[] {
  if (!districtId) return [];
  return talukasCache.filter(t => t.districtId === districtId);
}

export function getAdminLocationById(id: string): AdminLocationLevel | undefined {
  if (!id) return undefined;
  return allNodesMap.get(id);
}
