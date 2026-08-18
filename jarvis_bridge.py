#!/usr/bin/env python3
"""
JARVIS AI OS — Local Computer Automation & Telemetry Bridge
===========================================================
This lightweight standalone Python daemon connects your local computer (Windows, macOS, Linux)
directly to the JARVIS web interface running in your browser.

Capabilities:
- Real-time Hardware Telemetry (CPU, GPU, RAM, Disk, Battery, Network)
- Native Application Launching (VS Code, Chrome, Terminal, Notepad, Calculator, etc.)
- Shell / Terminal Command Execution
- Local File System Operations
- System Power & Volume Management

Usage:
  1. Install dependencies:
     pip install websockets psutil
  2. Run the bridge:
     python jarvis_bridge.py
  3. Open JARVIS in your browser — it will automatically connect to ws://127.0.0.1:8765!
"""

import asyncio
import json
import logging
import os
import platform
import subprocess
import sys
from typing import Dict, Any

try:
    import psutil
except ImportError:
    print("[!] 'psutil' package is missing. Installing automatically...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
    import psutil

try:
    import websockets
except ImportError:
    print("[!] 'websockets' package is missing. Installing automatically...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("JARVIS-Bridge")

PORT = 8765
HOST = "127.0.0.1"

def get_system_telemetry() -> Dict[str, Any]:
    """Collect real live hardware metrics from the operating system."""
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_freq = psutil.cpu_freq()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/') if os.name != 'nt' else psutil.disk_usage('C:\\')
    
    battery = psutil.sensors_battery()
    battery_percent = battery.percent if battery else None
    power_plugged = battery.power_plugged if battery else True
    
    net_io = psutil.net_io_counters()

    # Collect active top processes
    processes = []
    for proc in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']), 
                       key=lambda p: p.info.get('cpu_percent') or 0, reverse=True)[:6]:
        try:
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu": round(proc.info.get('cpu_percent') or 0, 1),
                "mem": round(proc.info.get('memory_percent') or 0, 1)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    return {
        "type": "telemetry_update",
        "environment": "LOCAL_DEVICE",
        "platform": platform.system(),
        "platform_release": platform.release(),
        "hostname": platform.node(),
        "cpu": {
            "usagePercent": cpu_percent,
            "cores": psutil.cpu_count(logical=False) or psutil.cpu_count(),
            "threads": psutil.cpu_count(logical=True),
            "freqMhz": round(cpu_freq.current, 1) if cpu_freq else 0
        },
        "memory": {
            "totalGb": round(mem.total / (1024**3), 2),
            "usedGb": round(mem.used / (1024**3), 2),
            "freeGb": round(mem.available / (1024**3), 2),
            "usagePercent": mem.percent
        },
        "disk": {
            "totalGb": round(disk.total / (1024**3), 2),
            "usedGb": round(disk.used / (1024**3), 2),
            "freeGb": round(disk.free / (1024**3), 2),
            "usagePercent": disk.percent
        },
        "battery": {
            "percent": battery_percent,
            "isCharging": power_plugged
        },
        "network": {
            "bytesSent": net_io.bytes_sent,
            "bytesRecv": net_io.bytes_recv
        },
        "processes": processes
    }

async def handle_action(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute local computer automation commands dispatched by JARVIS."""
    action = payload.get("action")
    params = payload.get("params", {})
    logger.info(f"Executing action: {action} with params: {params}")

    try:
        if action == "open_app":
            app_name = params.get("name", "").lower()
            if sys.platform == "win32":
                if "code" in app_name or "vscode" in app_name:
                    subprocess.Popen(["code"])
                elif "chrome" in app_name:
                    subprocess.Popen(["start", "chrome"], shell=True)
                elif "terminal" in app_name or "cmd" in app_name or "powershell" in app_name:
                    subprocess.Popen(["start", "cmd"], shell=True)
                elif "calc" in app_name:
                    subprocess.Popen(["calc"])
                elif "notepad" in app_name:
                    subprocess.Popen(["notepad"])
                else:
                    subprocess.Popen([app_name], shell=True)
            elif sys.platform == "darwin":  # macOS
                subprocess.Popen(["open", "-a", app_name])
            else:  # Linux
                subprocess.Popen([app_name], shell=True)
            return {"status": "success", "message": f"Successfully launched {app_name}"}

        elif action == "execute_command" or action == "terminal":
            command = params.get("command", "")
            if not command:
                return {"status": "error", "message": "Command cannot be empty"}
            
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15)
            return {
                "status": "success",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }

        elif action == "get_telemetry":
            return {"status": "success", "data": get_system_telemetry()}

        elif action == "create_file":
            filepath = params.get("path", "")
            content = params.get("content", "")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            return {"status": "success", "message": f"Created file at {filepath}"}

        elif action == "ping":
            return {"status": "pong", "time": asyncio.get_event_loop().time()}

        else:
            return {"status": "unknown_action", "action": action}

    except Exception as e:
        logger.error(f"Error handling action {action}: {e}")
        return {"status": "error", "message": str(e)}

async def telemetry_broadcast_loop(websocket):
    """Periodically stream live real-time hardware telemetry to JARVIS UI every 2 seconds."""
    try:
        while True:
            telemetry = get_system_telemetry()
            await websocket.send(json.dumps(telemetry))
            await asyncio.sleep(2.0)
    except asyncio.CancelledError:
        pass
    except websockets.exceptions.ConnectionClosed:
        pass

async def ws_handler(websocket):
    logger.info(f"⚡ JARVIS Web Interface Connected: {websocket.remote_address}")
    
    # Send immediate handshake acknowledging connected device
    await websocket.send(json.dumps({
        "type": "connection_handshake",
        "status": "ONLINE",
        "device": platform.node(),
        "os": platform.system()
    }))

    # Start live telemetry stream task
    telemetry_task = asyncio.create_task(telemetry_broadcast_loop(websocket))

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                response = await handle_action(data)
                await websocket.send(json.dumps({
                    "type": "action_response",
                    "reply_to": data.get("action"),
                    "result": response
                }))
            except json.JSONDecodeError:
                await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON format"}))
    except websockets.exceptions.ConnectionClosed:
        logger.info("❌ JARVIS Web Interface Disconnected.")
    finally:
        telemetry_task.cancel()

async def main():
    print("=" * 65)
    print(" 🚀 JARVIS AI OS — LOCAL BRIDGE SERVER INITIALIZED")
    print(f" 📡 Listening on: ws://{HOST}:{PORT}")
    print(" 🖥️  Host System: " + platform.system() + " (" + platform.node() + ")")
    print("=" * 65)
    print(" Ready! Open JARVIS in your browser to activate local PC control.")
    print(" Press Ctrl+C in this terminal to stop.")
    
    async with websockets.serve(ws_handler, HOST, PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] JARVIS Local Bridge stopped by user.")
