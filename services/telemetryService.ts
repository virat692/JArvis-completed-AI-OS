/**
 * JARVIS Real Telemetry Service
 * Strict Zero-Fabrication Hardware Telemetry Engine
 * 
 * Rules:
 * 1. ZERO FAKE DATA: Never generate random/simulated numbers (Math.random) for hardware metrics.
 * 2. BROWSER MODE: When running in browser / Google AI Studio environment without a local bridge,
 *    hardware metrics (CPU, RAM, GPU, Disk, Processes, Temp) are explicitly flagged as UNAVAILABLE (N/A).
 * 3. LOCAL DEVICE MODE: When connected to the local JARVIS bridge (FastAPI/Native OS Daemon on localhost:8000),
 *    queries actual OS APIs for real device metrics.
 * 4. SOURCE TRANSPARENCY: Every consumer component displays clear source indicator badges
 *    ("BROWSER MODE: Telemetry Unavailable" vs "LOCAL DEVICE: Real Hardware Telemetry").
 */

import { eventBus } from './eventBus';

export type TelemetryEnvironment = 'BROWSER_SANDBOX' | 'LOCAL_DEVICE';

export interface MetricField<T> {
  value: T | null;
  status: 'available' | 'unavailable' | 'unsupported' | 'permission_required';
  display: string;
}

export interface DeviceTelemetryState {
  environment: TelemetryEnvironment;
  isConnectedToLocalBridge: boolean;
  statusLabel: string;
  sourceDescription: string;
  lastUpdated: number | null;
  
  // Hardware Metrics (Strict: null if in browser or unavailable)
  cpu: {
    usagePercent: MetricField<number>;
    cores: MetricField<number>;
    model: MetricField<string>;
    temperatureC: MetricField<number>;
  };
  memory: {
    usedBytes: MetricField<number>;
    totalBytes: MetricField<number>;
    usedPercent: MetricField<number>;
    summary: MetricField<string>;
  };
  gpu: {
    name: MetricField<string>;
    usagePercent: MetricField<number>;
    memoryUsedPercent: MetricField<number>;
  };
  disk: {
    usedPercent: MetricField<number>;
    freeSpace: MetricField<string>;
    driveLabel: MetricField<string>;
  };
  battery: {
    percent: MetricField<number>;
    isCharging: MetricField<boolean>;
  };
  network: {
    isOnline: boolean;
    effectiveType: MetricField<string>;
    downlinkMbps: MetricField<number>;
    rttMs: MetricField<number>;
  };
  system: {
    os: MetricField<string>;
    platform: MetricField<string>;
    uptimeSeconds: MetricField<number>;
    hostname: MetricField<string>;
  };
  processes: {
    count: MetricField<number>;
    list: Array<{ pid: number; name: string; cpu: string; memory: string; status: string }>;
    status: 'available' | 'unavailable' | 'permission_required';
  };
}

const BRIDGE_BASE_URL = 'http://localhost:8000';

class TelemetryService {
  private state: DeviceTelemetryState;
  private listeners: Set<(state: DeviceTelemetryState) => void> = new Set();
  private pollInterval: any = null;
  private isChecking: boolean = false;

  constructor() {
    this.state = this.createDefaultBrowserState();
    this.initBrowserReadings();
    this.startDetectionLoop();
  }

  private createDefaultBrowserState(): DeviceTelemetryState {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const platform = typeof navigator !== 'undefined' ? (navigator.platform || navigator.userAgent) : 'Browser Environment';

    return {
      environment: 'BROWSER_SANDBOX',
      isConnectedToLocalBridge: false,
      statusLabel: 'BROWSER MODE',
      sourceDescription: 'Running in Browser Mode — Hardware telemetry unavailable (Google AI Studio)',
      lastUpdated: Date.now(),
      
      cpu: {
        usagePercent: { value: null, status: 'unavailable', display: 'N/A' },
        cores: { 
          value: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : null, 
          status: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? 'available' : 'unavailable',
          display: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'N/A'
        },
        model: { value: null, status: 'unavailable', display: 'Unavailable' },
        temperatureC: { value: null, status: 'unavailable', display: 'N/A' }
      },
      memory: {
        usedBytes: { value: null, status: 'unavailable', display: 'N/A' },
        totalBytes: { value: null, status: 'unavailable', display: 'N/A' },
        usedPercent: { value: null, status: 'unavailable', display: 'N/A' },
        summary: { value: null, status: 'unavailable', display: 'Telemetry Unavailable in Browser' }
      },
      gpu: {
        name: { value: null, status: 'unavailable', display: 'Unavailable' },
        usagePercent: { value: null, status: 'unavailable', display: 'N/A' },
        memoryUsedPercent: { value: null, status: 'unavailable', display: 'N/A' }
      },
      disk: {
        usedPercent: { value: null, status: 'unavailable', display: 'N/A' },
        freeSpace: { value: null, status: 'unavailable', display: 'Unavailable' },
        driveLabel: { value: null, status: 'unavailable', display: 'N/A' }
      },
      battery: {
        percent: { value: null, status: 'unavailable', display: 'N/A' },
        isCharging: { value: null, status: 'unavailable', display: 'N/A' }
      },
      network: {
        isOnline,
        effectiveType: { value: null, status: 'unavailable', display: 'N/A' },
        downlinkMbps: { value: null, status: 'unavailable', display: 'N/A' },
        rttMs: { value: null, status: 'unavailable', display: 'N/A' }
      },
      system: {
        os: { value: 'Web Browser / AI Studio', status: 'available', display: 'Browser Runtime' },
        platform: { value: platform, status: 'available', display: platform.substring(0, 32) },
        uptimeSeconds: { value: null, status: 'unavailable', display: 'N/A' },
        hostname: { value: 'Web Client', status: 'available', display: 'Web Sandbox' }
      },
      processes: {
        count: { value: null, status: 'unavailable', display: 'N/A' },
        list: [],
        status: 'unavailable'
      }
    };
  }

  /**
   * Initializes any genuinely accessible browser APIs (like real battery and network status)
   * without creating simulated numbers.
   */
  private async initBrowserReadings(): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // 1. Browser Online/Offline listeners
    window.addEventListener('online', () => {
      this.state.network.isOnline = true;
      this.notifyListeners();
    });
    window.addEventListener('offline', () => {
      this.state.network.isOnline = false;
      this.notifyListeners();
    });

    // 2. Real Browser Network Connection API (if supported)
    try {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.effectiveType) {
          this.state.network.effectiveType = { value: conn.effectiveType, status: 'available', display: String(conn.effectiveType).toUpperCase() };
        }
        if (typeof conn.downlink === 'number') {
          this.state.network.downlinkMbps = { value: conn.downlink, status: 'available', display: `${conn.downlink} Mbps` };
        }
        if (typeof conn.rtt === 'number') {
          this.state.network.rttMs = { value: conn.rtt, status: 'available', display: `${conn.rtt} ms` };
        }
        conn.addEventListener('change', () => {
          if (conn.downlink) this.state.network.downlinkMbps = { value: conn.downlink, status: 'available', display: `${conn.downlink} Mbps` };
          if (conn.rtt) this.state.network.rttMs = { value: conn.rtt, status: 'available', display: `${conn.rtt} ms` };
          this.notifyListeners();
        });
      }
    } catch {
      // Not supported in this browser
    }

    // 3. Real Browser Battery API (if genuinely supported and permitted)
    try {
      if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
        const batteryManager = await (navigator as any).getBattery();
        if (batteryManager) {
          const updateBattery = () => {
            const level = Math.round(batteryManager.level * 100);
            const charging = batteryManager.charging;
            this.state.battery.percent = { value: level, status: 'available', display: `${level}%` };
            this.state.battery.isCharging = { value: charging, status: 'available', display: charging ? 'Charging' : 'Discharging' };
            this.notifyListeners();
          };
          updateBattery();
          batteryManager.addEventListener('levelchange', updateBattery);
          batteryManager.addEventListener('chargingchange', updateBattery);
        }
      }
    } catch {
      // Battery API not available
    }

    this.notifyListeners();
  }

  /**
   * Continuous Bridge Detection Loop
   * Checks if local JARVIS daemon is running on localhost:8000.
   */
  private startDetectionLoop(): void {
    this.pollBridge();
    this.pollInterval = setInterval(() => {
      this.pollBridge();
    }, 4000);
  }

  /**
   * Polls the local backend. If active, updates real device telemetry.
   * If offline, switches state to BROWSER_SANDBOX with clean N/A metrics.
   */
  public async pollBridge(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${BRIDGE_BASE_URL}/telemetry`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.applyLocalDeviceData(data);
      } else {
        this.applyBrowserSandboxState();
      }
    } catch {
      // Local bridge is not running (Normal in Web / AI Studio)
      this.applyBrowserSandboxState();
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Applies verified local OS data from local daemon
   */
  private applyLocalDeviceData(data: any): void {
    const wasConnected = this.state.isConnectedToLocalBridge;

    this.state.environment = 'LOCAL_DEVICE';
    this.state.isConnectedToLocalBridge = true;
    this.state.statusLabel = 'LOCAL DEVICE';
    this.state.sourceDescription = 'Connected to Local Device — Real hardware telemetry active';
    this.state.lastUpdated = Date.now();

    // CPU
    if (typeof data.cpu_usage_percent === 'number') {
      this.state.cpu.usagePercent = { value: data.cpu_usage_percent, status: 'available', display: `${Math.round(data.cpu_usage_percent)}%` };
    } else {
      this.state.cpu.usagePercent = { value: null, status: 'unavailable', display: 'N/A' };
    }
    if (data.cpu_cores) {
      this.state.cpu.cores = { value: data.cpu_cores, status: 'available', display: `${data.cpu_cores} Cores` };
    }
    if (data.cpu_model) {
      this.state.cpu.model = { value: data.cpu_model, status: 'available', display: data.cpu_model };
    }
    if (typeof data.cpu_temp_c === 'number') {
      this.state.cpu.temperatureC = { value: data.cpu_temp_c, status: 'available', display: `${data.cpu_temp_c}°C` };
    } else {
      this.state.cpu.temperatureC = { value: null, status: 'unsupported', display: 'Unavailable' };
    }

    // Memory
    if (typeof data.memory_used_percent === 'number') {
      this.state.memory.usedPercent = { value: data.memory_used_percent, status: 'available', display: `${Math.round(data.memory_used_percent)}%` };
    }
    if (data.memory_summary) {
      this.state.memory.summary = { value: data.memory_summary, status: 'available', display: data.memory_summary };
    }

    // GPU
    if (typeof data.gpu_usage_percent === 'number') {
      this.state.gpu.usagePercent = { value: data.gpu_usage_percent, status: 'available', display: `${Math.round(data.gpu_usage_percent)}%` };
    } else {
      this.state.gpu.usagePercent = { value: null, status: 'unsupported', display: 'N/A' };
    }
    if (data.gpu_name) {
      this.state.gpu.name = { value: data.gpu_name, status: 'available', display: data.gpu_name };
    }

    // Disk
    if (typeof data.disk_used_percent === 'number') {
      this.state.disk.usedPercent = { value: data.disk_used_percent, status: 'available', display: `${Math.round(data.disk_used_percent)}%` };
    }
    if (data.disk_free) {
      this.state.disk.freeSpace = { value: data.disk_free, status: 'available', display: data.disk_free };
    }

    // Battery
    if (typeof data.battery_percent === 'number') {
      this.state.battery.percent = { value: data.battery_percent, status: 'available', display: `${data.battery_percent}%` };
      this.state.battery.isCharging = { value: !!data.battery_charging, status: 'available', display: data.battery_charging ? 'Charging' : 'On Battery' };
    }

    // System
    if (data.os_version) {
      this.state.system.os = { value: data.os_version, status: 'available', display: data.os_version };
    }
    if (typeof data.uptime_seconds === 'number') {
      this.state.system.uptimeSeconds = { value: data.uptime_seconds, status: 'available', display: `${data.uptime_seconds}s` };
    }
    if (data.hostname) {
      this.state.system.hostname = { value: data.hostname, status: 'available', display: data.hostname };
    }

    // Processes
    if (Array.isArray(data.processes)) {
      this.state.processes.list = data.processes;
      this.state.processes.count = { value: data.processes.length, status: 'available', display: `${data.processes.length} Processes` };
      this.state.processes.status = 'available';
    }

    if (!wasConnected) {
      eventBus.emit('logger.entry', {
        source: 'SYSTEM',
        message: '⌬ Local Device Bridge Connected. Real hardware telemetry engaged.',
        type: 'success'
      });
    }

    this.notifyListeners();
  }

  /**
   * Resets hardware metrics to clean Browser Sandbox N/A state
   */
  private applyBrowserSandboxState(): void {
    const wasConnected = this.state.isConnectedToLocalBridge;

    this.state.environment = 'BROWSER_SANDBOX';
    this.state.isConnectedToLocalBridge = false;
    this.state.statusLabel = 'BROWSER MODE';
    this.state.sourceDescription = 'Running in Browser Mode — Hardware telemetry unavailable (Google AI Studio)';
    this.state.lastUpdated = Date.now();

    // Reset all hardware values to null/unavailable
    this.state.cpu.usagePercent = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.cpu.model = { value: null, status: 'unavailable', display: 'Unavailable' };
    this.state.cpu.temperatureC = { value: null, status: 'unavailable', display: 'N/A' };

    this.state.memory.usedBytes = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.memory.usedPercent = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.memory.summary = { value: null, status: 'unavailable', display: 'Hardware Telemetry Unavailable in Browser' };

    this.state.gpu.name = { value: null, status: 'unavailable', display: 'Unavailable' };
    this.state.gpu.usagePercent = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.gpu.memoryUsedPercent = { value: null, status: 'unavailable', display: 'N/A' };

    this.state.disk.usedPercent = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.disk.freeSpace = { value: null, status: 'unavailable', display: 'Unavailable' };
    this.state.disk.driveLabel = { value: null, status: 'unavailable', display: 'N/A' };

    this.state.system.uptimeSeconds = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.processes.count = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.processes.list = [];
    this.state.processes.status = 'unavailable';

    if (wasConnected) {
      eventBus.emit('logger.entry', {
        source: 'SYSTEM',
        message: '○ Switched to Browser Mode. Hardware telemetry suspended.',
        type: 'info'
      });
    }

    this.notifyListeners();
  }

  public getTelemetry(): DeviceTelemetryState {
    return { ...this.state };
  }

  public subscribe(listener: (state: DeviceTelemetryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getTelemetry();
    this.listeners.forEach(fn => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    });
  }
}

export const telemetryService = new TelemetryService();
