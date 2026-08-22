/**
 * JARVIS Real Telemetry Service
 * Strict Zero-Fabrication Hardware Telemetry Engine
 * 
 * Rules:
 * 1. ZERO FAKE DATA: Never generate random/simulated numbers (Math.random) for hardware metrics.
 * 2. BROWSER MODE: When running in browser / Google AI Studio without local bridge,
 *    hardware metrics (CPU, RAM, GPU, Disk, Processes, Temp) are explicitly flagged as UNAVAILABLE (N/A).
 * 3. LOCAL DEVICE MODE: When connected to the local JARVIS bridge (ws://127.0.0.1:8765),
 *    streams actual OS metrics from psutil/system APIs.
 * 4. SOURCE TRANSPARENCY: Every consumer component displays clear source indicator badges
 *    ("BROWSER MODE: Telemetry Unavailable" vs "NATIVE DEVICE: Real Hardware Telemetry").
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
    frequencyMhz: MetricField<number>;
    temperatureC: MetricField<number>;
  };
  memory: {
    usedBytes: MetricField<number>;
    totalBytes: MetricField<number>;
    freeBytes: MetricField<number>;
    usedPercent: MetricField<number>;
    summary: MetricField<string>;
  };
  gpu: {
    available: boolean;
    name: MetricField<string>;
    usagePercent: MetricField<number>;
    memoryUsedPercent: MetricField<number>;
  };
  disk: {
    usedPercent: MetricField<number>;
    totalBytes: MetricField<number>;
    usedBytes: MetricField<number>;
    freeBytes: MetricField<number>;
    freeSpace: MetricField<string>;
    driveLabel: MetricField<string>;
  };
  temperature: {
    available: boolean;
    celsius: MetricField<number>;
    sensorName: MetricField<string>;
  };
  battery: {
    available: boolean;
    percent: MetricField<number>;
    isCharging: MetricField<boolean>;
  };
  network: {
    isOnline: boolean;
    effectiveType: MetricField<string>;
    downlinkMbps: MetricField<number>;
    rttMs: MetricField<number>;
    bytesSent: MetricField<number>;
    bytesRecv: MetricField<number>;
  };
  system: {
    os: MetricField<string>;
    platform: MetricField<string>;
    platformRelease: MetricField<string>;
    hostname: MetricField<string>;
  };
  processes: {
    count: MetricField<number>;
    list: Array<{ pid: number; name: string; cpu: string; memory: string; status: string }>;
    status: 'available' | 'unavailable' | 'permission_required';
  };
}

const BRIDGE_WS_URL = 'ws://127.0.0.1:8765';

class TelemetryService {
  private state: DeviceTelemetryState;
  private listeners: Set<(state: DeviceTelemetryState) => void> = new Set();
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private isConnecting: boolean = false;

  constructor() {
    this.state = this.createDefaultBrowserState();
    this.initBrowserReadings();
    this.initWebSocketConnection();
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
        frequencyMhz: { value: null, status: 'unavailable', display: 'N/A' },
        temperatureC: { value: null, status: 'unavailable', display: 'N/A' }
      },
      memory: {
        usedBytes: { value: null, status: 'unavailable', display: 'N/A' },
        totalBytes: { value: null, status: 'unavailable', display: 'N/A' },
        freeBytes: { value: null, status: 'unavailable', display: 'N/A' },
        usedPercent: { value: null, status: 'unavailable', display: 'N/A' },
        summary: { value: null, status: 'unavailable', display: 'Telemetry Unavailable in Browser' }
      },
      gpu: {
        available: false,
        name: { value: null, status: 'unavailable', display: 'Unavailable' },
        usagePercent: { value: null, status: 'unavailable', display: 'N/A' },
        memoryUsedPercent: { value: null, status: 'unavailable', display: 'N/A' }
      },
      disk: {
        usedPercent: { value: null, status: 'unavailable', display: 'N/A' },
        totalBytes: { value: null, status: 'unavailable', display: 'N/A' },
        usedBytes: { value: null, status: 'unavailable', display: 'N/A' },
        freeBytes: { value: null, status: 'unavailable', display: 'N/A' },
        freeSpace: { value: null, status: 'unavailable', display: 'Unavailable' },
        driveLabel: { value: null, status: 'unavailable', display: 'N/A' }
      },
      temperature: {
        available: false,
        celsius: { value: null, status: 'unavailable', display: 'N/A' },
        sensorName: { value: null, status: 'unavailable', display: 'N/A' }
      },
      battery: {
        available: false,
        percent: { value: null, status: 'unavailable', display: 'N/A' },
        isCharging: { value: null, status: 'unavailable', display: 'N/A' }
      },
      network: {
        isOnline,
        effectiveType: { value: null, status: 'unavailable', display: 'N/A' },
        downlinkMbps: { value: null, status: 'unavailable', display: 'N/A' },
        rttMs: { value: null, status: 'unavailable', display: 'N/A' },
        bytesSent: { value: null, status: 'unavailable', display: 'N/A' },
        bytesRecv: { value: null, status: 'unavailable', display: 'N/A' }
      },
      system: {
        os: { value: 'Web Browser / AI Studio', status: 'available', display: 'Browser Runtime' },
        platform: { value: platform, status: 'available', display: platform.substring(0, 32) },
        platformRelease: { value: 'Web Engine', status: 'available', display: 'Browser' },
        hostname: { value: 'Web Client', status: 'available', display: 'Web Sandbox' }
      },
      processes: {
        count: { value: null, status: 'unavailable', display: 'N/A' },
        list: [],
        status: 'unavailable'
      }
    };
  }

  private async initBrowserReadings(): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    window.addEventListener('online', () => {
      this.state.network.isOnline = true;
      this.notifyListeners();
    });
    window.addEventListener('offline', () => {
      this.state.network.isOnline = false;
      this.notifyListeners();
    });

    try {
      if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
        const batteryManager = await (navigator as any).getBattery();
        if (batteryManager && !this.state.isConnectedToLocalBridge) {
          const updateBattery = () => {
            if (this.state.isConnectedToLocalBridge) return;
            const level = Math.round(batteryManager.level * 100);
            const charging = batteryManager.charging;
            this.state.battery = {
              available: true,
              percent: { value: level, status: 'available', display: `${level}%` },
              isCharging: { value: charging, status: 'available', display: charging ? 'Charging' : 'Discharging' }
            };
            this.notifyListeners();
          };
          updateBattery();
          batteryManager.addEventListener('levelchange', updateBattery);
          batteryManager.addEventListener('chargingchange', updateBattery);
        }
      }
    } catch {
      // Battery API not supported
    }

    this.notifyListeners();
  }

  /**
   * Initializes WebSocket connection to jarvis_bridge.py
   * with automatic non-aggressive reconnection backoff.
   */
  public initWebSocketConnection(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(BRIDGE_WS_URL);

      this.ws.onopen = () => {
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry' || data.type === 'telemetry_update') {
            this.applyLocalDeviceData(data);
          } else if (data.type === 'connection_handshake') {
            this.applyLocalDeviceData({
              cpu: {},
              memory: {},
              disk: {},
              system: { os: data.os, hostname: data.device }
            });
          }
        } catch {
          // Non-JSON message or pong
        }
      };

      this.ws.onerror = () => {
        // Bridge offline — normal in browser sandbox
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.applyBrowserSandboxState();
        this.scheduleReconnect();
      };
    } catch {
      this.applyBrowserSandboxState();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initWebSocketConnection();
    }, 4000);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', action: 'ping' }));
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public sendAction(payload: Record<string, any>): Promise<any> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        resolve({ success: false, bridgeOffline: true, message: 'Local OS Bridge is offline.' });
        return;
      }

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'action_response' && data.reply_to === payload.action) {
            this.ws?.removeEventListener('message', handler);
            resolve(data.result);
          }
        } catch {
          // Ignore
        }
      };

      this.ws.addEventListener('message', handler);

      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        this.ws.removeEventListener('message', handler);
        resolve({ success: false, message: String(err) });
      }

      // Timeout after 15 seconds
      setTimeout(() => {
        this.ws?.removeEventListener('message', handler);
        resolve({ success: false, message: 'Request to Local OS Bridge timed out.' });
      }, 15000);
    });
  }

  /**
   * Applies verified real hardware metrics from local Python bridge daemon
   */
  private applyLocalDeviceData(data: any): void {
    const wasConnected = this.state.isConnectedToLocalBridge;

    this.state.environment = 'LOCAL_DEVICE';
    this.state.isConnectedToLocalBridge = true;
    this.state.statusLabel = 'NATIVE DEVICE: ONLINE';
    this.state.sourceDescription = `Connected to ${data.hostname || 'Local Computer'} — Real hardware telemetry active`;
    this.state.lastUpdated = data.timestamp || Date.now();

    // 1. CPU
    const cpu = data.cpu || {};
    if (typeof cpu.usage_percent === 'number') {
      this.state.cpu.usagePercent = {
        value: cpu.usage_percent,
        status: 'available',
        display: `${Math.round(cpu.usage_percent)}%`
      };
    }
    if (cpu.cores) {
      this.state.cpu.cores = {
        value: cpu.cores,
        status: 'available',
        display: `${cpu.cores} Cores`
      };
    }
    if (cpu.frequency_mhz) {
      this.state.cpu.frequencyMhz = {
        value: cpu.frequency_mhz,
        status: 'available',
        display: `${Math.round(cpu.frequency_mhz)} MHz`
      };
    }

    // 2. Memory
    const mem = data.memory || {};
    if (typeof mem.usage_percent === 'number') {
      this.state.memory.usedPercent = {
        value: mem.usage_percent,
        status: 'available',
        display: `${Math.round(mem.usage_percent)}%`
      };
    }
    if (typeof mem.used_bytes === 'number' && typeof mem.total_bytes === 'number') {
      const usedGb = (mem.used_bytes / 1073741824).toFixed(1);
      const totalGb = (mem.total_bytes / 1073741824).toFixed(1);
      this.state.memory.usedBytes = { value: mem.used_bytes, status: 'available', display: `${usedGb} GB` };
      this.state.memory.totalBytes = { value: mem.total_bytes, status: 'available', display: `${totalGb} GB` };
      this.state.memory.summary = { value: `${usedGb} / ${totalGb} GB`, status: 'available', display: `${usedGb} / ${totalGb} GB (${Math.round(mem.usage_percent)}%)` };
    }

    // 3. Disk
    const disk = data.disk || {};
    if (typeof disk.usage_percent === 'number') {
      this.state.disk.usedPercent = {
        value: disk.usage_percent,
        status: 'available',
        display: `${Math.round(disk.usage_percent)}%`
      };
    }
    if (typeof disk.free_bytes === 'number' && typeof disk.total_bytes === 'number') {
      const freeGb = (disk.free_bytes / 1073741824).toFixed(1);
      const totalGb = (disk.total_bytes / 1073741824).toFixed(1);
      this.state.disk.freeSpace = { value: `${freeGb} GB Free`, status: 'available', display: `${freeGb} GB Free` };
      this.state.disk.driveLabel = { value: disk.drive || 'C:', status: 'available', display: disk.drive || 'C:' };
    }

    // 4. GPU (Strict zero-fake policy)
    const gpu = data.gpu || {};
    if (gpu.available) {
      this.state.gpu = {
        available: true,
        name: { value: gpu.name || 'Dedicated GPU', status: 'available', display: gpu.name || 'GPU' },
        usagePercent: { 
          value: typeof gpu.usage_percent === 'number' ? gpu.usage_percent : null, 
          status: typeof gpu.usage_percent === 'number' ? 'available' : 'unsupported', 
          display: typeof gpu.usage_percent === 'number' ? `${Math.round(gpu.usage_percent)}%` : 'Active'
        },
        memoryUsedPercent: { 
          value: typeof gpu.memory_used_percent === 'number' ? gpu.memory_used_percent : null, 
          status: typeof gpu.memory_used_percent === 'number' ? 'available' : 'unsupported', 
          display: typeof gpu.memory_used_percent === 'number' ? `${Math.round(gpu.memory_used_percent)}%` : 'N/A'
        }
      };
    } else {
      this.state.gpu = {
        available: false,
        name: { value: null, status: 'unsupported', display: 'Unsupported' },
        usagePercent: { value: null, status: 'unsupported', display: 'N/A' },
        memoryUsedPercent: { value: null, status: 'unsupported', display: 'N/A' }
      };
    }

    // 5. Temperature (Strict zero-fake policy)
    const temp = data.temperature || {};
    if (temp.available && typeof temp.celsius === 'number') {
      this.state.temperature = {
        available: true,
        celsius: { value: temp.celsius, status: 'available', display: `${Math.round(temp.celsius)}°C` },
        sensorName: { value: temp.sensor_name || 'CPU Package', status: 'available', display: temp.sensor_name || 'CPU' }
      };
      this.state.cpu.temperatureC = { value: temp.celsius, status: 'available', display: `${Math.round(temp.celsius)}°C` };
    } else {
      this.state.temperature = {
        available: false,
        celsius: { value: null, status: 'unsupported', display: 'N/A' },
        sensorName: { value: null, status: 'unsupported', display: 'Unavailable' }
      };
      this.state.cpu.temperatureC = { value: null, status: 'unsupported', display: 'N/A' };
    }

    // 6. Battery
    const batt = data.battery || {};
    if (batt.available && typeof batt.percent === 'number') {
      this.state.battery = {
        available: true,
        percent: { value: batt.percent, status: 'available', display: `${Math.round(batt.percent)}%` },
        isCharging: { value: !!batt.charging, status: 'available', display: batt.charging ? 'Charging' : 'On Battery' }
      };
    }

    // 7. System Info
    if (data.platform) {
      this.state.system.platform = { value: data.platform, status: 'available', display: String(data.platform).toUpperCase() };
      this.state.system.os = { value: `${data.platform} ${data.platform_release || ''}`, status: 'available', display: `${data.platform} ${data.platform_release || ''}` };
    }
    if (data.hostname) {
      this.state.system.hostname = { value: data.hostname, status: 'available', display: data.hostname };
    }

    // 8. Processes
    if (Array.isArray(data.processes)) {
      this.state.processes = {
        count: { value: data.processes.length, status: 'available', display: `${data.processes.length} Processes` },
        list: data.processes.map((p: any) => ({
          pid: p.pid,
          name: p.name,
          cpu: `${p.cpu_percent || 0}%`,
          memory: `${p.memory_percent || 0}%`,
          status: 'running'
        })),
        status: 'available'
      };
    }

    if (!wasConnected) {
      eventBus.emit('logger.entry', {
        source: 'SYSTEM',
        message: `⚡ Native OS Bridge Connected. Host: ${data.hostname || 'Windows PC'}`,
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
    this.state.cpu.frequencyMhz = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.cpu.temperatureC = { value: null, status: 'unavailable', display: 'N/A' };

    this.state.memory.usedBytes = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.memory.totalBytes = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.memory.usedPercent = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.memory.summary = { value: null, status: 'unavailable', display: 'Telemetry Unavailable in Browser' };

    this.state.gpu = {
      available: false,
      name: { value: null, status: 'unavailable', display: 'Unavailable' },
      usagePercent: { value: null, status: 'unavailable', display: 'N/A' },
      memoryUsedPercent: { value: null, status: 'unavailable', display: 'N/A' }
    };

    this.state.disk = {
      usedPercent: { value: null, status: 'unavailable', display: 'N/A' },
      totalBytes: { value: null, status: 'unavailable', display: 'N/A' },
      usedBytes: { value: null, status: 'unavailable', display: 'N/A' },
      freeBytes: { value: null, status: 'unavailable', display: 'N/A' },
      freeSpace: { value: null, status: 'unavailable', display: 'Unavailable' },
      driveLabel: { value: null, status: 'unavailable', display: 'N/A' }
    };

    this.state.temperature = {
      available: false,
      celsius: { value: null, status: 'unavailable', display: 'N/A' },
      sensorName: { value: null, status: 'unavailable', display: 'Unavailable' }
    };

    this.state.processes.count = { value: null, status: 'unavailable', display: 'N/A' };
    this.state.processes.list = [];
    this.state.processes.status = 'unavailable';

    if (wasConnected) {
      eventBus.emit('logger.entry', {
        source: 'SYSTEM',
        message: '○ Native OS Bridge Disconnected. Switched to Browser Sandbox mode.',
        type: 'info'
      });
    }

    this.notifyListeners();
  }

  public async pollBridge(): Promise<void> {
    this.initWebSocketConnection();
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
