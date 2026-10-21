#!/usr/bin/env python3
"""
QR Studio - WordPress Plugin Packaging Script for Windows 11
Creates a clean, production-ready WordPress plugin ZIP archive using native Windows 11 compression tools.
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path
import zipfile

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PLUGIN_SLUG = "qr-wp-plugin"
SCRIPT_DIR = Path(__file__).resolve().parent

# Files and directories to package in the WordPress plugin
INCLUDE_FILES = [
    "qr-wp-plugin.php",
    "README.md",
    "CHANGELOG.md",
    "UI-UX-PLAN.md",
]

INCLUDE_DIRS = [
    "includes",
    "dist",
    "assets",
]

# Patterns and folders to exclude
EXCLUDE_NAMES = {
    "node_modules",
    "src",
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "tests",
    "__pycache__",
    ".DS_Store",
    "qr-wp-plugin.zip",
    "test.zip",
}

EXCLUDE_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".map",
    ".log",
    ".tmp",
}


def run_command(cmd, cwd=None):
    """Run shell command and return stdout, stderr, and exit code."""
    result = subprocess.run(cmd, cwd=cwd, shell=True, text=True, capture_output=True)
    return result


def ensure_build():
    """Ensure the Vite + React frontend is compiled into dist/."""
    dist_entry = SCRIPT_DIR / "dist" / "assets" / "index.js"
    if not dist_entry.exists():
        print("[1/4] 'dist/' bundle not found. Running 'npm run build'...")
        res = run_command("npm run build", cwd=SCRIPT_DIR)
        if res.returncode != 0:
            print(f"[ERROR] Build failed:\n{res.stderr}")
            sys.exit(1)
        print("[OK] Build complete!")
    else:
        print("[OK] [1/4] 'dist/' frontend build verified.")


def stage_plugin_files(staging_dir: Path):
    """Copy only the runtime plugin files into a staging directory under qr-wp-plugin/."""
    target_plugin_dir = staging_dir / PLUGIN_SLUG
    if target_plugin_dir.exists():
        shutil.rmtree(target_plugin_dir)
    target_plugin_dir.mkdir(parents=True, exist_ok=True)

    # Copy files
    for fname in INCLUDE_FILES:
        src = SCRIPT_DIR / fname
        if src.exists():
            shutil.copy2(src, target_plugin_dir / fname)

    # Copy directories with filtering
    for dname in INCLUDE_DIRS:
        src_dir = SCRIPT_DIR / dname
        if not src_dir.exists():
            continue
        dst_dir = target_plugin_dir / dname
        dst_dir.mkdir(parents=True, exist_ok=True)

        for root, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_NAMES]
            rel_path = Path(root).relative_to(src_dir)
            target_sub = dst_dir / rel_path
            target_sub.mkdir(parents=True, exist_ok=True)

            for f in files:
                if Path(f).suffix in EXCLUDE_EXTENSIONS:
                    continue
                shutil.copy2(Path(root) / f, target_sub / f)

    return target_plugin_dir


def compress_with_win11_tar(staging_dir: Path, output_zip: Path) -> bool:
    """Use Windows 11 native tar.exe with automatic ZIP compression."""
    print("[*] Using Windows 11 Native 'tar.exe -a -cf'...")
    if output_zip.exists():
        output_zip.unlink()

    # In Windows 11, tar supports creating zip archives with -a flag
    cmd = f'tar -a -cf "{output_zip}" "{PLUGIN_SLUG}"'
    res = run_command(cmd, cwd=staging_dir)
    return res.returncode == 0 and output_zip.exists()


def compress_with_powershell(staging_dir: Path, output_zip: Path) -> bool:
    """Use Windows 11 native PowerShell Compress-Archive function."""
    print("[*] Using Windows 11 PowerShell 'Compress-Archive'...")
    if output_zip.exists():
        output_zip.unlink()

    source = staging_dir / PLUGIN_SLUG
    cmd = (
        f'powershell.exe -NoProfile -Command '
        f'"Compress-Archive -Path \'{source}\' -DestinationPath \'{output_zip}\' -Force"'
    )
    res = run_command(cmd, cwd=staging_dir)
    return res.returncode == 0 and output_zip.exists()


def compress_with_zipfile(staging_dir: Path, output_zip: Path) -> bool:
    """Fallback standard Python zipfile with maximum Deflate compression."""
    print("[*] Using Python ZipFile (Deflated)...")
    if output_zip.exists():
        output_zip.unlink()

    source = staging_dir / PLUGIN_SLUG
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, _, files in os.walk(source):
            for file in files:
                full_path = Path(root) / file
                arcname = full_path.relative_to(staging_dir)
                zipf.write(full_path, arcname=str(arcname).replace("\\", "/"))
    return output_zip.exists()


def main():
    parser = argparse.ArgumentParser(
        description="Package QR Studio WordPress plugin into a ZIP file using Windows 11 functions."
    )
    parser.add_argument(
        "--method",
        choices=["auto", "tar", "powershell", "zipfile"],
        default="auto",
        help="Compression method to use (default: auto, prioritizing Windows 11 native functions)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default=f"{PLUGIN_SLUG}.zip",
        help=f"Output zip filename (default: {PLUGIN_SLUG}.zip)",
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Force rebuild Vite/React assets before creating ZIP",
    )
    args = parser.parse_args()

    print("==================================================")
    print("  QR Studio - WordPress Plugin Packaging Tool   ")
    print("==================================================")

    if args.rebuild:
        print("[*] Rebuilding Vite frontend...")
        res = run_command("npm run build", cwd=SCRIPT_DIR)
        if res.returncode != 0:
            print(f"[ERROR] Build failed:\n{res.stdout}\n{res.stderr}")
            sys.exit(1)
    else:
        ensure_build()

    staging_dir = SCRIPT_DIR / "_staging"
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True, exist_ok=True)

    try:
        print("[2/4] Staging production plugin files...")
        stage_plugin_files(staging_dir)

        output_zip = (SCRIPT_DIR / args.output).resolve()
        print(f"[3/4] Compressing archive: {output_zip.name}...")

        success = False
        method = args.method

        if method == "tar":
            success = compress_with_win11_tar(staging_dir, output_zip)
        elif method == "powershell":
            success = compress_with_powershell(staging_dir, output_zip)
        elif method == "zipfile":
            success = compress_with_zipfile(staging_dir, output_zip)
        else:
            # Auto: Try Win11 tar first, then PowerShell, then Python zipfile
            success = compress_with_win11_tar(staging_dir, output_zip)
            if not success:
                print("[!] tar.exe failed, trying PowerShell Compress-Archive...")
                success = compress_with_powershell(staging_dir, output_zip)
            if not success:
                print("[!] PowerShell failed, falling back to Python zipfile...")
                success = compress_with_zipfile(staging_dir, output_zip)

        if not success or not output_zip.exists():
            print("[ERROR] Failed to create ZIP archive.")
            sys.exit(1)

        size_kb = output_zip.stat().st_size / 1024
        size_str = f"{size_kb / 1024:.2f} MB" if size_kb > 1024 else f"{size_kb:.1f} KB"

        print(f"[4/4] Package Created Successfully!")
        print(f"   * File: {output_zip}")
        print(f"   * Size: {size_str}")
        print("\nReady for WordPress Installation:")
        print("   1. In WordPress Admin -> Plugins -> Add New -> Upload Plugin")
        print(f"   2. Select '{output_zip.name}' and click 'Install Now'")
        print("   3. Click 'Activate Plugin' - All tables and rewrites activate automatically!")
        print("==================================================")

    finally:
        if staging_dir.exists():
            shutil.rmtree(staging_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
