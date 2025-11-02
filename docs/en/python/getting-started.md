# Getting started

## Installation

Tacozip is available as both a Python library (recommended for most users) and a native C library for advanced use cases. The Python client provides full functionality through pre-built binary wheels, eliminating the need for manual compilation.


Install directly from PyPI using pip:

```bash
pip install tacozip
```

**Platform support:**

| Platform | Architectures | Python versions |
|----------|---------------|-----------------|
| **Linux** | x86_64, ARM64 (aarch64) | 3.8, 3.9, 3.10, 3.11, 3.12 |
| **macOS** | Universal2 (Intel + Apple Silicon) | 3.8, 3.9, 3.10, 3.11, 3.12 |
| **Windows** | AMD64 | 3.8, 3.9, 3.10, 3.11, 3.12 |

**What's included:**
- Pre-compiled native library (`.so`, `.dylib`, or `.dll`)
- Python bindings via ctypes
- All dependencies bundled (no external requirements)

### Building from source

For development, custom builds, or platforms without pre-built wheels:

```bash
# Clone repository
git clone https://github.com/tacofoundation/tacozip.git
cd tacozip

# Build native library
cmake --preset release
cmake --build --preset release -j

# Install Python package in editable mode
pip install -e clients/python/
```

**Build requirements:**
- CMake 3.15 or later
- C compiler (GCC 7+, Clang 9+, or MSVC 2019+)
- Python 3.8 or later (for Python bindings)


## Verification

After installation, verify the library is correctly loaded and functional:

```python
import tacozip

# Verify library and functions
tacozip.self_check()
```

**What `self_check()` validates:**

1. **Library loading**: Confirms native library (`.so`/`.dylib`/`.dll`) is found and loaded
2. **Function availability**: Verifies all required C functions are present
3. **Version compatibility**: Checks library version matches Python client expectations


## Basic operations

### Create archive with metadata

```python
import tacozip

# Create archive with 3 metadata entries
tacozip.create(
    zip_path="data.taco",
    src_files=["file1.txt", "file2.txt", "file3.txt"],
    entries=[
        (1000, 500),   # Entry 0: offset 1000, length 500
        (1500, 750),   # Entry 1: offset 1500, length 750
        (2250, 1000)   # Entry 2: offset 2250, length 1000
    ]
)
# Output: Creating archive with 3 files...
#         Archive: data.taco (15,432 bytes)
```

### Read metadata

```python
# Read from local file
entries = tacozip.read_header("data.taco")
print(entries)
# Output: [(1000, 500), (1500, 750), (2250, 1000)]

# Read from HTTP range request
import requests
r = requests.get(
    "https://cdn.example.com/data.taco",
    headers={"Range": "bytes=0-164"}
)
entries = tacozip.read_header(r.content)
print(entries)
# Output: [(1000, 500), (1500, 750), (2250, 1000)]
```

### Update metadata (in-place)

```python
# Update metadata without rewriting entire archive
tacozip.update_header(
    "data.taco",
    entries=[
        (1000, 600),   # Updated length for entry 0
        (1600, 800),   # Updated offset and length for entry 1
        (2400, 1100)   # Updated values for entry 2
    ]
)
# Only writes 3 locations: ~200 bytes total
```

### Detect archive format

```python
from tacozip import detect_format, TACOZIP_FORMAT_ZIP32, TACOZIP_FORMAT_ZIP64

format_type = detect_format("data.taco")

if format_type == TACOZIP_FORMAT_ZIP32:
    print("Standard ZIP32 format (< 4GB)")
elif format_type == TACOZIP_FORMAT_ZIP64:
    print("ZIP64 format (>= 4GB)")
```

### Validate archive integrity

```python
from tacozip import (
    validate,
    TACOZ_VALID,
    TACOZ_INVALID_NO_TACO,
    TACOZIP_VALIDATE_QUICK,
    TACOZIP_VALIDATE_NORMAL,
    TACOZIP_VALIDATE_DEEP
)
from tacozip.config import VALIDATION_ERROR_MESSAGES

# Quick validation (header checks only)
result = validate("data.taco", TACOZIP_VALIDATE_QUICK)

# Normal validation (header + structure)
result = validate("data.taco", TACOZIP_VALIDATE_NORMAL)

# Deep validation (header + structure + CRC32)
result = validate("data.taco", TACOZIP_VALIDATE_DEEP)

if result == TACOZ_VALID:
    print("Archive is valid")
elif result == TACOZ_INVALID_NO_TACO:
    print("WARNING: File modified by external tool")
    print("TACO_HEADER missing or corrupted")
else:
    error_msg = VALIDATION_ERROR_MESSAGES.get(result, "Unknown error")
    print(f"Validation failed: {error_msg}")
```

## API function reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `create(zip_path, src_files, arc_files, entries)` | Create new archive with TACO header | None (raises on error) |
| `read_header(source)` | Read metadata from file or buffer | `List[Tuple[int, int]]` |
| `update_header(zip_path, entries)` | Update metadata in-place | None (raises on error) |
| `detect_format(zip_path)` | Identify ZIP32 vs ZIP64 format | `int` (format constant) |
| `validate(zip_path, level)` | Check archive integrity | `int` (validation result) |
| `get_library_version()` | Get native library version | `str` |
| `self_check()` | Verify library functionality | None (raises on error) |



## Understanding metadata entries

Metadata entries are `(offset, length)` pairs representing regions of interest within archived files. This is the core feature that enables efficient partial file access.

### Common use cases

```python
# Parquet file with row groups
tacozip.create(
    "dataset.taco",
    files=["data.parquet"],
    entries=[
        (4096, 1048576),    # Row group 0: 1MB at offset 4KB
        (1052672, 1048576), # Row group 1: 1MB at offset ~1MB
        (2101248, 524288)   # Row group 2: 512KB at offset ~2MB
    ]
)

# Later: Read only row group 1 via HTTP
# GET dataset.taco Range: bytes=1052672-2101247
```

### Constraints

- Maximum 7 entries per archive
- Each entry: 16 bytes (8-byte offset + 8-byte length)
- Entries can overlap or be non-contiguous
- Zero entries allowed: `entries=[(0, 0)]` (placeholder)

### Access patterns

```python
# Read metadata (165 bytes)
entries = tacozip.read_header("dataset.taco")
offset, length = entries[1]  # Get row group 1

# Calculate byte range for HTTP request
start = offset
end = offset + length - 1  # HTTP ranges are inclusive
headers = {"Range": f"bytes={start}-{end}"}

# Fetch specific segment
import requests
response = requests.get("https://cdn.example.com/dataset.taco", headers=headers)
data = response.content  # Only row group 1 downloaded
```

## Error handling

All Python functions raise `TacozipError` or subclasses on failure:

```python
from tacozip import TacozipError, create

try:
    create("output.taco", files=["missing.txt"])
except TacozipError as e:
    print(f"Error code: {e.code}")
    print(f"Message: {e}")
    # Error code: -1
    # Message: tacozip error -1: I/O error (open/read/write/close/flush)
```

### Exception hierarchy

```
TacozipError (base)
├─> TacozipIOError          # I/O operations
├─> TacozipValidationError  # Parameter validation
└─> TacozipLibraryError     # Library loading
```

### Error code reference

| Constant | Value | Description |
|----------|-------|-------------|
| `TACOZ_OK` | 0 | Success (no error) |
| `TACOZ_ERR_IO` | -1 | File I/O error (open/read/write/close) |
| `TACOZ_ERR_LIBZIP` | -2 | libzip operation failed |
| `TACOZ_ERR_INVALID_HEADER` | -3 | Corrupt or invalid TACO header |
| `TACOZ_ERR_PARAM` | -4 | Invalid function parameter |
| `TACOZ_ERR_NOT_FOUND` | -5 | File not found in archive |
| `TACOZ_ERR_EXISTS` | -6 | File already exists in archive |
| `TACOZ_ERR_TOO_LARGE` | -7 | Archive exceeds 4GB limit |

### Validation error codes

| Constant | Value | Description |
|----------|-------|-------------|
| `TACOZ_VALID` | 0 | Archive is valid |
| `TACOZ_INVALID_NOT_ZIP` | -10 | Missing ZIP signature |
| `TACOZ_INVALID_NO_TACO` | -11 | TACO_HEADER missing at offset 0 |
| `TACOZ_INVALID_HEADER_SIZE` | -12 | Invalid header size |
| `TACOZ_INVALID_META_COUNT` | -13 | Invalid metadata count (must be 0-7) |
| `TACOZ_INVALID_FILE_SIZE` | -14 | File too small to be valid |
| `TACOZ_INVALID_NO_EOCD` | -20 | End of Central Directory not found |
| `TACOZ_INVALID_CD_OFFSET` | -21 | Invalid Central Directory offset |
| `TACOZ_INVALID_NO_CD_ENTRY` | -22 | TACO_HEADER not in Central Directory |
| `TACOZ_INVALID_REORDERED` | -23 | Entries reordered (CD doesn't point to offset 0) |
| `TACOZ_INVALID_CRC_LFH` | -30 | CRC32 mismatch in Local File Header |
| `TACOZ_INVALID_CRC_CD` | -31 | CRC32 mismatch in Central Directory |


## Next steps

**Learn more:**
- [Python Client](client.md) - Python-specific features and cloud integration
- [Use Cases](use-cases.md) - Real-world examples and patterns
- [Python API Reference](python-api-reference.md) - Complete function documentation

**Advanced topics:**
- [TACO Header Format](header.md) - Technical specification
- [FAQ](faq.md) - Common questions and troubleshooting