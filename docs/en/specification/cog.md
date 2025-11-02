# The Cloud Optimized GeoTIFF format

*Written by Cesar Aybar and Julio Contreras.*

## Introduction

We are old enough to remember that analyzing a tiny 1 MB region required downloading entire satellite images (>1 GB each) 
to our local machines. But around in 2016, the Cloud Optimized GeoTIFF (COG) format changed everything. Suddenly, with one/few 
lines of code, we could download precisely the region we needed, nothing more. What makes COG so special? The magic lies 
in two key innovations: **server-side optimization** and the **file byte order**.  In this article, we will explore the 
technical foundations of COG, and why it has become the gold standard for efficient remote sensing data access in the 
cloud era.


<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/content-gdal-cog.svg" alt="Band GIF" style="width: 60%">
</figure>


## Requirements to become a COG

To enable partial reads in a COG, the following requirements must be satisfied:

**Server-Side Requirements:**

- `HTTP/1.1+ Range Request Support`: The hosting server must accept Range headers (we will see what this means later).


**File Requirements:**

- Valid GeoTIFF structure.

- Can be compressed or uncompressed.

- Tiled Data Organization: `TILE=YES` and `BLOCKXSIZE`/`BLOCKYSIZE` tags set in the GeoTIFF file. Pixel data is divided into square tiles (e.g., 256x256 or 512x512) rather than stripped layouts.

- Interleave chunk organization: From GDAL 3.11 onwards, the `INTERLEAVE` tag can be set as `PIXEL`, `BAND`, or `TILE`. Before GDAL 3.11, the default and only option was `PIXEL`.

- Internal Overviews: Pyramid-style reduced-resolution versions (overviews) embedded within the file for rapid zoom-level rendering.

- Optimized Byte Layout: Critical metadata structures, i.e. the Image File Directory (IFD), are positioned at the beginning of the file. This "header-first" design allows clients to parse essential metadata without downloading the entire file.


## Server-Side Requirements: HTTP Range Requests

To enable efficient access to Cloud-Optimized GeoTIFFs (COGs), servers must support **HTTP Range Requests**. This feature, introduced in HTTP/1.1 (1997), allows clients to request specific byte ranges of a resource instead of downloading the entire file, significantly improving performance and reducing bandwidth usage.

### How Range Requests Work

A client requests partial content by specifying a byte range in the `Range` header. For example, if a geospatial analyst needs only bytes 5000–6000 of a 1 GB GeoTIFF, perhaps to analyze a specific city or a village, the client sends an HTTP request with the header:

```bash
curl -H "Range: bytes=5000-6000" http://example.com/image.tif
```

If the server supports partial content it responds with:

```http
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 5000-6000/1000000000
Content-Length: 1001
```

The `Content-Range` header specifies the returned byte range (5000–6000) relative to the full 
file size (1,000,000,000 bytes). By transferring only the required data, bandwidth usage is 
reduced by 99.9% in this example. While HTTP/1.1 introduced this capability, it has significant 
limitations for modern workflows. Key issues include:

- [head-of-line blocking](https://en.wikipedia.org/wiki/Head-of-line_blocking): A single slow request can delay subsequent ones.
- Lack of true [multiplexing](https://en.wikipedia.org/wiki/Multiplexing): Concurrent range requests require separate TCP connections or suffer from latency when pipelined.

For example, fetching 3 tiles from a Cloud-Optimized GeoTIFF (COG) might necessitate 3 separate TCP connections under HTTP/1.1, or introduce delays if requests are pipelined. These inefficiencies highlight the need for more advanced protocols like [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2).


### The HTTP/2 protocol

HTTP/2, released in 2015, transforms how range requests are handled. While the syntax for the `Range` header remains the same as in HTTP/1.1, the protocol introduces a binary framing layer and multiplexing capabilities.

For example, consider the scenario of fetching 3 tiles from a Cloud-Optimized GeoTIFF (COG). With HTTP/2, multiple requests can be handled concurrently over a single connection, significantly reducing latency and improving performance. A client can request specific byte ranges, such as 5000–6000, 10,000–11,000, and 15,000–16,000, using a **single HTTP range request!**:

```bash
curl -H "Range: bytes=5000-6000, 10000-11000, 15000-16000" http://example.com/image.tif
```

The server responds with a single `206 Partial Content` payload that includes all three requested ranges, separated by boundaries. Here's an example response:


```http
HTTP/2 206 Partial Content
Content-Type: multipart/byteranges; boundary=EXAMPLE_BOUNDARY
Content-Length: [total size]

--EXAMPLE_BOUNDARY
Content-Range: bytes 5000-6000/1000000000
...TIFF tile data...
--EXAMPLE_BOUNDARY
Content-Range: bytes 10000-11000/1000000000
...TIFF tile data...
--EXAMPLE_BOUNDARY--
Content-Range: bytes 15000-16000/1000000000
...TIFF tile data...
--EXAMPLE_BOUNDARY--
```

The `EXAMPLE_BOUNDARY` is a delimiter used in the multipart/byteranges response format to separate the different byte ranges in the payload. It is a unique string defined by the server (in this case, EXAMPLE_BOUNDARY is a placeholder) that ensures the client can correctly parse and distinguish between the multiple parts of the response.

::: info
Most cloud object storage services like Amazon S3, Google Cloud Storage, and Azure Blob Storage do not support HTTP/2 yet. So it is important to consider the server-side requirements when working with COGs.
:::


## File Requirements

Creating a Cloud-Optimized GeoTIFF (COG) with GDAL is a simple process. Key COG features like compression, tiling, internal overviews, and interleaved chunk organization are automatically handled using the command `gdal_translate -of COG ...`. Starting with GDAL [3.11](https://github.com/OSGeo/gdal/pull/11541#event-16013050336), a new option, `INTERLEAVE=TILE`, was introduced. This option provides a hybrid approach between `PIXEL` and `BAND` interleaved chunk organization (discussed in the previous article in this series).

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/tiled.gif" alt="Tiled GIF" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 1: </b>The `INTERLEAVE=TILE` creation option</figcaption>  
</figure>

The `INTERLEAVE=TILE` option organizes data into chunks at the band level (`1 x H x W`), but it orders blocks in a way that is similar to pixel interleaving. This approach allows clients to read multiple bands with a single range request, as the band data bytes are stored contiguously. This feature is particularly useful when working with images that have many bands, such as hyperspectral images.


For example, consider a hyperspectral image with 200 bands where you need to access the first 10 bands for a specific pixel/region of interest. If the image uses pixel interleaving (`C x H x W`), a single range request can retrieve all the tile data. However, because the data is compressed, you would need to download all bands, decompress them, extract the desired bands, and discard the rest. Conversely, with band interleaving (`1 x H x W`), the data for each band is stored separately, requiring 10 separate range requests to access the first 10 bands, as the data is not contiguous. Using `INTERLEAVE=TILE` (also `1 x H x W`), the data for these bands **remains contiguous within the chunks**, allowing you to make a single range request to retrieve only the bands you need.


::: info
The main drawback of using `INTERLEAVE=TILE` is that the final file size will be larger compared to using `INTERLEAVE=PIXEL`. This is because compression is applied at the band level (`1 x H x W`) rather than the pixel level (`C x H x W`). The difference in file size depends on the correlation between bands and the compression method used.
:::

### Optimized Byte Layout

The Byte Layout is designed to enable efficient access to geospatial data in cloud environments. A key aspect of this layout is the `Metadata-First` Design, which ensures that metadata is easily accessible by performing a single HTTP range request. This design is crucial for cloud-based workflows, where rapid access to metadata is essential for efficient data processing. Here is how it works:

#### Ghost Area

Between the **Image File Header (IFH)** and the first **Image File Directory (IFD)**, there is a region known as the `Ghost Area` 👻. This area serves as a critical metadata section that informs GDAL about the structural layout of the file. Let’s take a closer look at the metadata it stores:

```bash
GDAL_STRUCTURAL_METADATA_SIZE=000174 bytes
LAYOUT=IFDS_BEFORE_DATA
BLOCK_ORDER=ROW_MAJOR
BLOCK_LEADER=SIZE_AS_UINT4
BLOCK_TRAILER=LAST_4_BYTES_REPEATED
KNOWN_INCOMPATIBLE_EDITION=NO
MASK_INTERLEAVED_WITH_IMAGERY=YES
```

The `GDAL_STRUCTURAL_METADATA_SIZE` specifies the size of the Ghost Area in bytes. For example, if the `MASK_INTERLEAVED_WITH_IMAGERY` tag is present, the size is typically 174 bytes; otherwise, it is 140 bytes. The `LAYOUT` tag indicates the order of the Image File Directories (IFDs), usually set to IFDS_BEFORE_DATA, meaning the IFDs are stored before the actual image data. The `BLOCK_ORDER` defines the order in which data blocks are stored, only the ROW_MAJOR option is currently supported.

The `BLOCK_LEADER` and `BLOCK_TRAILER` tags are used to verify the integrity of partial downloads. The `BLOCK_LEADER` specifies the size of each block as a 4-byte unsigned integer (SIZE_AS_UINT4), while the `BLOCK_TRAILER` ensures the last 4 bytes of each block are repeated for consistency checks.

The `KNOWN_INCOMPATIBLE_EDITION` tag is one of the most critical. It indicates whether the COG file is still compliant with the COG specification. For example, if you create a COG file and later append additional overviews (i.e. add new IFDs) using the gdaladdo command, GDAL will automatically set this tag to YES. This signals that the file is no longer a valid COG, and GDAL will issue a warning message.

Finally, the `MASK_INTERLEAVED_WITH_IMAGERY` tag indicates whether the COG file contains a band mask with the imagery. For more details on band masks, refer to [GDAL RFC 15](https://gdal.org/en/stable/development/rfc/rfc15_nodatabitmask.html).

<figure>
  <img src="../../public/geotiff_vs_cog.svg" alt="GeoTIFF file structure" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 2:</b>Differences between a normal GeoTIFF and a COG file structure.</figcaption>
</figure>

### GDAL tricks to read faster a COG file

To optimize GDAL for faster access to Cloud-Optimized GeoTIFFs (COGs), several configuration settings and environment variables can dramatically improve performance. In this last section, we will explore some of these tricks that can help you read COGs more efficiently. For a full list of adjustable parameters, consult the [GDAL configuration options](https://gdal.org/en/stable/user/configoptions.html). Additionally, [TiTiler](https://developmentseed.org/titiler/) has a great post about tuning GDAL for COGs that you can find [here](https://developmentseed.org/titiler/advanced/performance_tuning/).

#### HTTP Request Optimization

Set `GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES` to merge adjacent byte-range requests. For example, instead of requesting bytes 1-5 and 6-10 separately, GDAL will combine them into a single request for bytes 1-10. This reduces the number of round-trip requests. Enable `GDAL_HTTP_MULTIPLEX=YES` to allow multiplexing multiple range requests over a single HTTP/2 connection (if supported by the server). 

::: tip
There is a limit to the number of ranges that can be merged. By default, GDAL will merge up to 2 MB of data. You can adjust this limit by setting the `CPL_VSIL_CURL_CHUNK_SIZE` environment variable. The maximum value is 10 MB (10485760 bytes). If you increase this value, also consider increasing the `CPL_VSIL_CURL_CACHE_SIZE` whose default is 16 MB (16384000 bytes). This is quite important because GDAL use a heuristics mechanism to decide when to merge ranges. Consider that larger values will increase RAM consumption.
:::

#### Reduce filescan

Configure `GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR` to prevent GDAL from scanning the entire directory when opening a file. By default, GDAL lists all files in the directory, which can trigger costly GET/LIST requests. Setting this to EMPTY_DIR skips directory scanning unless external overviews (e.g., .ovr files) are required. If your COGs rely on external overviews, use FALSE instead.

#### File Access Restrictions

Use `CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.TIF,.tiff"` to restrict GDAL to opening only specified file types. This prevents accidental access to unrelated files.

#### Header Size Tuning

Adjust `GDAL_INGESTED_BYTES_AT_OPEN` to control how many initial bytes GDAL reads to parse metadata. COGs store tile locations in their headers, which can grow large for datasets with many tiles. By default, GDAL reads 16 KB and fetches more if needed.

#### Caching Strategies

- `GDAL_CACHEMAX=XXX` allocates XXX MB for GDAL’s block cache, storing recently accessed tiles in memory.
- `CPL_VSIL_CURL_CACHE_SIZE=XXX` sets a XXX MB global cache for reused network requests.
- `VSI_CACHE=TRUE` enables per-file caching, with `VSI_CACHE_SIZE=XXX`. This is critical for workflows opening multiple files simultaneously, such as virtual mosaics (VRTs).

#### Block Cache Type

GDAL caches chunk tiles (i.e., `C x H x W` or `1 x H x W`) to avoid repeated disk/network fetches. However, the default `GDAL_BAND_BLOCK_CACHE=ARRAY` method pre-allocates memory for every possible block in the dataset. For massive datasets (e.g., high-zoom-level satellite imagery with millions of tiles), this can crash applications due to excessive memory usage. The `GDAL_BAND_BLOCK_CACHE=HASHSET` method solves this by dynamically allocating memory only for blocks actually accessed, making it far more efficient for large datasets.

| ARRAY | HASHSET |
|-------|---------|
| Pre-allocates memory for all blocks. | Allocates memory only for blocks in use. |
| Fast for small datasets (low overhead). | Better for large datasets (avoids OOM errors). |
| Thread-safe without locks (static array). | Requires mutex locks for thread safety. |
| Default for datasets with <1 million blocks. | Default for datasets with >1 million blocks. |

By default, GDAL uses the `AUTO` setting, which selects ARRAY for small datasets and HASHSET for large ones. Check the [GDAL RFC 26](https://gdal.org/en/stable/development/rfc/rfc26_blockcache.html) for more details.

#### Proj Network Enhancements

Enable `PROJ_NETWORK=ON` to let PROJ fetch high-accuracy transformation grids from the cloud, improving coordinate reprojection for **precision-critical applications**. It is not necessary for UTM grid zones. Check the [PROJ RFC 4](https://proj.org/en/stable/community/rfc/rfc-4.html#rfc4) for details.

#### Final Recommended Configuration

For most COG workflows, apply these settings:

```bash
export GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES
export GDAL_HTTP_MULTIPLEX=YES
export GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR
export CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.TIF,.tiff"
export GDAL_INGESTED_BYTES_AT_OPEN=65536
export GDAL_CACHEMAX=512
export CPL_VSIL_CURL_CACHE_SIZE=167772160  
export CPL_VSIL_CURL_CHUNK_SIZE=10485760
export VSI_CACHE=TRUE
export VSI_CACHE_SIZE=10485760
export GDAL_BAND_BLOCK_CACHE=HASHSET
export PROJ_NETWORK=ON
```
