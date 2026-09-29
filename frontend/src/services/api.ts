import {
  WorkSummary,
  WorkContextGraphResponse,
  DeviceStatus,
  PrivacyState,
  NoriReasoningResponse,
  TimelineEvent,
  SharedWorkspace
} from '../types';

const BASE_URL = 'http://127.0.0.1:8000';

export async function fetchCurrentContext(): Promise<WorkSummary> {
  const res = await fetch(`${BASE_URL}/api/context/current`);
  if (!res.ok) throw new Error('Failed to fetch current context');
  return res.json();
}

export async function fetchGraph(projectId?: string, visibility?: string): Promise<WorkContextGraphResponse> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId);
  if (visibility) params.append('visibility', visibility);
  const res = await fetch(`${BASE_URL}/api/context/graph?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch context graph');
  return res.json();
}

export async function fetchNodeDetails(nodeId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/context/node/${nodeId}`);
  if (!res.ok) throw new Error('Failed to fetch node details');
  return res.json();
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  const res = await fetch(`${BASE_URL}/api/context/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchDeviceStatus(): Promise<DeviceStatus> {
  const res = await fetch(`${BASE_URL}/api/device/status`);
  if (!res.ok) throw new Error('Failed to fetch device status');
  return res.json();
}

export async function fetchPrivacyStatus(): Promise<PrivacyState> {
  const res = await fetch(`${BASE_URL}/api/privacy/status`);
  if (!res.ok) throw new Error('Failed to fetch privacy status');
  return res.json();
}

export async function togglePrivacyPause(): Promise<PrivacyState> {
  const res = await fetch(`${BASE_URL}/api/privacy/toggle_pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle pause');
  return res.json();
}

export async function updatePermissions(perms: Partial<PrivacyState>): Promise<PrivacyState> {
  const res = await fetch(`${BASE_URL}/api/privacy/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perms)
  });
  if (!res.ok) throw new Error('Failed to update permissions');
  return res.json();
}

export async function askNori(query: string): Promise<NoriReasoningResponse> {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(err.detail || 'Failed to process query');
  }
  return res.json();
}

export async function fetchWorkspace(): Promise<SharedWorkspace> {
  const res = await fetch(`${BASE_URL}/api/workspace/current`);
  if (!res.ok) throw new Error('Failed to fetch workspace');
  return res.json();
}

export async function queryWorkspace(query: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/workspace/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to query workspace');
  return res.json();
}

export async function fetchModels(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inference/models`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function runBenchmark(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/inference/benchmark`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run benchmark');
  return res.json();
}
