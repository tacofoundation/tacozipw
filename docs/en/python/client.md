# Python Client

## Purpose and scope

The Python client provides a high-level interface to tacozip with Pythonic conventions and integration with the Python ecosystem. This document covers Python-specific features, data types, and usage patterns.

For basic usage examples, see [Getting Started](getting-started.md). For C library details, see [C API Reference](#).

## Installation

```bash
pip install tacozip
```

The package includes pre-compiled native libraries for all supported platforms. No compilation required.

**Supported platforms:**
- Linux (x86_64, ARM64)
- macOS (Intel, Apple Silicon)  
- Windows (AMD64)

**Python versions:** 3.8, 3.9, 3.10, 3.11, 3.12


## Core features

### 1. Dual input mode: files and bytes

Unlike the C API which only reads from files, the Python client supports both:

**File path mode (traditional):**
```python
import tacozip

# Read from local file
entries = tacozip.read_header("archive.taco")
```

**Bytes buffer mode (cloud-native):**
```python
import requests

# Read from HTTP range request (no file download!)
r = requests.get(
    "https://cdn.example.com/archive.taco",
    headers={"Range": "bytes=0-164"}
)
entries = tacozip.read_header(r.content)  # Pass bytes directly!
```

**Why this matters:**
- ✅ No temporary files needed
- ✅ Works with S3, Azure Blob, HTTP streams
- ✅ Minimal latency (only 165 bytes downloaded)

### 2. Path flexibility

The Python client accepts multiple path types:

```python
from pathlib import Path

# All valid:
tacozip.create("output.taco", ["file.txt"])               # str
tacozip.create("output.taco", [Path("file.txt")])         # pathlib.Path  
tacozip.create(Path("output.taco"), ["file.txt"])         # mixed
```

Paths are automatically:
- Resolved to absolute paths
- Normalized for the current platform
- Converted to UTF-8 for C library

### 3. Automatic archive name generation

If you don't specify archive names, they're auto-generated from filenames:

```python
# Source files with full paths
tacozip.create(
    "archive.taco",
    src_files=["./data/train.parquet", "./data/test.parquet"]
    # arc_files automatically: ["train.parquet", "test.parquet"]
)

# Manual names if needed
tacozip.create(
    "archive.taco",
    src_files=["./data/train.parquet", "./data/test.parquet"],
    arc_files=["training_data.parquet", "testing_data.parquet"]
)
```

### 4. Pythonic error handling

Errors raise exceptions (not integer codes):

```python
from tacozip import TacozipError

try:
    tacozip.create("output.taco", files=["missing.txt"])
except TacozipError as e:
    print(f"Error code: {e.code}")
    print(f"Message: {e}")
    # Error code: -1
    # Message: tacozip error -1: I/O error
```

**Exception hierarchy:**
```
TacozipError (base)
├─> TacozipIOError          # File I/O errors
├─> TacozipValidationError  # Invalid parameters
└─> TacozipLibraryError     # Library loading errors
```

### 5. Type hints

All public functions have full type annotations:

```python
def create(
    zip_path: str,
    src_files: List[Union[str, pathlib.Path]],
    arc_files: List[str] = None,
    entries: List[Tuple[int, int]] = None,
) -> None:
    ...

def read_header(
    source: Union[str, bytes, pathlib.Path]
) -> List[Tuple[int, int]]:
    ...
```

Use with mypy, pyright, or your IDE for type checking.


## Cloud storage integration

### S3 example

```python
import boto3
import tacozip

s3 = boto3.client('s3')

# Step 1: Get header only (165 bytes)
response = s3.get_object(
    Bucket='my-bucket',
    Key='data.taco',
    Range='bytes=0-164'
)
header_bytes = response['Body'].read()

# Step 2: Parse metadata from bytes
entries = tacozip.read_header(header_bytes)
offset, length = entries[0]

# Step 3: Get specific data segment
response = s3.get_object(
    Bucket='my-bucket',
    Key='data.taco',
    Range=f'bytes={offset}-{offset+length-1}'
)
data = response['Body'].read()

# Total downloaded: 165 + length bytes (not entire archive!)
```

### Azure blob storage

```python
from azure.storage.blob import BlobClient
import tacozip

blob = BlobClient.from_connection_string(
    conn_str="...",
    container_name="data",
    blob_name="archive.taco"
)

# Download first 165 bytes
header_stream = blob.download_blob(offset=0, length=165)
entries = tacozip.read_header(header_stream.readall())

# Download specific segment
offset, length = entries[1]
data_stream = blob.download_blob(offset=offset, length=length)
data = data_stream.readall()
```

### HTTP streaming

```python
import requests
import tacozip

url = "https://data.example.com/archive.taco"

# Get header
r = requests.get(url, headers={"Range": "bytes=0-164"})
entries = tacozip.read_header(r.content)

# Stream specific segment
offset, length = entries[2]
r = requests.get(
    url,
    headers={"Range": f"bytes={offset}-{offset+length-1}"},
    stream=True
)

# Process in chunks without loading to memory
for chunk in r.iter_content(chunk_size=1024*1024):  # 1MB chunks
    process(chunk)
```

## Advanced usage

### Working with large archives

For archives with many files, batch operations:

```python
import tacozip
from pathlib import Path

# Collect all files first
data_dir = Path("./dataset")
files = list(data_dir.glob("**/*.parquet"))

# Create in single operation (faster than multiple calls)
tacozip.create(
    "dataset.taco",
    src_files=files,
    entries=[(0, 0)]  # Placeholder metadata
)

# Later: update metadata after analysis
row_group_info = analyze_parquet_files(files)
tacozip.update_header("dataset.taco", entries=row_group_info)
```

### Validation workflow

```python
from tacozip import (
    validate,
    TACOZ_VALID,
    TACOZ_INVALID_NO_TACO,
    TACOZIP_VALIDATE_DEEP
)
from tacozip.config import VALIDATION_ERROR_MESSAGES

def check_archive(path):
    """Validate archive and return detailed status."""
    result = validate(path, TACOZIP_VALIDATE_DEEP)
    
    if result == TACOZ_VALID:
        return {"status": "valid", "message": "Archive OK"}
    
    if result == TACOZ_INVALID_NO_TACO:
        return {
            "status": "error",
            "code": result,
            "message": "Archive modified by external ZIP tool",
            "fix": "Recreate archive to restore TACO header"
        }
    
    return {
        "status": "error",
        "code": result,
        "message": VALIDATION_ERROR_MESSAGES.get(result, "Unknown error")
    }

# Use it
status = check_archive("data.taco")
print(status)
```

### Progress monitoring

```python
import tacozip
from pathlib import Path

files = [f"file_{i}.dat" for i in range(100)]

print("Creating archive...")
tacozip.create("output.taco", src_files=files)

# Check result
archive_path = Path("output.taco")
print(f"Created: {archive_path.name}")
print(f"Size: {archive_path.stat().st_size:,} bytes")
print(f"Files: {len(files)}")
```

---

## Performance considerations

### Memory efficiency

The Python client minimizes memory usage:

- **No file buffering**: Files are streamed directly to C library
- **Zero-copy reads**: Bytes buffers passed directly to C parsing
- **Lazy loading**: Library loaded once on first import

### Startup time

```python
# First import: ~50ms (loads native library)
import tacozip

# Subsequent calls: <1ms
tacozip.read_header("file.taco")
```

### Large file handling

For multi-GB files, use STORE compression (automatic):

```python
# 5GB file - no compression overhead
tacozip.create(
    "large.taco",
    src_files=["data_5gb.bin"],
    entries=[(0, 0)]
)

# Fast: no decompression needed
entries = tacozip.read_header("large.taco")
```


## Troubleshooting

### Library not found

```python
import tacozip

try:
    tacozip.self_check()
except tacozip.TacozipLibraryError as e:
    print(f"Library error: {e}")
    # Try: pip install --force-reinstall tacozip
```

### Version mismatch

```python
import tacozip

print(f"Python package: {tacozip.__version__}")
print(f"C library: {tacozip.__tacozip_version__}")

# Should match (e.g., both "0.11.4")
```

### Platform detection

```python
import sys
import tacozip
from tacozip.config import LIBRARY_NAMES

platform = sys.platform
expected_libs = LIBRARY_NAMES.get(platform, [])
print(f"Platform: {platform}")
print(f"Expected libraries: {expected_libs}")
```

---

## API reference

See [Python API Reference](python-api-reference.md) for complete function signatures and parameters.

**Quick reference:**

| Function | Purpose |
|----------|---------|
| `create()` | Create new archive |
| `read_header()` | Read metadata (file or bytes) |
| `update_header()` | Update metadata in-place |
| `detect_format()` | Check ZIP32/ZIP64 |
| `validate()` | Verify archive integrity |
| `get_library_version()` | Get C library version |
| `self_check()` | Verify library loading |


## Differences from C API

| Feature | C API | Python API |
|---------|-------|------------|
| **Input types** | File paths only | Files OR bytes buffers |
| **Error handling** | Integer codes | Exceptions |
| **Path types** | char* strings | str, pathlib.Path |
| **Memory management** | Manual malloc/free | Automatic (ctypes + GC) |
| **Type safety** | Runtime only | Type hints + runtime |
| **Archive names** | Always required | Auto-generated from filenames |
