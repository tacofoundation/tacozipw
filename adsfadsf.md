Of course\! Here is the complete set of documentation files for `tacozip`, translated into professional, idiomatic English.

-----

### 1\. `introduction.md`

(General overview and installation, inspired by `mrio.md`)

````markdown
# What is tacozip?

`tacozip` is a Python package built on a high-performance C library (`libtacozip`). Its purpose is to create **extremely fast, STORE-only (uncompressed)** ZIP64 archives.

Its flagship feature is an embedded 157-byte **TACO Header** at the beginning of the file. This header allows for storing and **instantly reading custom metadata (up to 7 entries)**, without needing to scan the file.

This makes it ideal for very large data archives in cloud storage, as it allows reading metadata (like Parquet row group offsets) with a single HTTP Range Request.

## Key Features

- **Native C Performance:** The core is written in C for maximum write speed.
- **Simple Python API:** A clean Python wrapper handles the C library interaction.
- **Instant Metadata Header:** Read and write metadata to the 157-byte TACO Header for $O(1)$ access.
- **STORE-only Mode:** Guarantees predictable byte offsets, perfect for HTTP range access.
- **Fully ZIP Compatible:** Generated archives are valid ZIP files that any standard unarchiver can open.
- **Validation Utilities:** Includes functions to verify `tacozip` archive integrity.

# Installation

You can install the `tacozip` library using `pip`:

```bash
pip install tacozip
````

or directly from the GitHub repository:

```bash
pip install git+[https://github.com/tacofoundation/tacozip.git](https://github.com/tacofoundation/tacozip.git)
```

### Building from Source

For development, you can compile the C library and link it locally:

```bash
git clone git@github.com:tacofoundation/tacozip.git
cd tacozip

# Follow repository instructions to compile the C library
# (e.g., cmake, make, etc.)

# Install the Python package in editable mode
pip install -e clients/python/
```

-----

### 2\. `api_reference.md`

(The main API documentation, focusing on the 5 key functions)

````markdown
# Python API Reference

The core `tacozip` API is exposed directly from the package. These functions provide a high-level interface to the underlying `libtacozip` C library.

## `tacozip.create`

Creates a new, STORE-only ZIP archive with an embedded TACO Header.

```python
tacozip.create(
    zip_path: str,
    src_files: List[Union[str, pathlib.Path]],
    arc_files: List[str] = None,
    entries: List[Tuple[int, int]] = None
)
````

**Parameters:**

  - `zip_path` (str): The output path for the ZIP file to be created.
  - `src_files` (List[Union[str, pathlib.Path]]): A list of file paths on disk to be added to the archive.
  - `arc_files` (List[str], optional): A list of names the files will have *inside* the ZIP. If `None`, the base names from `src_files` will be used. Must match the length of `src_files`.
  - `entries` (List[Tuple[int, int]], optional): The metadata list to write into the TACO Header. Must be a list of up to 7 `(offset, length)` tuples. If `None`, a single empty `[(0, 0)]` entry is written.

**Raises:**

  - `TacozipError`: If the C library returns an error (e.g., `TACOZ_ERR_IO`, `TACOZ_ERR_LIBZIP`).
  - `ValueError`: If `arc_files` and `src_files` lengths do not match, or if more than 7 `entries` are provided.

**Example:**

```python
import tacozip
import os

# Create a dummy data file
with open("data.bin", "wb") as f:
    f.write(os.urandom(1000))

# Define metadata (e.g., offset, length)
metadata = [(100, 200), (300, 400)]

# Create the archive
tacozip.create(
    "my_archive.zip",
    src_files=["data.bin"],
    arc_files=["data_in_zip.bin"],
    entries=metadata
)

os.remove("data.bin")
os.remove("my_archive.zip")
```

-----

## `tacozip.read_header`

Reads the metadata entries directly from a file's TACO Header.

This function is extremely fast as it only reads the first \~157 bytes of the file or buffer, enabling metadata access from remote sources (like HTTP or S3) without downloading the entire file.

```python
tacozip.read_header(
    source: Union[str, bytes, pathlib.Path]
) -> List[Tuple[int, int]]
```

**Parameters:**

  - `source` (Union[str, bytes, pathlib.Path]): The source to read from.
      - `str` or `pathlib.Path`: A local filesystem path.
      - `bytes`: A byte buffer containing *at least* the first 157 bytes of the file.

**Returns:**

A list of `(offset, length)` tuples representing the metadata entries.

**Raises:**

  - `TacozipError`: If the header is invalid or cannot be read.
  - `ValueError`: If the source is `bytes` and is smaller than 157 bytes.

**Example (From file):**

```python
# Assuming "my_archive.zip" was created with metadata
entries = tacozip.read_header("my_archive.zip")
print(f"Metadata entries: {entries}")
# >>> Metadata entries: [(100, 200), (300, 400)]
```

**Example (From remote URL):**

```python
import requests
import tacozip

# We only download the first 200 bytes
url = "https://example.com/remote_archive.zip"
headers = {"Range": "bytes=0-199"}
r = requests.get(url, headers=headers)

if r.status_code == 206: # Partial Content
    # We read the metadata directly from the byte buffer
    entries = tacozip.read_header(r.content)
    print(f"Remote metadata: {entries}")
```

-----

## `tacozip.update_header`

Updates (overwrites) the metadata entries in an existing ZIP file's TACO Header. This operation is in-place and extremely fast.

```python
tacozip.update_header(
    zip_path: str,
    entries: List[Tuple[int, int]]
)
```

**Parameters:**

  - `zip_path` (str): The path to the existing ZIP file to update.
  - `entries` (List[Tuple[int, int]]): The *new* metadata list to write. This will overwrite all existing entries. Must be 7 or fewer entries.

**Raises:**

  - `TacozipError`: If the file does not exist or the write fails.
  - `ValueError`: If more than 7 `entries` are provided.

**Example:**

```python
# Update the metadata in the archive
new_metadata = [(999, 100), (888, 200)]
tacozip.update_header("my_archive.zip", new_metadata)

# Verify the update
print(tacozip.read_header("my_archive.zip"))
# >>> [(999, 100), (888, 200)]
```

-----

## `tacozip.validate`

Validates the integrity of a `tacozip` archive at different levels of depth.

```python
tacozip.validate(
    zip_path: str,
    level: int = TACOZIP_VALIDATE_NORMAL
) -> int
```

**Parameters:**

  - `zip_path` (str): The path to the ZIP file to validate.
  - `level` (int, optional): The validation level to perform.
      - `tacozip.TACOZIP_VALIDATE_QUICK`: (Level 0) Checks the TACO header only. Very fast.
      - `tacozip.TACOZIP_VALIDATE_NORMAL`: (Level 1) Header checks + structure (EOCD, Central Directory).
      - `tacozip.TACOZIP_VALIDATE_DEEP`: (Level 2) All previous checks + CRC32 validation (slower).

**Returns:**

An integer status code.

  - `tacozip.TACOZ_VALID` (0): The file is valid.
  - Any other negative value (e.g., `TACOZ_INVALID_NO_TACO`): Indicates a specific validation error.

::: tip
See the [Archive Validation](https://www.google.com/search?q=validation.md) page for a full list of all validation return codes.
:::

**Example:**

```python
import tacozip

result = tacozip.validate("my_archive.zip")

if result == tacozip.TACOZ_VALID:
    print("Archive is valid!")
else:
    print(f"Validation failed with code: {result}")
```

-----

## `tacozip.get_library_version`

Gets the version string of the underlying `libtacozip` C library.

This is useful for debugging and ensuring the Python wrapper and compiled C library versions match.

```python
tacozip.get_library_version() -> str
```

**Returns:**

A string representing the C library version (e.g., "0.1.0").

**Example:**

```python
py_version = tacozip.__version__
c_version = tacozip.get_library_version()

print(f"Python wrapper version: {py_version}")
print(f"C library version: {c_version}")
```

-----

## `tacozip.self_check`

Performs a self-check to ensure the native C library was loaded correctly and all required functions are available to the Python wrapper.

```python
tacozip.self_check()
```

**Raises:**

  - `TacozipLibraryError`: If the native library could not be found or if any essential function (e.g., `tacozip_create`) is missing.

**Example:**

```python
try:
    tacozip.self_check()
    print("tacozip library loaded successfully.")
except tacozip.TacozipLibraryError as e:
    print(f"Failed to load tacozip library: {e}")
```

-----

### 3\. `validation.md`

(A dedicated page for validation codes, inspired by `validation.md`)

````markdown
# Archive Validation

The `tacozip` library provides a utility function to validate the integrity of a `tacozip` archive.

## `tacozip.validate`

It checks an archive for corruption or external modifications that might have invalidated the `tacozip` format.

```python
tacozip.validate(zip_path: str, level: int = TACOZIP_VALIDATE_NORMAL) -> int
````

**Parameters:**

  - `zip_path`: The path of the file to validate.
  - `level`: The depth of the validation check.

### Validation Levels

You can choose how deep the validation should be:

  - `tacozip.TACOZIP_VALIDATE_QUICK` (0): Checks the TACO header signature only. This is the fastest.
  - `tacozip.TACOZIP_VALIDATE_NORMAL` (1): Performs `QUICK` checks plus ZIP structural validation (EOCD, Central Directory).
  - `tacozip.TACOZIP_VALIDATE_DEEP` (2): Performs `NORMAL` checks plus CRC32 validation on the Central Directory. This is the slowest but most thorough.

### Validation Return Codes

The function returns an integer code. `TACOZ_VALID` (0) indicates success. Any other code indicates a problem.

| Return Code | Constant Name | Description |
| :--- | :--- | :--- |
| 0 | `TACOZ_VALID` | Valid TACO archive. |
| -10 | `TACOZ_INVALID_NOT_ZIP` | Not a ZIP file (missing LFH signature). |
| -11 | `TACOZ_INVALID_NO_TACO` | No `TACO_HEADER` at offset 0 (file modified by external tool). |
| -12 | `TACOZ_INVALID_HEADER_SIZE` | Invalid header size (corrupted). |
| -13 | `TACOZ_INVALID_META_COUNT` | Invalid metadata count (must be 0-7). |
| -14 | `TACOZ_INVALID_FILE_SIZE` | File too small to be a valid archive. |
| -20 | `TACOZ_INVALID_NO_EOCD` | No End of Central Directory record found. |
| -21 | `TACOZ_INVALID_CD_OFFSET` | Invalid Central Directory offset. |
| -22 | `TACOZ_INVALID_NO_CD_ENTRY`| `TACO_HEADER` not found in Central Directory. |
| -23 | `TACOZ_INVALID_REORDERED` | Archive entries reordered (CD doesn't point to offset 0). |
| -30 | `TACOZ_INVALID_CRC_LFH` | CRC32 mismatch in Local File Header. |
| -31 | `TACOZ_INVALID_CRC_CD` | CRC32 mismatch in Central Directory. |

**Example:**

```python
import tacozip

# You can import the error messages for better debugging
from tacozip.config import VALIDATION_ERROR_MESSAGES

archive_path = "my_archive.zip"
result = tacozip.validate(archive_path, level=tacozip.TACOZIP_VALIDATE_DEEP)

if result == tacozip.TACOZ_VALID:
    print(f"{archive_path} is valid.")
else:
    error_message = VALIDATION_ERROR_MESSAGES.get(result, "Unknown validation error")
    print(f"Validation FAILED: {error_message} (Code: {result})")
```

-----

### 4\. `examples.md`

(Practical use-cases, inspired by `examples.md`)

````markdown
# Examples

## 1. Writing an Archive with Parquet Row Group Metadata

The primary use case for `tacozip` is to archive large data files (like Parquet) and store the offsets of their internal chunks (like Row Groups) in the TACO Header.

This example simulates that workflow:

```python
import tacozip
import os

# --- Simulation ---
# 1. Create a dummy data file (simulating a Parquet file)
file_to_archive = "data.parquet"
with open(file_to_archive, "wb") as f:
    f.write(os.urandom(500_000)) # 500k dummy bytes

# 2. Define metadata (offsets and lengths of Row Groups)
#    These values would normally come from your Parquet library.
metadata_entries = [
    (4, 150_000),      # Row Group 0 (offset, length)
    (150_004, 200_000), # Row Group 1
    (350_004, 149_996)  # Row Group 2
]

# --- Using tacozip ---
archive_file = "my_data_archive.zip"

print(f"Creating archive: {archive_file}")
tacozip.create(
    archive_file,
    [file_to_archive],
    [file_to_archive], # Name of the file inside the ZIP
    metadata_entries
)

print("Archive created successfully.")

# 4. Verify the header
entries = tacozip.read_header(archive_file)
print(f"Read back entries: {entries}")

# 5. Cleanup
os.remove(file_to_archive)
os.remove(archive_file)
````

## 2\. Reading Metadata from a Remote File (HTTP Range Request)

The key feature of `read_header` is its ability to operate on byte buffers. This allows you to read the metadata from a file in S3, GCS, or any HTTP server without downloading the entire file.

```python
import tacozip
import requests

# URL of an example tacozip file (replace with a real URL)
# URL = "https://my-bucket.s3.amazonaws.com/large_dataset.zip"
# We'll simulate with a local file for now.

# --- First, let's create a local file to simulate the server ---
import os
local_file = "temp_server_file.zip"
simulated_metadata = [(123, 456), (789, 101112)]
with open("dummy.bin", "wb") as f: f.write(os.urandom(100))
tacozip.create(local_file, ["dummy.bin"], ["dummy.bin"], simulated_metadata)
# -----------------------------------------------------------------


# --- HTTP Client Simulation ---
print("\n--- HTTP Client Simulation ---")

# 1. The client only requests the first 200 bytes
#    (We only need ~157 bytes for the header)
try:
    with open(local_file, "rb") as f:
        http_range_bytes = f.read(200)

    # 2. The client passes the received bytes to read_header
    entries = tacozip.read_header(http_range_bytes)
    
    print(f"Successfully read metadata from byte buffer:")
    print(entries)
    
    assert entries == simulated_metadata

except FileNotFoundError:
    print("Example skipped (local file not found)")
except ImportError:
    print("Example skipped (requests not installed)")
except Exception as e:
    print(f"An error occurred: {e}")
    
# --- Cleanup ---
os.remove("dummy.bin")
os.remove(local_file)
```

-----

### 5\. `constants_and_exceptions.md`

(A reference for exported codes and errors, inspired by `attributes.md`)

```markdown
# Constants and Exceptions

The `tacozip` package exports several constants and exception classes that are useful for error handling and validation.

## Exceptions

The library raises subclasses of `TacozipError` when the underlying C library returns an error code.

- **`TacozipError(code, message)`**: Base exception.
    - `.code` (int): The numeric error code (e.g., -1, -2).
    - `.message` (str): The descriptive error message.
- `TacozipIOError`: Inherits from `TacozipError`. Raised for I/O errors (`TACOZ_ERR_IO`).
- `TacozipValidationError`: Inherits from `TacozipError`. Raised for invalid parameters (`TACOZ_ERR_PARAM`).
- `TacozipLibraryError`: Raised if there is a problem loading the native C library or finding its functions.

## Error Codes

These status codes are returned by the C library and are available as Python constants.

| Constant | Code | Description |
| :--- | :--- | :--- |
| `TACOZ_OK` | 0 | Success, no error. |
| `TACOZ_ERR_IO` | -1 | I/O error (open/read/write/close/flush). |
| `TACOZ_ERR_LIBZIP` | -2 | An internal error occurred in `libzip`. |
| `TACOZ_ERR_INVALID_HEADER` | -3 | Malformed or unexpected header bytes. |
| `TACOZ_ERR_PARAM` | -4 | Invalid argument(s) passed to a function. |
| `TACOZ_ERR_NOT_FOUND` | -5 | File not found in archive. |
| `TACOZ_ERR_EXISTS` | -6 | File already exists in archive. |
| `TACOZ_ERR_TOO_LARGE` | -7 | Archive too large. |

## Format Detection Constants

Used by `tacozip.detect_format()`.

| Constant | Code | Description |
| :--- | :--- | :--- |
| `TACOZIP_FORMAT_UNKNOWN` | 0 | Could not determine format. |
| `TACOZIP_FORMAT_ZIP32` | 1 | Standard ZIP32 file. |
| `TACOZIP_FORMAT_ZIP64` | 2 | ZIP64 file. |

## Validation Constants

Used by `tacozip.validate()`.

| Constant | Code | Description |
| :--- | :--- | :--- |
| `TACOZIP_VALIDATE_QUICK` | 0 | Level 1: Header checks only. |
| `TACOZIP_VALIDATE_NORMAL` | 1 | Level 2: Header + structure checks. |
| `TACOZIP_VALIDATE_DEEP` | 2 | Level 3: All levels + CRC32 validation. |

(For a full list of validation *return* codes, see the [Archive Validation](validation.md) page).

## Header Constants

| Constant | Value | Description |
| :--- | :--- | :--- |
| `TACO_HEADER_MAX_ENTRIES` | 7 | The maximum number of `(offset, length)` entries allowed. |
| `TACO_HEADER_SIZE` | 157 | The total size in bytes of the TACO Header. |
```