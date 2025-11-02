# Tacozip

## Purpose and scope

Tacozip is a specialized ZIP archive library optimized for fast metadata access in cloud storage scenarios. It creates standard ZIP archives with a custom TACO Header at byte 0, enabling metadata retrieval via a single 165-byte read operation instead of scanning the entire Central Directory.

**Key innovation**: Traditional ZIP readers must seek to the archive end to read the Central Directory before accessing metadata. Tacozip eliminates this bottleneck by embedding metadata at the file start, enabling efficient HTTP range requests like `Range: bytes=0-164`.

This document covers architecture fundamentals and component relationships. For implementation details, see:
- **TACO header format** - Header structure and serialization
- **C library reference** - Native API documentation  
- **Python client** - Python bindings and usage
- **Getting started** - Installation and examples


## What is `tacozip`?

Tacozip addresses the performance penalty of Central Directory scanning in large ZIP archives accessed over HTTP or cloud storage. The library embeds a TACO Header containing up to 7 metadata entries (offset/length pairs) at the archive start, enabling single-request metadata retrieval.

### Core specifications

| Feature | Value | Rationale |
|---------|-------|-----------|
| **Compression** | STORE only (method 0) | Predictable offsets for range requests |
| **Header size** | 165 bytes fixed | Minimal overhead, single-read access |
| **Metadata capacity** | 7 entries maximum | Balances flexibility with size constraints |
| **Archive limit** | 4GB (no ZIP64) | Simplified implementation, common case optimization |
| **ZIP backend** | libzip 1.11.4 | Production-proven ZIP operations |
| **CRC32** | zlib 1.3.1 | Fast integrity verification |

**Design constraints**:
- Read-optimized: Prioritizes fast metadata access over write performance
- Cloud-native: HTTP range request compatible by design
- Standard-compliant: Regular ZIP format, readable by all ZIP tools


## TACO header

The TACO Header is a 165-byte structure at offset 0 containing up to 7 metadata entries (offset/length pairs). It appears as a regular ZIP entry to maintain compatibility with standard tools.

**Key benefits:**
- **Single-read access**: One 165-byte read retrieves all metadata
- **Efficient updates**: Only ~200 bytes written, regardless of archive size
- **HTTP friendly**: `Range: bytes=0-164` retrieves complete metadata in one request

For complete header specification, see [TACO Header Format](header.md).

## Architecture

Tacozip uses a layered architecture separating low-level ZIP manipulation from high-level bindings.

### Component stack

```
┌───────────────────────────────────────────────────┐
│ Application Layer                                 │
│ (User Code)                                       │
└───────────────────────────────────────────────────┘
                    │
┌───────────────────────────────────────────────────┐
│ Python API Layer                                  │
│ - Public functions (create, read_header, etc.)    │
│ - Parameter validation                            │
│ - Error handling                                  │
└───────────────────────────────────────────────────┘
                    │
┌───────────────────────────────────────────────────┐
│ FFI Layer (ctypes bindings)                       │
│ - C structure definitions                         │
│ - Function signatures                             │
│ - Data marshaling                                 │
└───────────────────────────────────────────────────┘
                    │
┌───────────────────────────────────────────────────┐
│ Native Library (C + libzip)                       │
│ - ZIP manipulation logic                          │
│ - Header serialization                            │
│ - File I/O operations                             │
└───────────────────────────────────────────────────┘
```

### Dual API strategy

Tacozip provides two API levels for different use cases:

**High-Level API** (Convenience):
- `tacozip_create()` - Create archive from files
- `tacozip_read_header()` - Read header from file  
- `tacozip_update_header()` - Update header in file

**Low-Level API** (Zero-Copy):
- `tacozip_parse_header()` - Parse header from buffer
- `tacozip_serialize_header()` - Serialize header to buffer

The low-level API operates on memory buffers without I/O, enabling custom storage backends (S3, Azure Blob, etc.) and zero-copy optimizations.


## Core components

### Native C library

The C library (`src/tacozip.c`) implements all ZIP operations:

| Function | Purpose | Key Operations |
|----------|---------|----------------|
| `tacozip_create` | Create archive | libzip integration, STORE compression enforcement |
| `tacozip_read_header` | Read from file | 165-byte read, delegates to parse function |
| `tacozip_parse_header` | Parse from buffer | LFH validation, metadata extraction |
| `tacozip_serialize_header` | Serialize to buffer | CRC32 computation, LFH construction |
| `tacozip_update_header` | Update in file | Atomic 3-location write |
| `tacozip_detect_format` | Detect ZIP32/ZIP64 | Format identification for validation |
| `tacozip_validate` | Integrity check | 3-level validation (quick/normal/deep) |

**Performance optimizations**:
- Direct file manipulation bypasses libzip for updates
- Minimal writes (only changed bytes, not full structures)
- 1MB copy buffers for efficient file operations
- Adaptive Central Directory search based on file size

### Python client

The Python package (`clients/python/tacozip/`) provides high-level bindings:

```
tacozip/
├── __init__.py       # Public API exports
├── bindings.py       # ctypes FFI layer
├── loader.py         # Library loading and discovery
├── config.py         # Constants and error codes
├── exceptions.py     # Error handling
└── version.py        # Version detection
```

**Layer responsibilities**:
1. **Public API** (`__init__.py`): User-facing functions, parameter validation
2. **FFI layer** (`bindings.py`): ctypes structures, function signatures, marshaling
3. **Loader** (`loader.py`): Cross-platform library loading
4. **Config** (`config.py`): Constants shared with C layer

### Data flow: create operation

```
User Code
    │
    ├─> create(zip_path, files, entries)
    │
Python API Layer
    │
    ├─> Validate inputs
    ├─> Prepare ctypes arrays
    │
FFI Layer
    │
    ├─> Marshal to C types
    ├─> Call tacozip_create()
    │
C Library
    │
    ├─> zip_open() [libzip]
    ├─> Add TACO_HEADER entry
    ├─> Add user files (STORE only)
    ├─> zip_close() [libzip]
    │
    └─> Return status code
```

## Key design decisions

### 1. STORE-only compression

**Decision**: Enforce `ZIP_CM_STORE` (compression method 0) for all entries.

**Rationale**: 
- Predictable file offsets enable efficient HTTP range requests
- Zero decompression overhead for cloud workloads
- Simplified implementation without compression algorithm management

**Trade-off**: Larger archive sizes vs. faster access and simpler code

### 2. Fixed 165-byte header

**Decision**: TACO Header is exactly 165 bytes (30 LFH + 19 filename + 116 payload).

**Rationale**:
- Single read operation retrieves complete metadata
- Updates don't require rewriting surrounding structures
- Compatible with standard ZIP readers (appears as regular entry)

**Trade-off**: Fixed size limits metadata capacity vs. update efficiency

### 3. No ZIP64 support

**Decision**: Limit archives to 4GB, no ZIP64 format support.

**Rationale**:
- Simplified implementation (ZIP64 adds significant complexity)
- 4GB covers vast majority of use cases
- Reduced code size and maintenance burden

**Trade-off**: Cannot create >4GB archives vs. simpler codebase

### 4. Maximum 7 metadata entries

**Decision**: Support up to 7 offset/length pairs in header.

**Rationale**:
- Keeps payload at 116 bytes (fits with 165-byte total)
- Sufficient for common scenarios (multiple Parquet files, etc.)
- Enables efficient in-place updates

**Trade-off**: Limited metadata capacity vs. compact header size

### 5. Direct file manipulation

**Decision**: Bypass libzip for `update_header` and `validate` operations.

**Rationale**:
- Atomic updates with rollback capability
- Minimal rewrites (only changed bytes)
- Fine-grained control over ZIP structures

**Trade-off**: More complex C code vs. better performance

### 6. Build from source strategy

**Decision**: Build libzip from source in CI/CD instead of using system libraries.

**Rationale**:
- Version consistency across platforms
- Controlled dependency management
- Reproducible builds

**Trade-off**: Longer build times vs. consistent behavior


## Implementation highlights

### Memory management

**Stack allocation** for fixed-size structures:
- TACO Header uses 165-byte stack buffer
- Predictable memory footprint

**Heap allocation** with explicit cleanup:
- Central Directory buffer allocated dynamically
- Cleanup via `goto fail` pattern for error paths

**Python GC safety**:
- ctypes structures maintain references during calls
- Prevents premature garbage collection of buffers

### Error handling

Consistent patterns across layers:

| Layer | Mechanism | Example |
|-------|-----------|---------|
| **C library** | Integer return codes | `TACOZ_OK (0)`, `TACOZ_ERR_IO (-1)` |
| **Python bindings** | Exceptions | `TacozipError`, `TacozipIOError` |
| **CI/CD** | Exit codes | Non-zero exit on failures |

**Error propagation**: C errors → Python exceptions → User code

### Platform compatibility

**Cross-platform support**:
- Preprocessor directives for platform-specific code
- CMake feature detection (`posix_fallocate`, etc.)
- Dynamic library naming (`.so`, `.dylib`, `.dll`)

**Tested platforms**:
- Linux (x86_64, ARM64)
- macOS (Intel, Apple Silicon)  
- Windows (x64)

## Performance characteristics

### Read operations

- **Header read**: O(1) - Single 165-byte read at offset 0
- **File access**: O(1) - Direct seek using metadata offsets
- **Full scan**: Not required - Metadata available immediately

### Write operations

- **Archive creation**: O(n) in number of files
- **Header update**: O(1) - Writes 3 locations regardless of archive size
- **Validation**: O(n) in validation level (quick/normal/deep)

### Comparison with standard ZIP

| Operation | Standard ZIP | Tacozip |
|-----------|--------------|---------|
| Metadata access | Seek to end, scan CD | Read 165 bytes at offset 0 |
| HTTP requests for metadata | 2+ (end, then CD) | 1 (range request) |
| Compression overhead | Variable | Zero (STORE only) |
| Archive size limit | 4GB / 16EB (ZIP64) | 4GB |



## Next steps

**For Python users:**
- Start with [Getting Started](getting-started.md) for installation and basic usage
- Review [Python Client](client.md) for Python-specific features
- See [Use Cases](use-cases.md) for real-world examples

**For C developers:**
- Read [C API Reference](#) for native library details
- Study [TACO Header Format](header.md) for specification details

**For contributors:**
- Review [Contributing Guidelines](CONTRIBUTING.md) for code standards