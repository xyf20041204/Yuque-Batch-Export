#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Clean up .crdownload suffix from exported Yuque files.

Usage:
    python cleanup_crdownload.py [download_dir]

If no directory is given, scans the current directory recursively.
Only renames files ending with .crdownload ? strips that suffix.
"""
import os
import sys

def cleanup_crdownload(root_dir):
    count = 0
    skipped = 0
    for dirpath, _, filenames in os.walk(root_dir):
        for fn in filenames:
            if not fn.endswith(".crdownload"):
                continue
            old_path = os.path.join(dirpath, fn)
            new_fn = fn[:-len(".crdownload")]
            new_path = os.path.join(dirpath, new_fn)
            if os.path.exists(new_path):
                print(f"  SKIP (target exists): {old_path} -> {new_fn}")
                skipped += 1
                continue
            os.rename(old_path, new_path)
            print(f"  RENAMED: {old_path} -> {new_fn}")
            count += 1
    print(f"\nDone: {count} renamed, {skipped} skipped (target existed)")

if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    if not os.path.isdir(root):
        print(f"Error: not a directory: {root}")
        sys.exit(1)
    print(f"Scanning: {root}")
    cleanup_crdownload(root)
