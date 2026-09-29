export type NoriState = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'speaking'
  | 'observing' 
  | 'processing' 
  | 'ready' 
  | 'paused' 
  | 'sleeping'
  | 'collaborating';

export interface ContextNode {
  id: string;
  project_id: string;
  type: 'project' | 'task' | 'file' | 'document' | 'physical_object' | 'process' | 'issue' | 'decision';
  name: string;
  category: 'digital' | 'physical' | 'device' | 'temporal' | 'issue' | 'decision';
  metadata: Record<string, any>;
  confidence: number;
  source: string;
  visibility: 'private' | 'shared';
  created_at?: string;
  updated_at?: string;
}

export interface ContextEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: 'BELONGS_TO' | 'USES' | 'RELATED_TO' | 'CAUSED' | 'RESOLVES' | 'BLOCKED_BY' | 'DETECTED_NEAR' | 'RUN_BY' | 'MODIFIED';
  confidence: number;
  evidence: string[];
  visibility: 'private' | 'shared';
  created_at?: string;
}

export interface WorkContextGraphResponse {
  project_id: string;
  project_name: string;
  nodes: ContextNode[];
  edges: ContextEdge[];
}

export interface WorkSummary {
  project_id: string | null;
  project_name: string;
  active_application?: string;
  active_file?: string | null;
  current_task: string | null;
  current_issue: string | null;
  issue_details?: string | null;
  digital_context: string[];
  physical_context: string[];
  device_context: string[];
  total_nodes: number;
  total_edges: number;
}

export interface NpuCapability {
  is_available: boolean;
  runtime_name: string;
  device_name: string;
  supported_providers: string[];
  quantization_formats: string[];
  status_reason: string;
}

export interface ProcessWorkload {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
  project_association: string | null;
  role_description: string | null;
}

export interface HardwarePrecautions {
  has_warning: boolean;
  warning_type?: 'battery_low' | 'cpu_overheating' | 'ram_critical' | 'none' | null;
  headline?: string | null;
  detail?: string | null;
  suggested_action?: string | null;
}

export interface DeviceStatus {
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  battery_percent: number | null;
  power_plugged: boolean | null;
  platform: string;
  processor: string;
  architecture: string;
  npu: NpuCapability;
  active_workloads: ProcessWorkload[];
  precautions?: HardwarePrecautions;
  timestamp: number;
}

export interface PrivacyState {
  is_paused: boolean;
  camera_enabled: boolean;
  microphone_enabled: boolean;
  filesystem_enabled: boolean;
  process_telemetry_enabled: boolean;
  browser_context_enabled: boolean;
  screen_capture_enabled: boolean;
  network_collaboration_enabled: boolean;
  redact_sensitive_credentials: boolean;
  allowed_project_paths: string[];
}

export interface VisualEvidenceItem {
  title: string;
  verified: boolean;
  detail: string;
  source: string;
}

export interface VisualBreakdownCard {
  category: string;
  title: string;
  items: string[];
  metrics: Record<string, any>;
  accent_color: string;
}

export interface NoriReasoningResponse {
  query: string;
  headline: string;
  summary: string;
  confidence: number;
  breakdowns: VisualBreakdownCard[];
  evidence_chain: VisualEvidenceItem[];
  suggested_actions: string[];
  resumable_workspace?: {
    project_name: string;
    project_path: string;
    files_to_open: string[];
    active_task: string;
    last_cursor_line: string;
    terminal_command: string;
  } | null;
  execution_time_ms: number;
  provider_used: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  event_type: string;
  source: string;
  summary: string;
  payload: string;
  confidence: number;
  timestamp: string;
}

export interface NoriPeer {
  id: string;
  name: string;
  owner: string;
  role: string;
  device_model: string;
  npu_status: string;
  npu_utilization: number;
  cpu_utilization: number;
  active_task: string;
  status: 'online' | 'busy' | 'offline';
}

export interface TeamActivityEvent {
  id: string;
  peer_name: string;
  event_type: string;
  summary: string;
  timestamp: string;
}

export interface SharedWorkspace {
  id: string;
  name: string;
  description: string;
  peers: NoriPeer[];
  shared_tasks: string[];
  unresolved_blockers: string[];
  recent_activity: TeamActivityEvent[];
}
