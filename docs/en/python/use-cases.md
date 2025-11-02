# Use cases

Real-world examples of using tacozip for common data engineering scenarios.

## Parquet files with row groups

### Problem
Large Parquet file stored in S3. Need to read specific row groups without downloading entire file.

### Solution

**Step 1: Create archive with row group metadata**

```python
import tacozip
import pyarrow.parquet as pq

# Analyze Parquet structure
pf = pq.ParquetFile("dataset.parquet")
row_groups = []

for i in range(pf.num_row_groups):
    rg = pf.metadata.row_group(i)
    offset = rg.column(0).file_offset
    length = rg.total_byte_size
    row_groups.append((offset, length))

# Create TACO archive with row group metadata
tacozip.create(
    "dataset.taco",
    src_files=["dataset.parquet"],
    entries=row_groups[:7]  # Max 7 entries
)

# Upload to S3
import boto3
s3 = boto3.client('s3')
s3.upload_file("dataset.taco", "my-bucket", "data/dataset.taco")
```

**Step 2: Read specific row groups from S3**

```python
import boto3
import tacozip
import pyarrow.parquet as pq
import io

s3 = boto3.client('s3')

# Get metadata (165 bytes)
obj = s3.get_object(
    Bucket='my-bucket',
    Key='data/dataset.taco',
    Range='bytes=0-164'
)
entries = tacozip.read_header(obj['Body'].read())

# Read row group 2
offset, length = entries[2]
obj = s3.get_object(
    Bucket='my-bucket',
    Key='data/dataset.taco',
    Range=f'bytes={offset}-{offset+length-1}'
)
row_group_bytes = obj['Body'].read()

# Process with PyArrow
table = pq.read_table(io.BytesIO(row_group_bytes))
print(f"Rows: {len(table)}")
print(f"Downloaded: {length:,} bytes (not entire file!)")
```

**Benefits:**
- Download only needed row groups (~165 bytes + row group size)
- Parallel processing: fetch multiple row groups concurrently
- Cost savings: S3 charges per GB downloaded


## Geospatial tile pyramids

### Problem
Store multi-resolution tile pyramid for fast map rendering. Each zoom level needs quick access.

### Solution

```python
import tacozip
from pathlib import Path

# Tile pyramid structure:
# tiles/0/0/0.png (zoom 0)
# tiles/1/0/0.png, tiles/1/0/1.png, ... (zoom 1)
# tiles/2/0/0.png, ... (zoom 2)
# ...

def create_tile_pyramid(tile_dir, output):
    """Create TACO archive with zoom level metadata."""
    
    # Collect all tiles by zoom level
    tiles_by_zoom = {}
    for tile_file in Path(tile_dir).rglob("*.png"):
        parts = tile_file.relative_to(tile_dir).parts
        zoom = int(parts[0])
        
        if zoom not in tiles_by_zoom:
            tiles_by_zoom[zoom] = []
        tiles_by_zoom[zoom].append(str(tile_file))
    
    # Flatten for archive
    all_tiles = []
    for zoom in sorted(tiles_by_zoom.keys()):
        all_tiles.extend(tiles_by_zoom[zoom])
    
    # Calculate byte ranges for each zoom level
    # (This requires pre-measuring file sizes)
    zoom_ranges = calculate_zoom_byte_ranges(all_tiles, tiles_by_zoom)
    
    # Create archive with zoom level metadata
    tacozip.create(
        output,
        src_files=all_tiles,
        entries=zoom_ranges[:7]  # First 7 zoom levels
    )

# Usage
create_tile_pyramid("./tiles", "map_tiles.taco")

# Later: Fetch only zoom level 3 tiles from CDN
import requests
r = requests.get("https://cdn.maps.com/tiles.taco", headers={"Range": "bytes=0-164"})
entries = tacozip.read_header(r.content)

zoom_3_offset, zoom_3_length = entries[3]
r = requests.get(
    "https://cdn.maps.com/tiles.taco",
    headers={"Range": f"bytes={zoom_3_offset}-{zoom_3_offset+zoom_3_length-1}"}
)
# Extract tiles for zoom 3 only
```

## ML dataset management

### Problem
Distribute large ML training dataset. Users need only specific splits (train/val/test).

### Solution

```python
import tacozip
from pathlib import Path

def create_ml_dataset(data_dir, output):
    """Create TACO archive with train/val/test split metadata."""
    
    # Organize files by split
    splits = {
        'train': list((data_dir / 'train').glob('*.tfrecord')),
        'val': list((data_dir / 'val').glob('*.tfrecord')),
        'test': list((data_dir / 'test').glob('*.tfrecord'))
    }
    
    # Flatten for archive (maintain order)
    all_files = []
    split_offsets = {}
    current_offset = 0
    
    for split_name in ['train', 'val', 'test']:
        files = splits[split_name]
        all_files.extend([str(f) for f in files])
        
        # Calculate byte range for this split
        split_size = sum(f.stat().st_size for f in files)
        split_offsets[split_name] = (current_offset, split_size)
        current_offset += split_size
    
    # Create archive with split metadata
    tacozip.create(
        output,
        src_files=all_files,
        entries=[
            split_offsets['train'],
            split_offsets['val'],
            split_offsets['test']
        ]
    )

# Create dataset
create_ml_dataset(Path('./ml_data'), 'dataset.taco')

# User downloads only validation split
import tacozip
import requests

url = "https://data.ml.com/dataset.taco"
r = requests.get(url, headers={"Range": "bytes=0-164"})
entries = tacozip.read_header(r.content)

val_offset, val_length = entries[1]  # Val split is entry 1
r = requests.get(
    url,
    headers={"Range": f"bytes={val_offset}-{val_offset+val_length-1}"},
    stream=True
)

# Stream to local file
with open("val_data.tar", "wb") as f:
    for chunk in r.iter_content(chunk_size=1024*1024):
        f.write(chunk)

print(f"Downloaded {val_length:,} bytes (validation split only)")
```

## Multi-file scientific dataset

### Problem
Distribute meteorological dataset with multiple NetCDF files. Users need metadata to select relevant files.

### Solution

```python
import tacozip
import xarray as xr
from pathlib import Path
from datetime import datetime

def create_climate_dataset(netcdf_dir, output):
    """Create TACO archive with temporal metadata."""
    
    # Collect all NetCDF files with timestamps
    files_with_meta = []
    for nc_file in Path(netcdf_dir).glob("*.nc"):
        ds = xr.open_dataset(nc_file)
        start_time = ds.time.min().values
        end_time = ds.time.max().values
        files_with_meta.append((nc_file, start_time, end_time))
        ds.close()
    
    # Sort by time
    files_with_meta.sort(key=lambda x: x[1])
    
    # Calculate byte ranges for time periods
    current_offset = 0
    time_ranges = []
    
    for nc_file, start, end in files_with_meta:
        file_size = nc_file.stat().st_size
        time_ranges.append((current_offset, file_size))
        current_offset += file_size
    
    # Create archive
    tacozip.create(
        output,
        src_files=[str(f[0]) for f in files_with_meta],
        entries=time_ranges[:7]  # First 7 time periods
    )
    
    # Save time metadata separately
    meta = {
        'files': [
            {
                'name': f[0].name,
                'start': str(f[1]),
                'end': str(f[2]),
                'index': i
            }
            for i, f in enumerate(files_with_meta)
        ]
    }
    
    import json
    with open(output + '.meta.json', 'w') as f:
        json.dump(meta, f, indent=2)

# Create dataset
create_climate_dataset(Path('./climate_data'), 'climate.taco')

# User queries by date range
import json
with open('climate.taco.meta.json') as f:
    meta = json.load(f)

# Find files for January 2024
target_files = [
    f for f in meta['files']
    if '2024-01' in f['start']
]

# Download only those files
import tacozip
entries = tacozip.read_header('climate.taco')

for file_meta in target_files:
    idx = file_meta['index']
    if idx < len(entries):
        offset, length = entries[idx]
        # Download this specific file...
```


## Versioned data pipeline

### Problem
Data pipeline generates outputs at multiple stages. Need efficient versioning without duplicating files.

### Solution

```python
import tacozip
from pathlib import Path
import hashlib

class DataPipeline:
    def __init__(self, project_dir):
        self.project_dir = Path(project_dir)
        self.versions = []
    
    def create_version(self, stage_name, files):
        """Create versioned snapshot of pipeline stage."""
        
        # Calculate checksums for change detection
        file_hashes = []
        for f in files:
            h = hashlib.sha256(Path(f).read_bytes()).hexdigest()[:16]
            file_hashes.append(h)
        
        version_hash = hashlib.sha256(
            ''.join(file_hashes).encode()
        ).hexdigest()[:8]
        
        version_name = f"{stage_name}_v{version_hash}"
        archive_path = self.project_dir / f"{version_name}.taco"
        
        # Create archive with file metadata
        file_meta = []
        current_offset = 0
        for f in files:
            size = Path(f).stat().st_size
            file_meta.append((current_offset, size))
            current_offset += size
        
        tacozip.create(
            str(archive_path),
            src_files=files,
            entries=file_meta[:7]
        )
        
        self.versions.append({
            'stage': stage_name,
            'version': version_hash,
            'path': str(archive_path),
            'files': len(files)
        })
        
        return version_name
    
    def restore_version(self, version_name, output_dir):
        """Restore specific version from archive."""
        # Extract archive to output_dir
        import zipfile
        archive_path = self.project_dir / f"{version_name}.taco"
        with zipfile.ZipFile(archive_path) as zf:
            zf.extractall(output_dir)

# Usage
pipeline = DataPipeline('./pipeline_data')

# Stage 1: Raw data
raw_files = ['data1.csv', 'data2.csv']
v1 = pipeline.create_version('raw', raw_files)

# Stage 2: Cleaned data
cleaned_files = ['cleaned1.parquet', 'cleaned2.parquet']
v2 = pipeline.create_version('cleaned', cleaned_files)

# Stage 3: Features
feature_files = ['features.npz']
v3 = pipeline.create_version('features', feature_files)

# Later: Restore specific version
pipeline.restore_version(v2, './restore/cleaned_data')
```

## Progressive data loading

### Problem
Large dataset too big to load entirely in memory. Need progressive loading with checkpoint/resume.

### Solution

```python
import tacozip
from pathlib import Path
import pickle

class ProgressiveDataLoader:
    def __init__(self, archive_path):
        self.archive_path = archive_path
        self.entries = tacozip.read_header(archive_path)
        self.current_chunk = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current_chunk >= len(self.entries):
            raise StopIteration
        
        offset, length = self.entries[self.current_chunk]
        
        # Read chunk from archive
        with open(self.archive_path, 'rb') as f:
            f.seek(offset)
            chunk_data = f.read(length)
        
        self.current_chunk += 1
        return chunk_data
    
    def checkpoint(self, path):
        """Save current position."""
        with open(path, 'wb') as f:
            pickle.dump(self.current_chunk, f)
    
    def resume(self, path):
        """Resume from checkpoint."""
        with open(path, 'rb') as f:
            self.current_chunk = pickle.load(f)

# Usage
loader = ProgressiveDataLoader('large_dataset.taco')

try:
    for i, chunk in enumerate(loader):
        # Process chunk
        process_data(chunk)
        
        # Checkpoint every 10 chunks
        if i % 10 == 0:
            loader.checkpoint('progress.pkl')
            
except KeyboardInterrupt:
    # Save progress on interrupt
    loader.checkpoint('progress.pkl')
    print("Progress saved")

# Later: Resume from checkpoint
loader = ProgressiveDataLoader('large_dataset.taco')
loader.resume('progress.pkl')

for chunk in loader:
    process_data(chunk)
```


## See also

- [Python Client](client.md) - Cloud storage integration details
- [Getting Started](getting-started.md) - Basic operations
- [Python API Reference](python-api-reference.md) - Complete API documentation