# FAQ

Frequently asked questions about tacozip.

## General

### What is tacozip?

Tacozip is a specialized ZIP library that adds a 165-byte metadata header at the beginning of ZIP archives. This enables single-request metadata retrieval - crucial for cloud storage scenarios where you need to know what's in an archive before downloading gigabytes of data.

### When should I use tacozip vs regular ZIP?

**Use tacozip when:**
- Storing large files in cloud storage (S3, Azure, HTTP CDN)
- Need to read only parts of files (Parquet row groups, tiles, chunks)
- Accessing data over slow/expensive networks
- Metadata needs to be readable without downloading entire archive

**Use regular ZIP when:**
- ❌ Files stored on local filesystem only
- ❌ Always need to extract entire archive
- ❌ Compression ratio is critical (TACO uses STORE only)
- ❌ Need >4GB archives (TACO doesn't support ZIP64)

### Is tacozip compatible with standard ZIP tools?

Yes! TACO archives ARE standard ZIP archives. You can:
- Open with WinZip, 7-Zip, unzip, etc.
- Extract all files normally
- View contents in file explorers

However:
- ⚠️ Modifying with standard tools will remove TACO header
- ⚠️ Standard tools won't show/use metadata entries

### What happens if I modify a TACO archive with 7-Zip/WinZip?

The TACO header will be lost or corrupted. The archive becomes a regular ZIP file. Run `tacozip.validate()` to detect this:

```python
from tacozip import validate, TACOZ_INVALID_NO_TACO

result = validate("modified.taco")
if result == TACOZ_INVALID_NO_TACO:
    print("ERROR: Archive modified by external tool!")
    print("Recreate archive to restore TACO header")
```


## Performance

### What's the performance impact of STORE compression?

**Trade-offs:**

| Aspect | STORE (tacozip) | DEFLATE (regular ZIP) |
|--------|-----------------|---------------------|
| Archive size | Larger (no compression) | Smaller (compressed) |
| Read speed | Faster (no decompression) | Slower (must decompress) |
| HTTP range requests | Works perfectly | Doesn't work (compressed data) |
| CPU usage | Minimal | High (compression/decompression) |

**When STORE is better:**
- Cloud storage with fast network, slow CPU
- Already-compressed data (JPEG, PNG, video, compressed Parquet)
- Need random access to file segments

**When DEFLATE is better:**
- Local storage (disk space limited)
- Uncompressed source data (text files, CSV)
- Always extracting full archive

### How fast is metadata access?

**Regular ZIP** (without TACO):
1. Seek to end of file (~50ms for S3 request)
2. Read End of Central Directory (~50ms)
3. Read Central Directory (~100ms for 1000 files)
4. **Total: ~200ms + file size dependent**

**TACO** (with tacozip):
1. Read first 165 bytes (~50ms for S3 request)
2. **Total: ~50ms regardless of file size**

**Speedup**: ~4x faster for metadata, works on files from MB to GB.

### What's the overhead of the TACO header?

165 bytes = 0.000165 MB

Impact on common file sizes:
- 1 MB file: 0.016% overhead
- 100 MB file: 0.00017% overhead
- 1 GB file: 0.000016% overhead

**Negligible overhead** for any reasonably-sized file.


## Usage

### Can I have more than 7 metadata entries?

No, maximum is 7 entries. This is a design constraint to keep header at 165 bytes.

**Workarounds:**
1. **Group data**: Instead of individual rows, store row group ranges
2. **Multiple archives**: Split data across multiple TACO archives
3. **External metadata**: Store additional metadata in separate file
4. **Hierarchical metadata**: Each entry points to a chunk containing sub-metadata

Example - hierarchical approach:
```python
# Entry 0: Points to metadata chunk
# Entry 1-6: Point to actual data chunks

# Read metadata chunk first
entries = tacozip.read_header("data.taco")
meta_offset, meta_length = entries[0]

# Metadata chunk contains detailed info about entries 1-6
# Parse metadata to decide which data chunks to fetch
```

### Can I store non-file data (just metadata)?

Yes! Create an archive with a dummy file:

```python
import tacozip
from pathlib import Path

# Create dummy file
Path("dummy.txt").write_text("metadata only")

# Create archive with your metadata
tacozip.create(
    "metadata.taco",
    src_files=["dummy.txt"],
    entries=[
        (12345, 1000),  # Your actual metadata
        (67890, 2000),
        # ...
    ]
)

# Users only need to read header (165 bytes)
# They never need to download dummy.txt
```

### How do I migrate from regular ZIP to TACO?

```python
import zipfile
import tacozip
from pathlib import Path

def migrate_to_taco(zip_path, taco_path):
    """Convert regular ZIP to TACO archive."""
    
    # Extract regular ZIP
    extract_dir = Path("./temp_extract")
    extract_dir.mkdir(exist_ok=True)
    
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(extract_dir)
    
    # Get all extracted files
    files = list(extract_dir.glob("**/*"))
    files = [str(f) for f in files if f.is_file()]
    
    # Create TACO archive
    tacozip.create(
        taco_path,
        src_files=files,
        entries=[(0, 0)]  # Add real metadata as needed
    )
    
    # Cleanup
    import shutil
    shutil.rmtree(extract_dir)

# Usage
migrate_to_taco("old.zip", "new.taco")
```

### Can I update files in a TACO archive?

**Metadata**: Yes, use `update_header()` - very fast (only ~200 bytes written)

**Files**: No, file content cannot be updated in-place. You must:
1. Extract archive
2. Modify files
3. Recreate archive

This is a design trade-off for simplicity and STORE-only compression.


## Cloud storage

### Which cloud providers does tacozip work with?

All major providers that support HTTP range requests:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Cloudflare R2
- DigitalOcean Spaces
- Backblaze B2
- Any HTTP CDN (CloudFlare, Fastly, Akamai)

### Do I need special S3 configuration?

No special configuration needed. Standard S3 features:
- Range GET requests (standard S3 feature)
- Public or private buckets (both work)
- S3 Transfer Acceleration (compatible)
- CloudFront CDN (compatible)

### How much does it cost to read metadata from S3?

AWS S3 pricing (as of 2024):
- GET request: $0.0004 per 1000 requests
- Data transfer: $0.09 per GB

**Reading TACO metadata:**
- 1 GET request + 165 bytes = ~$0.0000004 per read
- **Essentially free** - reading metadata 1 million times costs ~$0.40

**vs downloading 1GB file:**
- 1 GET request + 1GB transfer = ~$0.09

**Savings**: Reading metadata is ~225,000x cheaper than downloading full file!

### Can I use tacozip with presigned URLs?

Yes! Presigned URLs work perfectly:

```python
import boto3
import tacozip

s3 = boto3.client('s3')

# Generate presigned URL
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-bucket', 'Key': 'data.taco'},
    ExpiresIn=3600
)

# Use with HTTP range request
import requests
r = requests.get(url, headers={"Range": "bytes=0-164"})
entries = tacozip.read_header(r.content)
```


## Errors and troubleshooting

### "Native library not found" error

**Cause**: The `.so`/`.dylib`/`.dll` file is missing from the package.

**Solutions:**
```bash
# Reinstall package
pip install --force-reinstall tacozip

# If building from source, ensure library is built
cmake --preset release
cmake --build --preset release -j
pip install -e clients/python/

# Verify installation
python -c "import tacozip; tacozip.self_check()"
```

### "Buffer too small" error

**Cause**: Trying to read header from bytes buffer < 157 bytes.

**Solution**: Ensure you read at least 165 bytes (safe minimum):

```python
# Wrong
r = requests.get(url, headers={"Range": "bytes=0-100"})  # ❌ Too small
entries = tacozip.read_header(r.content)

# Correct
r = requests.get(url, headers={"Range": "bytes=0-164"})  # Minimum 165 bytes
entries = tacozip.read_header(r.content)

# Better (with margin)
r = requests.get(url, headers={"Range": "bytes=0-199"})  # Extra margin
entries = tacozip.read_header(r.content)
```

### "Invalid header" or TACOZ_INVALID_NO_TACO error

**Cause**: File was modified by standard ZIP tool, removing TACO header.

**Solution**: Recreate archive from original files.

**Prevention**: Don't modify TACO archives with 7-Zip/WinZip/unzip. Only read/extract.

### "Archive too large" (TACOZ_ERR_TOO_LARGE)

**Cause**: Archive exceeds 4GB limit (no ZIP64 support).

**Solutions:**
1. **Split data** across multiple archives
2. **Use regular ZIP** for archives >4GB
3. **Compress files** before adding (outside of archive)


## Development

### Can I use tacozip with multiprocessing/threads?

Yes! The library is thread-safe for reading operations.

```python
from concurrent.futures import ThreadPoolExecutor
import tacozip

def process_chunk(offset, length):
    with open("data.taco", "rb") as f:
        f.seek(offset)
        chunk = f.read(length)
    # Process chunk...

# Read metadata once
entries = tacozip.read_header("data.taco")

# Process chunks in parallel
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [
        executor.submit(process_chunk, offset, length)
        for offset, length in entries
    ]
    results = [f.result() for f in futures]
```

**Note**: Write operations (create, update_header) should NOT be parallelized on the same archive.

### How do I contribute to tacozip?

See [Contributing Guidelines](CONTRIBUTING.md) for:
- Code style requirements
- Testing requirements
- PR process
- Development setup

### Is there a Julia/R/JavaScript client?

**Current status:**
- Python client (official)
- C library (official)
- ⏳ Julia client (planned)
- ⏳ R client (planned)
- ❌ JavaScript client (not planned)

Community contributions welcome!


## Still have questions?

- **Documentation**: Check [Getting Started](getting-started.md) and [Python Client](client.md)
- **Issues**: Report bugs at [GitHub Issues](https://github.com/tacofoundation/tacozip/issues)
- **Discussions**: Ask questions at [GitHub Discussions](https://github.com/tacofoundation/tacozip/discussions)