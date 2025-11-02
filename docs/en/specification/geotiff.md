# The GeoTIFF format

*Written by Cesar Aybar and Julio Contreras.*


## Introduction

While GeoTIFF is widely used in geospatial applications, there are surprisingly few resources that explain what makes "something" a GeoTIFF file. In this series of articles, we will dive deep into the binary structure of GeoTIFF files, exploring not only the traditional format but also its modern variants like Cloud-Optimized GeoTIFF (COG) and the recently introduced (here) Multi-dimensional COG.


<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/content-geotiff.svg" alt="Band GIF" style="width: 60%">
</figure>

:::info
Our expertise is based on reviewing [GDAL GeoTIFF implementation](https://github.com/OSGeo/gdal/tree/4ac60a58658296d4c0d568fb6e1b41a47de7fa51/frmts/gtiff) alongside the [OGC GeoTIFF standard](https://www.ogc.org/publications/standard/geotiff/). Please let us know if you find any misinterpretation or have any suggestions for improvement at <csaybar@uv.es> or <julio.contreras@uv.es>
:::





## What is TIFF?

Many of us think of TIFF as just another image format alongside PNG or JPEG, and we held this misconception ourselves for years. However, TIFF is actually far more sophisticated. It is closer in concept to [STAC](https://stacspec.org/en), [HDF5](https://www.hdfgroup.org/solutions/hdf5/) or [Zarr](https://zarr.dev/), serving as a container that can house multiple images, each with its own rich set of metadata, i.e., different sizes, resolutions, data types, and more. This versatility paves the way for GeoTIFF, which is essentially a spatially aware version of TIFF. At a high level, a TIFF/GeoTIFF file consists of three main components:

- **Image File Header (IFH)**
- **Image File Directory (IFD)** - There can be multiple IFDs in a TIFF file.
- **Image Data (ID)** - one for each IFD.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/geotiff.svg" alt="GeoTIFF file structure" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 1: </b>GeoTIFF file structure considering a single IFD</figcaption>
</figure>

:::info
The standard TIFF format and BigTIFF primarily differ in their handling of offsets (pointers to data locations), which significantly influences their respective file size limits. Standard TIFF employs 32-bit offsets (4 bytes), restricting maximum file sizes to 4GB. On the other hand, BigTIFF utilizes 64-bit offsets (8 bytes), allowing for potentially enormous file sizes of up to 16 exabytes.
:::

### **Image File Header (IFH)**

The IFH is static, located at the beginning, and maintains a consistent 12-byte size across all TIFF/GeoTIFF files. The IFH contains **three** components:

1. **Byte Order (2 bytes):**
    - Indicates whether the bytes are little-endian or big-endian. By default, GDAL uses little-endian.

2. **Magic Number (2 bytes):**
    - Always 42 (0x002A). Serves as a TIFF file's signature. Every valid TIFF must display this number (yes, 42 really is the answer!).

3. **Offset to the first IFD (8 bytes):**
    - Indicates the position of the first IFD in the file. It's always 8 bytes after the start of the file. Think of it as the first chapter's page number in the TIFF book.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/ifh.svg" alt="IFH" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 2: </b>Image File Header (IFH) of a GeoTIFF file</figcaption>
</figure>

### **Image File Directory (IFD)**

Every TIFF file contains at least one Image File Directory (IFD). Think of it as a detailed table of contents that describes every aspect of how your image is stored and organized. While this might sound simple, the IFD is what gives TIFF (and by extension, GeoTIFF) its powerful flexibility.

::: info
Unlike what you might expect, the IFD doesn't have to immediately follow the IFH. It can be located anywhere in the file. This feature is used by Cloud-Optimized GeoTIFF (COG) as we will see in the third article of this series.
:::

The IFD is essentially a binary format dictionary. Let's break down its structure:

1. **Directory Entry Count (2 bytes)**
   - Acts like `len(dictionary)` in Python.
   - Tell us how many tag-value pairs to expect.

2. **The TAG entry (12 bytes each)**
   Each tag has four pieces of information:
   - **Tag ID (2 bytes):** The "key" that identifies what this entry represents.
   - **Data Type (2 bytes):** How to interpret the data (BYTE, SHORT, LONG, etc.)
   - **Count (4 bytes):** Number of values to read.
   - **Value/Offset (4 bytes):** If the data is small, it may fit here; **otherwise, it’s an offset to where the data is actually stored in the file.**

3. **Next IFD Pointer (4 bytes)**
   - Points to another IFD. If zero (0x00000000), there is no subsequent IFD.
   - Enables TIFF to store multiple images in one file.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/ifd.svg" alt="IFD" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 3</b>: Image File Directory (IFD) of a GeoTIFF file
  </figcaption>
</figure>


#### Understanding TIFF Tags at the byte level

Let's see how this works in practice. Imagine we are storing an image width of 2000 pixels:

```
Bytes 0-1: Tag Identifier (0x0100)
   0x01 - First byte  (1 in decimal)
   0x00 - Second byte (0 in decimal)
   Together: 256 decimal = ImageWidth tag

Bytes 2-3: Data Type (0x0003)
   0x00 - First byte
   0x03 - Second byte (3 = SHORT data type)

Bytes 4-7: Count (0x00000001)
   0x00 0x00 0x00 0x01 (1 value)

Bytes 8-11: Value/Offset (0x000007D0)
   0x00 0x00 0x07 0xD0 (2000 in decimal)
```

Therefore, the complete 12-byte entry would look like this in hexadecimal:

```
01 00 00 03 00 00 00 01 00 00 07 D0
│  │  │  │  │        │  │        │
│  │  │  │  │        │  └────────┴── Value: 2000 (0x07D0)
│  │  │  │  │        │
│  │  │  │  └────────┴── Count: 1 value
│  │  │  │
│  │  └──┴── Data Type: 3 (SHORT)
│  │
└──┴── Tag ID: 256 (ImageWidth)
```

The same information in JSON would look like:

```json
{
  "Tag ID": 256,
  "Data Type": 3,
  "Count": 1,
  "Value": 2000
}
```

However, the binary format uses just 12 bytes compared to JSON's 58 bytes. It is nearly 5 times more efficient. This is the power of binary formats! You lose readability but gain efficiency. Consider that JSON was not available when GeoTIFF was proposed. I think we are ready to dive into the GeoTIFF file.

::: info
Every IFD is a set of tags or ``Directory Entries``, which are key-value pairs. Unlike JSON where key-value pairs can vary in size, 
TIFF's Directory Entries have a fixed size of 12 bytes each, making them more efficient to parse and process.
:::

## The GeoTIFF format

What truly makes a TIFF a GeoTIFF are the **specialized tags** that define the coordinate system, projection, 
datum, and other geospatial attributes. Let's unpack how this system works.

:::tip
For a complete understanding of all GeoTIFF components, we highly recommend opening the summary diagram in another browser tab.
Full diagram [here](https://tacofoundation.github.io/mrio/assets/general_geotiff.Cv8PYgH1.svg)
:::


### The Core Geographic Tags

At its heart, a GeoTIFF file relies on four fundamental tags to store geographic information:

| Tag Name | Tag Number | Type | What It Does | Required? |
|----------|------------|------|--------------|-----------|
| GeoKeyDirectoryTag | 34735 | SHORT | The master index of geographic metadata | Yes |
| GeoDoubleParamsTag | 34736 | DOUBLE | Stores decimal values (like coordinates) | When needed |
| GeoAsciiParamsTag | 34737 | ASCII | Stores text information | When needed |
| ModelTransformationTag | 34264 | DOUBLE | Maps pixels to real-world coordinates | Yes* |

<p>You can also use ModelTiepointTag + ModelPixelScaleTag instead of ModelTransformationTag, but for this article, we just focus on ModelTransformationTag.</p>

:::info
Visit the [GeoTIFF specification](https://www.ogc.org/publications/standards/geotiff) for a complete list of tags. 
:::


#### The GeoKeyDirectoryTag: A Tag of Tags

The GeoKeyDirectoryTag functions similarly to a nested dictionary in Python, a tag that houses other tags. These nested tags are referred to as **GeoKeys**, as defined by the GeoTIFF specification. This hierarchical design ensures GeoTIFF metadata IDs remain distinct from standard TIFF ID tags. Every GeoKeyDirectoryTag begins with the same header (H) structure:

1. **KeyDirectoryVersion (2 bytes)**
    - Defines the structure format of the directory. The current version is 1.
2. **KeyRevision  (2 bytes)**
    - Indicates what revision of Key-Sets are used. Like a database schema version. For example, KeyID 1024 might mean different things in different revisions. The current revision is 1.
3. **MinorRevision (2 bytes)**
    - Allows for small updates within a major revision. The current minor revision is 0. Changes here shouldn't break compatibility.
4. **NumberOfKeys (2 bytes)**
    - It tells you the number of GeoKey entries that follow the header. Used to calculate the size of the GeoKeyDirectoryTag. For example, if NumberOfKeys = 3, expect 12 more SHORTs (3 keys × 4 SHORTs per key).

After the header, the GeoKeyDirectoryTag contains a series of GeoKeys. Each GeoKey occupies 8 bytes (4 SHORTs) and follows a similar structure to the TIFF tags. Let's examine each component in detail:

1. **KeyID (2 bytes)**
    - The KeyID identifies what type of geographic information this entry represents. Consider that, GeoKey IDs exist in their own namespace, preventing conflicts with standard TIFF tags. Examples include GTModelTypeGeoKey (1024, defines the coordinate system type), GeographicTypeGeoKey (2048, Specifies geographic coordinate system), etc.

2. **TIFFTagLocation (2 bytes)**
    - This field tells us WHERE to find the actual value. It is a crucial routing mechanism that makes the GeoKeyDirectoryTag interact with the GeoDoubleParamsTag (34736) and GeoAsciiParamsTag (34737). Let's explore the three possible scenarios:
        - TIFFTagLocation = 0: The value stored is small enough to fit in the GeoKey itself. Must be SHORT.
        - TIFFTagLocation = 34736: Value stored in GeoDoubleParamsTag. Used for floating-point metadata.
        - TIFFTagLocation = 34737: Value stored in GeoAsciiParamsTag. Used for text metadata.

3. **Count (2 bytes)**
    - Indicates how many values to read. Its interpretation depends on TIFFTagLocation:
        - If TIFFTagLocation = 0, the count is ignored as there is only one value.
        - If TIFFTagLocation = 34736, the number of DOUBLE values to read. Each value is 8 bytes.
        - If TIFFTagLocation = 34737, the number of ASCII characters to read. Each character is 1 byte.

4. **ValueOffset (2 bytes)**
    This field has dual behaviour depending, again, on TIFFTagLocation.
        - If TIFFTagLocation = 0, the value is stored here.
        - If TIFFTagLocation = 34736 or 34737, contains **index** into referenced tag. This is an index **not byte offset!**. Therefore, for GeoDoubleParamsTag real byte_offset = ValueOffset (or index) * 8 and for GeoAsciiParamsTag byte_offset = ValueOffset (or index) * 1.


<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/geotiff-GeoKeyDirectory.svg" alt="GeoKeyDirectory" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 4</b>: The GeoKeyDirectoryTag (data type: <b>SHORT</b>) references geospatial metadata stored in either the GeoDoubleParamsTag (DOUBLE) for numerical values or the GeoAsciiParamsTag (ASCII) for text.
  </figcaption>  
</figure>


#### Understanding GeoKeyDirectoryTag Tags at byte level

:::tip
Visit the [GeoTIFF specification](https://www.ogc.org/publications/standards/geotiff) for a complete list of geokeys.
:::

Imagine we are creating a GeoTIFF from scratch, and we want to store three GeoKeys: GTModelTypeGeoKey, 
ProjLinearUnitsGeoKey, and GeographicTypeGeoKey.

1) The GTModelTypeGeoKey (direct short value) would look like this:

``` 
KeyID: 1024 (GTModelTypeGeoKey)
TIFFTagLocation: 0
Count: 1 (ignored)
ValueOffset: 2 (Geographic)

Memory layout (8 bytes):
0400 0000 0001 0002
```

2) The ProjLinearUnitsGeoKey (double value) would look like this:

```
KeyID: 3076 (ProjLinearUnitsGeoKey)
TIFFTagLocation: 34736
Count: 1
ValueOffset: 0

Memory layout (8 bytes):
0C04 8087 0001 0000
Points to first double in GeoDoubleParamsTag
```

3) The GeographicTypeGeoKey (ASCII value) would look like this:

```
KeyID: 2048 (GeographicTypeGeoKey)
TIFFTagLocation: 34737
Count: 5
ValueOffset: 12

Memory layout (8 bytes):
0008 8187 0005 000C
Points to character offset 12 in GeoAsciiParamsTag
```

In summary, the GeoKeyDirectoryTag acts like a database index that points to the actual values stored itself or in the GeoDoubleParamsTag or GeoAsciiParamsTag.


### The ModelTransformationTag

It stores a 4x4 transformation matrix that provides a direct mapping between raster space (row/column, pixel coordinates) and geographic space (x/y, real-world coordinates). **This is a tag not a GeoKey!**. Therefore, it is stored in the TIFF tags section.

```
Tag Number: 34264
Type: DOUBLE
Count: 16 (4x4 matrix)
Value/Offset: Points to an array of 16 doubles
```

The transformation matrix looks like this:

```
│ ScaleX  RotationXY  0  TranslateX │
│ RotationYX  ScaleY  0  TranslateY │
│    0         0      0      0      │
│    0         0      0      1      │
```

Where `ScaleX` and `ScaleY` are the pixel size in the x and y directions, `RotationXY` and `RotationYX` are 
the rotation terms, and `TranslateX` and `TranslateY` are the offsets. Check the [Geotransform](https://gdal.org/en/stable/tutorials/geotransforms_tut.html) section in the GDAL documentation to 
get a better understanding of how this matrix works. Notice that the last row is always [0, 0, 0, 1] and 
the third column is always [0, 0, 0, 0].

## Where is the actual Image?

The actual image data in a GeoTIFF/TIFF can be stored in two different ways: **Tiled** or **Stripped**. These two formats 
determine if the image is divided into small tiles or long strips.

- **Tiled Format:** The image is divided into small tiles, each stored in a separate block. This format is useful for remote
sensing, as it allows for faster access to specific regions. Four essential tags define the tiling structure:
    - `TileWidth (322)`: The width of each tile in pixels.
    - `TileLength (323)`: The height of each tile in pixels.
    - `TileOffsets (324)`: The byte offset to each tile.
    - `TileByteCounts (325)`: The size of each tile in bytes.

- **Stripped Format:** The image is divided into long strips, each stored in a separate block. Two essential tags define the strip structure:
    - `StripOffsets (273)`: Points to where each strip of image data begins at byte level.
    - `StripByteCounts (279)`: Tells us how many bytes each strip contains.


These *data* tags work in conjunction with geographic metadata to form a comprehensive geospatial image system. Here's how it all looks together:

```
[IFD]
├── Standard TIFF Tags
│   ├── ImageWidth (256)
│   ├── ImageLength (257)
│   ├── StripOffsets (273) ────────┐
│   └── StripByteCounts (279)      │
│                                  │
├── GeoTIFF Tags                   │
│   ├── GeoKeyDirectoryTag (34735) │
│   ├── GeoDoubleParamsTag (34736) │
│   └── GeoAsciiParamsTag (34737)  │
│                                  ▼
[Image Data Strips]
Strip 1: [pixel data]
Strip 2: [pixel data]
...
```


## Write a GeoTIFF from Scratch

Let's put all this theory into practice. In this final section, we will create a minimal GeoTIFF file containing a single 
black pixel with WGS84 geographic coordinates. We'll create each component step by step, without using any libraries, to 
understand the file's binary structure. Here's a Python script that generates the GeoTIFF file:


#### 1. TIFF Header (8 bytes)

```python
header = struct.pack('<2sHL', b'II', 42, 8)
```
- `'II'`: Little-endian byte order
- `42`: Magic number for TIFF format
- `8`: Offset to first IFD


#### 2. ModelTransformationTag (128 bytes)

```python
model_transformation = struct.pack(
    '<16d',
    1.0, 0.0, 0.0, -180.0,  # Row 1: X scale and translation
    0.0, 1.0, 0.0, -90.0,   # Row 2: Y scale and translation
    0.0, 0.0, 0.0, 0.0,     # Row 3: Unused
    0.0, 0.0, 0.0, 1.0      # Row 4: Required values
)
```

This transformation maps:
- Pixel (0,0) → (-180°, -90°)
- One pixel = one degree
- No rotation


#### 3. GeoKeyDirectory (24 bytes)

```python
geo_key = struct.pack(
    '<12H',
    1, 1, 0, 2,        # Version=1, Revision=1, MinorRev=0, NumKeys=2
    1024, 0, 1, 2,     # GTModelTypeGeoKey: Geographic
    2048, 0, 1, 4326   # GeographicTypeGeoKey: WGS84
)
```

Defines:
- Geographic coordinate system
- WGS84 datum (EPSG:4326)


#### 4. Image Data (1 byte)

```python
image_data = struct.pack('<B', 0)  # One black pixel
```

#### 5. IFD Structure

The IFD contains 11 required tags:

```python
# Calculate offsets for data blocks
offset_model_transform = 8 + 2 + (11 * 12) + 4  # IFD ends at 8 + 138 = 146
offset_geo_key = offset_model_transform + len(model_transformation)  # 146 + 128 = 274
offset_image = offset_geo_key + len(geo_key)  # 274 + 24 = 298

tags = [
    # Basic Image Properties
    (256, 3, 1, 1),      # ImageWidth: 1 pixel
    (257, 3, 1, 1),      # ImageLength: 1 pixel
    (258, 3, 1, 8),      # BitsPerSample: 8 bits
    (259, 3, 1, 1),      # Compression: None
    (262, 3, 1, 1),      # PhotometricInterpretation: BlackIsZero
    
    # Data Location
    (273, 4, 1, offset_image),      # StripOffsets
    (277, 3, 1, 1),                 # SamplesPerPixel: 1
    (278, 4, 1, 1),                 # RowsPerStrip: 1
    (279, 4, 1, 1),                 # StripByteCounts: 1
    
    # Geographic Information
    (34264, 12, 16, offset_model_transform),  # ModelTransformationTag
    (34735, 3, 12, offset_geo_key)           # GeoKeyDirectoryTag
]

# Build the IFD
ifd = struct.pack('<H', len(tags))  # Number of tags (11)
ifd += b''.join(tags)              # Tag entries
ifd += struct.pack('<L', 0)        # Next IFD offset (0 = end)
```

#### 6. Final file structure layout

The final file structure looks like this:

```python
# Combine all parts into the TIFF file
tiff_data = (
    header + # 8 bytes
    ifd +   # 146 bytes
    model_transformation + # 128 bytes
    geo_key + # 24 bytes
    image_data # 1 byte
)

# Write to file
with open('output.tif', 'wb') as f:
    f.write(tiff_data)
```


If you want to just copy and paste the code, here it is:


```python
import struct

# TIFF Header (8 bytes)
header = struct.pack('<2sHL', b'II', 42, 8)  # Little-endian, version 42, first IFD at offset 8

# Define the 4x4 transformation matrix (16 doubles)
# Matrix format: [ScaleX, 0, 0, TranslateX,
#                 0, ScaleY, 0, TranslateY,
#                 0, 0, 0, 0,
#                 0, 0, 0, 1]
# Translates pixel (0,0) to (-180°, -90°) with 1° per pixel resolution
model_transformation = struct.pack(
    '<16d',
    1.0, 0.0, 0.0, -180.0,  # Row 1: X scaling and translation
    0.0, 1.0, 0.0, -90.0,   # Row 2: Y scaling and translation
    0.0, 0.0, 1.0, 0.0,     # Row 3: Z (unused)
    0.0, 0.0, 0.0, 1.0      # Row 4: Homogeneous coordinate
)

# GeoKeyDirectory (WGS84 coordinate system)
geo_key = struct.pack(
    '<12H',
    1, 1, 0, 2,        # Header: version, revision, minor_rev, num_keys
    1024, 0, 1, 2,     # GTModelTypeGeoKey (ModelTypeGeographic)
    2048, 0, 1, 4326   # GeographicTypeGeoKey (WGS84)
)

# Image data (1x1 black pixel)
image_data = struct.pack('<B', 0)

# Calculate offsets for data blocks
offset_model_transform = 8 + 2 + (11 * 12) + 4  # IFD ends at 8 + 138 = 146
offset_geo_key = offset_model_transform + len(model_transformation)  # 146 + 128 = 274
offset_image = offset_geo_key + len(geo_key)  # 274 + 24 = 298

# IFD Entries (11 tags)
tags = [
    # ImageWidth (256, SHORT, 1)
    struct.pack('<HHLL', 256, 3, 1, 1),
    # ImageLength (257, SHORT, 1)
    struct.pack('<HHLL', 257, 3, 1, 1),
    # BitsPerSample (258, SHORT, 1)
    struct.pack('<HHLL', 258, 3, 1, 8),
    # Compression (259, SHORT, 1, no compression)
    struct.pack('<HHLL', 259, 3, 1, 1),
    # PhotometricInterpretation (262, SHORT, 1, BlackIsZero)
    struct.pack('<HHLL', 262, 3, 1, 1),
    # StripOffsets (273, LONG, 1, points to image data)
    struct.pack('<HHLL', 273, 4, 1, offset_image),
    # SamplesPerPixel (277, SHORT, 1)
    struct.pack('<HHLL', 277, 3, 1, 1),
    # RowsPerStrip (278, LONG, 1)
    struct.pack('<HHLL', 278, 4, 1, 1),
    # StripByteCounts (279, LONG, 1)
    struct.pack('<HHLL', 279, 4, 1, 1),
    # ModelTransformationTag (34264, DOUBLE, 16 values)
    struct.pack('<HHLL', 34264, 12, 16, offset_model_transform),
    # GeoKeyDirectoryTag (34735, SHORT, 12 values)
    struct.pack('<HHLL', 34735, 3, 12, offset_geo_key)
]

# Build the IFD
ifd = struct.pack('<H', len(tags))  # Number of tags (11)
ifd += b''.join(tags)              # Tag entries
ifd += struct.pack('<L', 0)        # Next IFD offset (0 = end)

# Combine all parts into the TIFF file
tiff_data = (
    header +
    ifd +
    model_transformation +
    geo_key +
    image_data
)

# Write to file
with open('output.tif', 'wb') as f:
    f.write(tiff_data)
```

You can use the [gdalinfo](https://gdal.org/en/stable/programs/gdalinfo.html) command-line tool to verify whether a file is a valid GeoTIFF and inspect its geospatial metadata.

```bash
cesar@jordi-Katana-GF66-12UC:~/Desktop/geotiff$ gdalinfo output.tif
Driver: GTiff/GeoTIFF
Files: output.tif
Size is 1, 1
Coordinate System is:
GEOGCRS["WGS 84",
    ENSEMBLE["World Geodetic System 1984 ensemble",
        MEMBER["World Geodetic System 1984 (Transit)"],
        MEMBER["World Geodetic System 1984 (G730)"],
        MEMBER["World Geodetic System 1984 (G873)"],
        MEMBER["World Geodetic System 1984 (G1150)"],
        MEMBER["World Geodetic System 1984 (G1674)"],
        MEMBER["World Geodetic System 1984 (G1762)"],
        MEMBER["World Geodetic System 1984 (G2139)"],
        ELLIPSOID["WGS 84",6378137,298.257223563,
            LENGTHUNIT["metre",1]],
        ENSEMBLEACCURACY[2.0]],
    PRIMEM["Greenwich",0,
        ANGLEUNIT["degree",0.0174532925199433]],
    CS[ellipsoidal,2],
        AXIS["geodetic latitude (Lat)",north,
            ORDER[1],
            ANGLEUNIT["degree",0.0174532925199433]],
        AXIS["geodetic longitude (Lon)",east,
            ORDER[2],
            ANGLEUNIT["degree",0.0174532925199433]],
    USAGE[
        SCOPE["Horizontal component of 3D system."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["EPSG",4326]]
Data axis to CRS axis mapping: 2,1
Origin = (-180.000000000000000,-90.000000000000000)
Pixel Size = (1.000000000000000,1.000000000000000)
Image Structure Metadata:
  INTERLEAVE=BAND
Corner Coordinates:
Upper Left  (-180.0000000, -90.0000000) (180d 0' 0.00"W, 90d 0' 0.00"S)
Lower Left  (-180.0000000, -89.0000000) (180d 0' 0.00"W, 89d 0' 0.00"S)
Upper Right (-179.0000000, -90.0000000) (179d 0' 0.00"W, 90d 0' 0.00"S)
Lower Right (-179.0000000, -89.0000000) (179d 0' 0.00"W, 89d 0' 0.00"S)
Center      (-179.5000000, -89.5000000) (179d30' 0.00"W, 89d30' 0.00"S)
Band 1 Block=1x1 Type=Byte, ColorInterp=Gray
```

## What's next?

Thank you for diving deep into the GeoTIFF file format with us! We hope you have a better understanding of the GeoTIFF file structure and how to create one from scratch. In the next article, we will explore how to read and write GeoTIFF files using the GDAL library. GDAL makes it easy to work with GeoTIFF files, abstracting away the complexities of the binary format. Stay tuned!
