# Python API Reference

Complete reference for all public functions in the tacozip Python client.

## Functions

### create()

Create a new TACO archive with optional metadata entries.

**Signature:**
```python
def create(
    zip_path: str,
    src_files: List[Union[str, pathlib.Path]],
    arc_files: Optional[List[str]] = None,
    entries: Optional[List[Tuple[int, int]]] = None
) -> None
```

**Parameters:**
- `zip_path` (str): Output archive path
- `src_files` (List[Union[str, Path]]): Source files to archive
- `arc_files` (Optional[List[str]]): Names for files in archive. If None, uses basenames from src_files
- `entries` (Optional[List[Tuple[int, int]]]): Metadata entries as (offset, length) pairs. Max 7 entries. If None, uses [(0, 0)]

**Returns:** None

**Raises:**
- `TacozipError`: On any error during creation
- `ValueError`: If len(arc_files) != len(src_files) when arc_files is provided
- `ValueError`: If len(entries) > 7

**Examples:**
```python
# Basic usage
tacozip.create("output.taco", ["file1.txt", "file2.txt"])

# With custom archive names
tacozip.create(
    "output.taco",
    src_files=["./data/train.parquet", "./data/test.parquet"],
    arc_files=["training.parquet", "testing.parquet"]
)

# With metadata entries
tacozip.create(
    "output.taco",
    src_files=["data.parquet"],
    entries=[(4096, 1048576), (1052672, 1048576)]
)
```



### read_header()

Read metadata entries from TACO Header. Supports both file paths and bytes buffers.

**Signature:**
```python
def read_header(
    source: Union[str, bytes, pathlib.Path]
) -> List[Tuple[int, int]]
```

**Parameters:**
- `source` (Union[str, bytes, Path]): Either file path OR bytes buffer (minimum 157 bytes)

**Returns:** List[Tuple[int, int]] - List of (offset, length) metadata entries

**Raises:**
- `TacozipError`: On read/parse errors
- `ValueError`: If bytes buffer is < 157 bytes

**Examples:**
```python
# From file
entries = tacozip.read_header("archive.taco")

# From bytes (HTTP)
import requests
r = requests.get(url, headers={"Range": "bytes=0-164"})
entries = tacozip.read_header(r.content)

# From bytes (S3)
import boto3
s3 = boto3.client('s3')
obj = s3.get_object(Bucket='bucket', Key='file.taco', Range='bytes=0-164')
entries = tacozip.read_header(obj['Body'].read())
```


### update_header()

Update metadata entries in existing TACO archive (in-place).

**Signature:**
```python
def update_header(
    zip_path: str,
    entries: List[Tuple[int, int]]
) -> None
```

**Parameters:**
- `zip_path` (str): Path to existing archive
- `entries` (List[Tuple[int, int]]): New metadata entries (max 7)

**Returns:** None

**Raises:**
- `TacozipError`: On update errors
- `ValueError`: If len(entries) > 7

**Performance:** Writes only ~200 bytes regardless of archive size

**Example:**
```python
# Update metadata
tacozip.update_header("archive.taco", [(1000, 500), (1500, 750)])
```


### detect_format()

Detect if archive is ZIP32 or ZIP64 format.

**Signature:**
```python
def detect_format(zip_path: str) -> int
```

**Parameters:**
- `zip_path` (str): Path to archive

**Returns:** int - Format constant:
- `TACOZIP_FORMAT_ZIP32` (1): Standard ZIP
- `TACOZIP_FORMAT_ZIP64` (2): ZIP64 format
- `TACOZIP_FORMAT_UNKNOWN` (0): Cannot determine

**Example:**
```python
from tacozip import detect_format, TACOZIP_FORMAT_ZIP32, TACOZIP_FORMAT_ZIP64

fmt = detect_format("archive.taco")
if fmt == TACOZIP_FORMAT_ZIP32:
    print("Standard ZIP32")
elif fmt == TACOZIP_FORMAT_ZIP64:
    print("ZIP64 format")
```

### validate()

Validate TACO archive integrity with multiple levels.

**Signature:**
```python
def validate(
    zip_path: str,
    level: int = TACOZIP_VALIDATE_NORMAL
) -> int
```

**Parameters:**
- `zip_path` (str): Path to archive
- `level` (int): Validation level:
  - `TACOZIP_VALIDATE_QUICK` (0): Header checks only (~1ms)
  - `TACOZIP_VALIDATE_NORMAL` (1): Header + structure checks (~10ms)
  - `TACOZIP_VALIDATE_DEEP` (2): Full validation including CRC32 (~100ms)

**Returns:** int - Validation result:
- `TACOZ_VALID` (0): Archive is valid
- Negative value: Error code (see validation error codes)

**Example:**
```python
from tacozip import validate, TACOZ_VALID, TACOZIP_VALIDATE_DEEP
from tacozip.config import VALIDATION_ERROR_MESSAGES

result = validate("archive.taco", TACOZIP_VALIDATE_DEEP)
if result == TACOZ_VALID:
    print("Valid archive")
else:
    print(f"Error: {VALIDATION_ERROR_MESSAGES[result]}")
```


### get_library_version()

Get native C library version string.

**Signature:**
```python
def get_library_version() -> str
```

**Returns:** str - Version string (e.g., "0.11.4")

**Example:**
```python
import tacozip
print(f"C library version: {tacozip.get_library_version()}")
```



### self_check()

Verify native library is loaded and functional.

**Signature:**
```python
def self_check() -> None
```

**Returns:** None

**Raises:**
- `TacozipLibraryError`: If library not loaded or functions missing

**Example:**
```python
import tacozip
try:
    tacozip.self_check()
    print("Library OK")
except tacozip.TacozipLibraryError as e:
    print(f"Library error: {e}")
```


## Constants

### Error codes

| Constant | Value | Description |
|----------|-------|-------------|
| `TACOZ_OK` | 0 | Success |
| `TACOZ_ERR_IO` | -1 | I/O error |
| `TACOZ_ERR_LIBZIP` | -2 | libzip error |
| `TACOZ_ERR_INVALID_HEADER` | -3 | Invalid TACO header |
| `TACOZ_ERR_PARAM` | -4 | Invalid parameter |
| `TACOZ_ERR_NOT_FOUND` | -5 | File not found |
| `TACOZ_ERR_EXISTS` | -6 | File exists |
| `TACOZ_ERR_TOO_LARGE` | -7 | Archive > 4GB |

### Format constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TACOZIP_FORMAT_UNKNOWN` | 0 | Cannot determine format |
| `TACOZIP_FORMAT_ZIP32` | 1 | Standard ZIP |
| `TACOZIP_FORMAT_ZIP64` | 2 | ZIP64 format |

### Validation levels

| Constant | Value | Description | Speed |
|----------|-------|-------------|-------|
| `TACOZIP_VALIDATE_QUICK` | 0 | Header checks only | ~1ms |
| `TACOZIP_VALIDATE_NORMAL` | 1 | Header + structure | ~10ms |
| `TACOZIP_VALIDATE_DEEP` | 2 | Full + CRC32 | ~100ms |

### Validation results

| Constant | Value | Description |
|----------|-------|-------------|
| `TACOZ_VALID` | 0 | Archive valid |
| `TACOZ_INVALID_NOT_ZIP` | -10 | Not a ZIP file |
| `TACOZ_INVALID_NO_TACO` | -11 | No TACO header |
| `TACOZ_INVALID_HEADER_SIZE` | -12 | Invalid header size |
| `TACOZ_INVALID_META_COUNT` | -13 | Invalid metadata count |
| `TACOZ_INVALID_FILE_SIZE` | -14 | File too small |
| `TACOZ_INVALID_NO_EOCD` | -20 | No End of Central Directory |
| `TACOZ_INVALID_CD_OFFSET` | -21 | Invalid CD offset |
| `TACOZ_INVALID_NO_CD_ENTRY` | -22 | TACO_HEADER not in CD |
| `TACOZ_INVALID_REORDERED` | -23 | Entries reordered |
| `TACOZ_INVALID_CRC_LFH` | -30 | CRC32 mismatch (LFH) |
| `TACOZ_INVALID_CRC_CD` | -31 | CRC32 mismatch (CD) |

### Header constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TACO_HEADER_MAX_ENTRIES` | 7 | Maximum metadata entries |


## Exceptions

### TacozipError

Base exception for all tacozip errors.

**Attributes:**
- `code` (int): Error code

**Example:**
```python
try:
    tacozip.create("output.taco", ["missing.txt"])
except tacozip.TacozipError as e:
    print(f"Error {e.code}: {e}")
```

### TacozipIOError

I/O related errors (inherits from TacozipError).

### TacozipValidationError

Parameter validation errors (inherits from TacozipError).

### TacozipLibraryError

Native library loading errors (inherits from TacozipError).


## Type Hints

All functions include complete type hints for use with mypy/pyright:

```python
from typing import List, Tuple, Union, Optional
import pathlib

def create(
    zip_path: str,
    src_files: List[Union[str, pathlib.Path]],
    arc_files: Optional[List[str]] = None,
    entries: Optional[List[Tuple[int, int]]] = None
) -> None: ...

def read_header(
    source: Union[str, bytes, pathlib.Path]
) -> List[Tuple[int, int]]: ...
```
