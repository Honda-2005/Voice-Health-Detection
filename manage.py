import os
import subprocess
import sys
import time
import shutil
import platform
import threading

# ANSI Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(tag, message, color=Colors.BLUE):
    print(f"{color}[{tag}] {Colors.ENDC}{message}")

def find_node_executable():
    """Attempt to find node.exe in system PATH or common locations"""
    # 1. Check PATH
    node_path = shutil.which("node")
    if node_path:
        return node_path

    # 2. Check Common Windows Paths
    common_paths = [
        r"C:\Program Files\nodejs\node.exe",
        r"C:\Program Files (x86)\nodejs\node.exe",
        os.path.expanduser(r"~\AppData\Roaming\npm\node.exe"), # Sometimes here
        os.path.expanduser(r"~\AppData\Local\nvm\v*\node.exe") # NVM support (wildcard handling needed better)
    ]

    for path in common_paths:
        if os.path.exists(path):
            return path
            
    return None

def find_npm_executable(node_path):
    """Attempt to find npm based on node path"""
    if not node_path:
        return None
        
    # Standard installation
    npm_path = os.path.join(os.path.dirname(node_path), "npm.cmd")
    if os.path.exists(npm_path):
        return npm_path
        
    # Try finding it in path
    npm_in_path = shutil.which("npm")
    if npm_in_path:
        return npm_in_path
        
    return "npm" # Fallback to command

def run_command(command, cwd=None, env=None, capture=False):
    """Run a system command"""
    try:
        if capture:
            result = subprocess.run(
                command, 
                cwd=cwd, 
                env=env, 
                shell=True, 
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return result.stdout
        else:
            process = subprocess.Popen(
                command, 
                cwd=cwd, 
                env=env, 
                shell=True
            )
            return process
    except subprocess.CalledProcessError as e:
        log("ERROR", f"Command failed: {e}", Colors.FAIL)
        if capture:
            print(e.stderr)
        return None
    except Exception as e:
        log("ERROR", f"Execution error: {e}", Colors.FAIL)
        return None

def command_test(node_exe, npm_exe):
    """Run project tests"""
    log("TEST", "🧪 Running Validation Tests...", Colors.CYAN)
    
    if not node_exe:
        log("ERROR", "Node.js not found. Cannot run tests.", Colors.FAIL)
        return

    # Check dependencies first
    if not os.path.exists("node_modules"):
        log("SETUP", "Installing Node modules...", Colors.WARNING)
        run_command(f'"{npm_exe}" install', capture=False).wait()

    log("TEST", "Executing npm test...", Colors.GREEN)
    proc = run_command(f'"{npm_exe}" test', capture=False)
    proc.wait()
    
    if proc.returncode == 0:
        log("TEST", "✅ All Tests Passed!", Colors.GREEN)
    else:
        log("TEST", "❌ Tests Failed.", Colors.FAIL)

def command_run(node_exe, npm_exe):
    """Run the full project"""
    log("SYSTEM", "🚀 Starting Voice Health Detection System...", Colors.GREEN)

    # 1. Start ML Service
    log("ML-SERVICE", "Starting Python ML Service (Port 5001)...", Colors.BLUE)
    ml_process = run_command("python ml-service/app.py")

    # Wait for ML service to init
    time.sleep(2)

    # 2. Start Backend
    if node_exe:
        log("BACKEND", "Starting Node.js Backend (Port 5000)...", Colors.CYAN)
        
        # Ensure dependencies
        if not os.path.exists("node_modules"):
             log("SETUP", "Installing Node modules...", Colors.WARNING)
             run_command(f'"{npm_exe}" install', capture=False).wait()
        
        # Use node directly/npm run dev
        backend_process = run_command(f'"{npm_exe}" run dev')
        
        try:
            # Keep alive
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            log("SYSTEM", "🛑 Shutting down...", Colors.WARNING)
            ml_process.terminate()
            backend_process.terminate()
    else:
        log("ERROR", "Node.js not found. Cannot start backend.", Colors.FAIL)
        ml_process.terminate()

def main():
    if len(sys.argv) < 2:
        print("Usage: python manage.py [run|test|install] [--node-path=PATH]")
        return

    command = sys.argv[1]
    
    # Parse manual node path
    manual_node_path = None
    for arg in sys.argv:
        if arg.startswith("--node-path="):
            manual_node_path = arg.split("=", 1)[1].strip('"').strip("'")

    # Find Environment
    if manual_node_path and os.path.exists(manual_node_path):
        node_exe = manual_node_path
        log("ENV", f"✅ Using Manual Node.js: {node_exe}", Colors.GREEN)
    else:
        node_exe = find_node_executable()
        if node_exe:
            log("ENV", f"✅ Found Node.js: {node_exe}", Colors.GREEN)
        else:
            log("ENV", "❌ Node.js NOT FOUND! Please install from nodejs.org", Colors.FAIL)
            log("ENV", "   OR provide path: python manage.py run --node-path=\"C:\\path\\to\\node.exe\"", Colors.WARNING)

    npm_exe = find_npm_executable(node_exe)

    # Execute Command
    if command == "install":
        log("SETUP", "Installing all dependencies...", Colors.CYAN)
        run_command("python -m pip install -r ml-service/requirements.txt", capture=False).wait()
        if npm_exe:
            run_command(f'"{npm_exe}" install', capture=False).wait()
        else:
            log("ERROR", "Cannot install Node dependencies (npm not found)", Colors.FAIL)

    elif command == "test":
        command_test(node_exe, npm_exe)

    elif command == "run":
        # Check/Train Model
        if not os.path.exists("ml-service/models/model.joblib"):
             log("ML", "Training model first...", Colors.WARNING)
             run_command("python ml-service/train_model_optimized.py", capture=False).wait()
        
        command_run(node_exe, npm_exe)
        
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
