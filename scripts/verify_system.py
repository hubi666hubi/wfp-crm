import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import subprocess
import json
import os
import time

def run_command(args, cwd=None):
    start_time = time.monotonic()
    try:
        # Using shell=True for windows path compatibility
        proc = subprocess.run(
            args,
            cwd=cwd,
            capture_output=True,
            text=True,
            shell=True
        )
        duration = time.monotonic() - start_time
        return {
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "duration_seconds": duration,
            "error": None
        }
    except Exception as e:
        duration = time.monotonic() - start_time
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": "",
            "duration_seconds": duration,
            "error": str(e)
        }

def main():
    print("🪐 Starting WFP CRM System Verification Sequence...")
    results = {}
    
    # 1. Validation tests
    print("  -> Running Node.js validation tests...")
    results["node_validation"] = run_command("node --import tsx --test server/validation.test.ts")
    
    # 2. Autonomy tests
    print("  -> Running Node.js autonomy tests...")
    results["node_autonomy"] = run_command("node --import tsx --test server/autonomy.test.ts")
    
    # 3. Pytest integration tests
    print("  -> Running Python integration tests...")
    pytest_path = os.path.join(".venv", "bin", "python")
    results["python_integration"] = run_command(f'"{pytest_path}" -m pytest tests/')
    
    # 4. Production build typecheck & bundling
    print("  -> Running npm run build (Vite + esbuild)...")
    results["npm_build"] = run_command(f'npm run build')
    
    # Check overall success
    all_success = True
    for key, val in results.items():
        if val["exit_code"] != 0 or val["error"] is not None:
            all_success = False
            
    report = {
        "timestamp": time.time(),
        "all_success": all_success,
        "results": results
    }
    
    report_file = "verification_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print("=" * 60)
    if all_success:
        print("🟢 VERIFICATION SUCCESSFUL: All tests passed and project build succeeded!")
    else:
        print("❌ VERIFICATION FAILED: Some tests failed or the build broke.")
        for key, val in results.items():
            if val["exit_code"] != 0 or val["error"] is not None:
                print(f"   - {key} failed (exit code {val['exit_code']})")
                if val["error"]:
                    print(f"     Error: {val['error']}")
                elif val["stderr"]:
                    preview = val["stderr"].strip()
                    if not preview and val["stdout"]:
                        preview = val["stdout"].strip()
                    lines = preview.split("\n")
                    preview_summary = " | ".join([l.strip() for l in lines[-3:] if l.strip()])
                    print(f"     Output preview: {preview_summary[:200]}")
    print(f"Detailed logs written to: {report_file}")
    print("=" * 60)
    
    sys.exit(0 if all_success else 1)

if __name__ == "__main__":
    main()
