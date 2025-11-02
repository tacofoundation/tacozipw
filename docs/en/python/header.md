# TACO Header format

## Purpose and scope

This document provides the complete technical specification of the TACO Header structure. It covers byte-level layout, serialization algorithms, update mechanisms, and implementation patterns.

**Prerequisites**: Familiarity with basic tacozip concepts from [Overview](overview.md). For practical usage examples, see [Getting Started](getting-started.md).

## Header structure

The TACO Header is a 157-byte fixed structure comprising three sections that together form a valid ZIP Local File Header:

```
┌─────────────────────────────────────────────────┐
│ Section          │ Size    │ Content            │
├──────────────────┼─────────┼────────────────────┤
│ Local File Header│ 30 bytes│ ZIP LFH fields     │
│ Filename         │ 11 bytes│ "TACO_HEADER"      │
│ Payload          │ 116 bytes│ Metadata entries  │
└──────────────────┴─────────┴────────────────────┘
Total: 157 bytes at offset 0
```

### Byte-level layout

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0-3 | 4 | LFH Signature | `0x04034b50` (ZIP magic bytes) |
| 4-5 | 2 | Version Needed | 20 (ZIP 2.0) |
| 6-7 | 2 | General Purpose Flag | `0x0000` or `0x0800` (UTF-8) |
| 8-9 | 2 | Compression Method | 0 (STORE - uncompressed) |
| 10-11 | 2 | Last Mod Time | DOS time format |
| 12-13 | 2 | Last Mod Date | DOS date format |
| 14-17 | 4 | CRC-32 | Checksum of 116-byte payload |
| 18-21 | 4 | Compressed Size | 116 |
| 22-25 | 4 | Uncompressed Size | 116 |
| 26-27 | 2 | Filename Length | 11 |
| 28-29 | 2 | Extra Field Length | 0 |
| 30-40 | 11 | Filename | "TACO_HEADER" (ASCII) |
| 41-156 | 116 | Payload | Metadata entries (see below) |


## Payload structure

The 116-byte payload contains the actual metadata:

```
┌────────────────────────────────────────────────┐
│ Offset │ Size │ Field                          │
├────────┼──────┼────────────────────────────────┤
│ 0      │ 1    │ count (0-7)                    │
│ 1-3    │ 3    │ padding (reserved)             │
│ 4-19   │ 16   │ Entry 0 (offset:8 + length:8)  │
│ 20-35  │ 16   │ Entry 1 (offset:8 + length:8)  │
│ 36-51  │ 16   │ Entry 2 (offset:8 + length:8)  │
│ 52-67  │ 16   │ Entry 3 (offset:8 + length:8)  │
│ 68-83  │ 16   │ Entry 4 (offset:8 + length:8)  │
│ 84-99  │ 16   │ Entry 5 (offset:8 + length:8)  │
│ 100-115│ 16   │ Entry 6 (offset:8 + length:8)  │
└────────┴──────┴────────────────────────────────┘
```

### Entry format

Each metadata entry is 16 bytes (little-endian):

| Byte Offset | Size | Field | Type | Description |
|-------------|------|-------|------|-------------|
| 0-7 | 8 | offset | uint64_t | Byte offset in external file |
| 8-15 | 8 | length | uint64_t | Length in bytes |

**Example**: For `count = 3`, entries 0-2 contain valid data; entries 3-6 are ignored but still occupy space in the fixed array.

### C Type definitions

```c
typedef struct {
    uint64_t offset;  // Byte offset in external file
    uint64_t length;  // Length in bytes
} taco_meta_entry_t;

typedef struct {
    uint8_t count;    // Valid entries (0-7)
    taco_meta_entry_t entries[7];  // Fixed array
} taco_meta_array_t;
```


## Entry semantics

Metadata entries are application-defined `(offset, length)` pairs representing byte ranges. Tacozip does not interpret these values.

**Common use cases:**

| Scenario | Entry meaning |
|----------|---------------|
| **Parquet files** | Row group byte ranges |
| **Chunked data** | Chunk boundaries for parallel processing |
| **Index structures** | Pointers to indexed segments |
| **Sharded datasets** | External blob storage references |
| **Tile pyramids** | Geospatial tile level boundaries |

**Constraints:**

| Property | Value | Enforcement |
|----------|-------|-------------|
| Maximum entries | 7 | `TACO_HEADER_MAX_ENTRIES` |
| Entry count range | 0-7 | Validated in `parse_header_payload()` |
| Offset range | 0 to 2^64-1 | Not validated (application-defined) |
| Length range | 0 to 2^64-1 | Not validated (application-defined) |
| Padding bytes | Must be `0x00` | Set during write, not enforced during read |


## ZIP archive context

The TACO Header exists within a standard ZIP archive structure:

```
┌──────────────────────────────────────────┐
│ TACO_HEADER (LFH + filename + payload)   │ ← Offset 0 (157 bytes)
├──────────────────────────────────────────┤
│ File 1 (LFH + filename + data)           │
├──────────────────────────────────────────┤
│ File 2 (LFH + filename + data)           │
├──────────────────────────────────────────┤
│ ...                                      │
├──────────────────────────────────────────┤
│ Central Directory                        │
│   ├─ TACO_HEADER entry                   │
│   ├─ File 1 entry                        │
│   ├─ File 2 entry                        │
│   └─ ...                                 │
├──────────────────────────────────────────┤
│ End of Central Directory (EOCD)          │
└──────────────────────────────────────────┘
```

### ZIP Compliance

The header maintains full ZIP specification compliance:

| Requirement | Implementation |
|-------------|----------------|
| **Valid LFH** | First 30 bytes form standard Local File Header |
| **Legal filename** | "TACO_HEADER" (11 bytes, ASCII) |
| **STORE method** | Compression method 0 with matching sizes |
| **CRC-32** | Calculated over 116-byte payload |
| **Central Directory** | TACO_HEADER appears as regular file entry |
| **Standard extraction** | Can be extracted with any ZIP tool |

When extracted with standard ZIP tools, TACO_HEADER appears as a file containing 116 bytes of binary metadata.



## Parsing and erialization

### Parsing: Bytes → Structure

**Function**: `tacozip_parse_header(buffer, buffer_size, &meta)`

**Algorithm:**

1. **Validate buffer size**: Must be ≥ 157 bytes
2. **Check LFH signature**: Verify `0x04034b50` at offset 0
3. **Verify filename**: Check "TACO_HEADER" at offset 30
4. **Extract payload**: Read 116 bytes starting at offset 41
5. **Parse count**: Read byte 41 (must be 0-7)
6. **Extract entries**: Read 7 × 16 bytes in little-endian format

**Error conditions:**

| Check | Error code | Condition |
|-------|------------|-----------|
| Buffer size | `TACOZ_ERR_PARAM` | `buffer_size < 157` |
| LFH signature | `TACOZ_ERR_INVALID_HEADER` | Not `0x04034b50` |
| Filename | `TACOZ_ERR_INVALID_HEADER` | Not "TACO_HEADER" |
| Entry count | `TACOZ_ERR_INVALID_HEADER` | `count > 7` |

**Little-Endian reading:**

```c
uint64_t read_le64(const unsigned char *buf) {
    return (uint64_t)buf[0]       |
           (uint64_t)buf[1] << 8  |
           (uint64_t)buf[2] << 16 |
           (uint64_t)buf[3] << 24 |
           (uint64_t)buf[4] << 32 |
           (uint64_t)buf[5] << 40 |
           (uint64_t)buf[6] << 48 |
           (uint64_t)buf[7] << 56;
}
```

### Serialization: Structure → Bytes

**Function**: `tacozip_serialize_header(&meta, buffer, buffer_size)`

**Algorithm:**

1. **Validate input**: Check `buffer_size >= 157` and `count <= 7`
2. **Build payload** (116 bytes):
   - Write count byte
   - Write 3 padding bytes (0x00)
   - Write 7 entries in little-endian format
3. **Calculate CRC-32**: Compute checksum over 116-byte payload using zlib
4. **Build LFH** (30 bytes):
   - Signature: `0x04034b50`
   - Version: 20
   - Flags: 0
   - Method: 0 (STORE)
   - CRC-32 from step 3
   - Sizes: both 116
   - Filename length: 11
5. **Write filename**: "TACO_HEADER" (11 bytes)
6. **Write payload**: 116 bytes from step 2

**Output**: Complete 157-byte header in `buffer`


## Update mechanism

A key design feature is efficient in-place metadata updates requiring only 3 writes:

### Update Process

```
┌─────────────────────────────────────────────┐
│ 1. Read existing header (157 bytes)         │
├─────────────────────────────────────────────┤
│ 2. Modify metadata entries in memory        │
├─────────────────────────────────────────────┤
│ 3. Calculate new CRC-32 of payload          │
├─────────────────────────────────────────────┤
│ 4. Write #1: New payload at offset 41       │ (116 bytes)
│ 5. Write #2: New CRC-32 at offset 14        │ (4 bytes)
│ 6. Write #3: New CRC-32 in Central Dir      │ (4 bytes)
└─────────────────────────────────────────────┘
Total writes: 124 bytes
```

### Write operations detail

| Write # | Location | Offset | Size | Data | Purpose |
|---------|----------|--------|------|------|---------|
| 1 | LFH payload | 41 | 116 bytes | Updated metadata | Replace entries |
| 2 | LFH CRC-32 | 14 | 4 bytes | New checksum | Update header CRC |
| 3 | Central Directory | Variable | 4 bytes | New checksum | Update CD entry CRC |

**Performance benefits:**

- ✅ No archive rewrite required
- ✅ No file content rewrite required
- ✅ No Central Directory relocation
- ✅ O(1) time complexity regardless of archive size
- ✅ Works on archives from bytes to gigabytes

**Implementation**: `tacozip_update_header()` in `src/tacozip.c:618-671`


## Design rationale

### Why offset 0?

Positioning at file start enables optimal cloud access patterns:

| Benefit | Explanation |
|---------|-------------|
| **Minimal latency** | First bytes have lowest network round-trip time |
| **Single HTTP request** | `Range: bytes=0-156` retrieves metadata without seeking |
| **S3 efficiency** | Partial download avoids full object retrieval |
| **Predictable access** | No scanning or seeking required |

### Why Fixed 157 bytes?

| Advantage | Impact |
|-----------|--------|
| **Constant-time access** | O(1) read regardless of entry count |
| **Predictable updates** | Always 3 writes (124 bytes) |
| **Static allocation** | No malloc/free overhead |
| **Network efficiency** | Fits in single TCP packet (MTU 1500) |

### Why 7 entries maximum?

Balances multiple constraints:

| Factor | Consideration |
|--------|---------------|
| **Header size** | 7 × 16 + 4 = 116 bytes fits in 157-byte limit |
| **Common use cases** | Most applications need 1-5 chunks |
| **Update efficiency** | Small payload = fast CRC-32 computation |
| **Future expansion** | Reserved padding allows format evolution |

### Why STORE compression?

| Reason | Benefit |
|--------|---------|
| **Predictable offsets** | File positions never shift |
| **Fast access** | No decompression overhead |
| **Append efficiency** | New files added without recompression |
| **Simple CRC-32** | Direct calculation over uncompressed data |

### Why 4GB archive Limit?

| Constraint | Rationale |
|------------|-----------|
| **No ZIP64 support** | Uses standard 32-bit ZIP structures |
| **32-bit offsets** | Central Directory uses 32-bit file positions |
| **32-bit sizes** | LFH and CDH use 32-bit size fields |
| **Simplicity** | Avoids ZIP64 extended information complexity |



## Usage patterns

### Local file access

```c
taco_meta_array_t meta;
int rc = tacozip_read_header("archive.taco", &meta);
if (rc == TACOZ_OK) {
    printf("Entries: %u\n", meta.count);
    for (int i = 0; i < meta.count; i++) {
        printf("  [%d] offset=%llu length=%llu\n",
               i, meta.entries[i].offset, meta.entries[i].length);
    }
}
```

### HTTP range request

```c
unsigned char buffer[200];  // Extra space for safety
http_get_range("https://cdn.example.com/data.taco", 0, 156, buffer);

taco_meta_array_t meta;
int rc = tacozip_parse_header(buffer, 200, &meta);
if (rc == TACOZ_OK) {
    // Use metadata without downloading full archive
    uint64_t offset = meta.entries[0].offset;
    uint64_t length = meta.entries[0].length;
    
    // Download only specific segment
    http_get_range(url, offset, offset + length - 1, data_buffer);
}
```

### S3 partial download

```python
import boto3

s3 = boto3.client('s3')

# Step 1: Get header (157 bytes)
response = s3.get_object(
    Bucket='my-bucket',
    Key='archive.taco',
    Range='bytes=0-156'
)
header_bytes = response['Body'].read()

# Step 2: Parse metadata
import tacozip
entries = tacozip.read_header(header_bytes)

# Step 3: Download specific entry
offset, length = entries[2]
response = s3.get_object(
    Bucket='my-bucket',
    Key='archive.taco',
    Range=f'bytes={offset}-{offset+length-1}'
)
data = response['Body'].read()
```

### Metadata update

```c
taco_meta_array_t meta;
tacozip_read_header("archive.taco", &meta);

// Modify metadata
meta.entries[0].offset = 5000;
meta.entries[0].length = 1000;
meta.entries[1].offset = 6000;
meta.entries[1].length = 2000;

// Update in-place (only 124 bytes written)
tacozip_update_header("archive.taco", &meta);
```


## Constants reference

Defined in `include/tacozip.h`:

| Constant | Value | Description |
|----------|-------|-------------|
| `TACO_HEADER_MAX_ENTRIES` | 7 | Maximum metadata entries |
| `TACO_HEADER_PAYLOAD_SIZE` | 116 | Payload size in bytes |
| `TACO_HEADER_TOTAL_SIZE` | 157 | Complete header size |
| `TACO_HEADER_NAME` | "TACO_HEADER" | Filename in ZIP |
| `TACO_HEADER_NAME_LEN` | 11 | Filename length |

Python equivalents in `clients/python/tacozip/config.py`.


## Error codes

| Code | Value | Description | Returned By |
|------|-------|-------------|-------------|
| `TACOZ_OK` | 0 | Success | All functions |
| `TACOZ_ERR_PARAM` | -4 | Invalid parameters (NULL, buffer too small) | `parse_header`, `serialize_header` |
| `TACOZ_ERR_INVALID_HEADER` | -3 | Invalid signature, filename, or count > 7 | `parse_header`, `read_header` |
| `TACOZ_ERR_IO` | -1 | File I/O error | `read_header`, `update_header` |



## Implementation references

**C Functions:**
- `tacozip_parse_header()` - Parse header from buffer
- `tacozip_serialize_header()` - Serialize header to buffer
- `tacozip_read_header()` - Read header from file
- `tacozip_update_header()` - Update header in file
- `parse_header_payload()` - Internal payload parser
- `read_le64()` - Little-endian uint64 reader

**Python bindings:**
- `tacozip.read_header()` - Python wrapper
- `TacoMetaArray` - ctypes structure definition.
- See [Python API Reference](python-api-reference.md) for details.