#!/usr/bin/env python3
"""
Verify SuperClaude installation from different Python environments
"""
import sys
import os
import subprocess

def check_superclaude(python_path, env_name):
    """Check if SuperClaude is available in given Python"""
    try:
        result = subprocess.run(
            [python_path, '-c', 'import SuperClaude; print("OK")'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and "OK" in result.stdout:
            print(f"✅ {env_name}: SuperClaude found")
            
            # Get more details
            details = subprocess.run(
                [python_path, '-c', 
                 'import SuperClaude; import sys; '
                 'print(f"  Python: {sys.executable}"); '
                 'print(f"  Module: {SuperClaude.__file__}")'],
                capture_output=True,
                text=True
            )
            if details.returncode == 0:
                print(details.stdout.strip())
            return True
        else:
            print(f"❌ {env_name}: SuperClaude NOT found")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False
    except FileNotFoundError:
        print(f"❌ {env_name}: Python not found at {python_path}")
        return False
    except Exception as e:
        print(f"❌ {env_name}: Error - {e}")
        return False

print("=== SuperClaude Installation Verification ===\n")

# Test different Python environments
environments = [
    ("System Python", "python3"),
    ("Project venv", os.path.join(os.getcwd(), "venv/bin/python")),
    ("Project .venv", os.path.join(os.getcwd(), ".venv/bin/python")),
    ("Parent venv", os.path.join(os.path.dirname(os.getcwd()), "venv/bin/python"))
]

found_count = 0
for env_name, python_path in environments:
    if check_superclaude(python_path, env_name):
        found_count += 1
    print()

print(f"\nSummary: SuperClaude found in {found_count} environment(s)")

# Check current process environment
print("\nCurrent environment:")
print(f"  VIRTUAL_ENV: {os.environ.get('VIRTUAL_ENV', 'Not set')}")
print(f"  Python: {sys.executable}")

# Try to import in current Python
try:
    import SuperClaude
    print(f"\n✅ SuperClaude is importable in current Python!")
    print(f"   Location: {SuperClaude.__file__}")
except ImportError as e:
    print(f"\n❌ Cannot import SuperClaude in current Python")
    print(f"   Error: {e}")