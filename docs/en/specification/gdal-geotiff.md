# The GDALGeoTIFF format

*Written by Cesar Aybar and Julio Contreras.*



## Introduction

Hey there! 👋 In this second article, we are diving into the GDALGeoTIFF format, a beefed-up version 
of the standard GeoTIFF you might already know. The previous article explains how to create a minimal 
GeoTIFF file, which can be useful for educational purposes but not so much for real-world applications.


<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/content-gdal-geotiff.svg" alt="Band GIF" style="width: 60%">
</figure>


In the real world, **WE all rely on GDAL**, and by 'WE' we mean everyone in the geospatial community! 
GDAL is the powerhouse behind the spatial libraries you use in Python, R, or Julia. It’s also the 
backbone of popular GIS software like QGIS, ArcGIS, and others. Simply put, GDAL is everywhere 
and impossible to ignore. Originally GDAL was initiated by Frank Warmerdam in 1998, today GDAL's 
development gained incredible momentum thanks to the very hard work of 
[Even Rouault](https://github.com/rouault).





## GDALGeoTIFF

::: info
We're skipping core concepts like internal nodata masks or sparse files that are well-documented in the [official documentation](https://gdal.org/en/stable/drivers/raster/gtiff.html#internal-nodata-masks). Instead, we'll focus on compression, interleaving, and tiling, which are crucial for raster performance.
:::

GDALGeoTIFF builds on the foundation of the standard GeoTIFF format. It enhances interoperability by introducing two new metadata tags:

- **`GDAL_METADATA`**:
    - **TIFF Tag ID**: 42112 (hex 0xA440).
    - **Data Type**: Stored as a TIFFTAG_ASCII string (text).
    - **Purpose**: Stores additional non-standard metadata items as an XML-formatted string. This includes
        key-value pairs organized into domains (e.g., image statistics, coordinate system info, or custom metadata).


**GDAL_METADATA Example**:  

```xml
<GDALMetadata>
  <Item name="STATISTICS_MEAN">123.45</Item>
  <Item name="STATISTICS_STDDEV">67.89</Item>
  <Item name="CUSTOM_DOMAIN:Author">Julio Contreras</Item>
</GDALMetadata>
```

- **`GDAL_NODATA`**:
    - **TIFF Tag ID**: 42113 (hex 0xA441).
    - **Data Type**: Stored as a TIFFTAG_ASCII string (text).
    - **Purpose**: Stored nodata value for the image. Note that all bands must use the same nodata value.

::: warning
GDAL does not support all TIFF tags. You can find the list of tags supported by GDAL in the [official documentation](https://gdal.org/en/stable/drivers/raster/gtiff.html#metadata).
:::

## Creating a GDALGeoTIFF file

In this section, we will explore the most relevant creation options for a GDALGeoTIFF file. If you are using the command line,
they can be specified using the parameter `-co` followed by the option name and value. The complete list of options can be found in the [official documentation](https://gdal.org/en/stable/drivers/raster/gtiff.html#creation-options).

### 🧱 TILE  & Block Sizing

Defaults to NO. By default, striped TIFF files are created. If yes is specified, the TIFF file will be tiled. This parameter works together with the `BLOCKXSIZE` and `BLOCKYSIZE` parameters. `BLOCKXSIZE` and `BLOCKYSIZE` are the tile width and height, respectively.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/tile.svg" alt="Interleave" style="width: 80%">
  <figcaption style="text-align: center"><b>Figure 1:</b> GDAL options for tiling. A) YES, B) NO. If NO is specified, the TIFF file will be striped.</figcaption>
</figure>


### Overviews

In GDAL, overviews (or pyramids) are precomputed lower-resolution layers of a raster image. These overviews are stored internally on a new IFD (Image File Directory).

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/overview_ifd.svg" alt="Band GIF" style="width: 70%">
  <figcaption style="text-align: center"><b>Figure 2:</b> Overview representation. Overviews are stored in a separate IFD. Image obtained from the Kitware post about [COG creation](https://www.kitware.com/deciphering-cloud-optimized-geotiffs/).</figcaption>
</figure>

The [`gdaladdo`](https://gdal.org/en/stable/programs/gdaladdo.html) command-line tool enables users to specify resampling methods (e.g., nearest neighbour, cubic) and overview levels (e.g., powers of 2) tailored to their needs. For example, running `gdaladdo -r average -levels 4 input.tif` creates four overview layers using averaging resampling. This is critical for large GeoTIFFs visualization and analysis, as overviews allow clients to fetch smaller datasets for zoomed-out views without processing the full-resolution file. Additionally, GDAL’s support for external overviews (e.g., .ovr files) avoids modifying the original file. Check the [overview creation](https://gdal.org/en/stable/drivers/raster/gtiff.html#overviews) documentation for more details.

### 🔀 INTERLEAVE Strategies

The interleave configuration is a renaming of the `PLANARCONFIG_CONTIG` tag in the TIFF specification. Control how bytes are ordered for different access patterns:

| Configuration | Storage Pattern | Description     |
|---------------|-----------------| --------------- |
| PIXEL         | [R1,G1,B1, R2,G2,B2,...] | Pixel values are stored contiguously. |
| BAND          | [R1,R2,..., G1,G2,..., B1,B2,...] | Each band is stored contiguously. |


<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/interleave.svg" alt="Interleave" style="width: 90%">
  <figcaption style="text-align: center"><b>Figure 3:</b> GDAL options for interleaving. a) PIXEL, b) BAND. Figure adapted from [Yubal Barrios et al. paper](https://www.mdpi.com/2079-9292/9/10/1576).</figcaption>
</figure>

::: tip
**Interleave configuration** determines how bytes are ordered. Depending of the use case, one configuration may be more efficient than the other. For example, if you are working with single-band operations, the **BAND** configuration may be more efficient because it allows you to read the entire band without having to skip bytes. On the other hand, the **PIXEL** configuration may be more efficient when working with multiple bands because it allows you to read all bands for a single pixel/chunk without having to skip bytes.
:::

### 🗜️ COMPRESS

Compression is the process of systematically reorganizing or reconstructing digital data using algorithms (there are many) to minimize storage space or optimize transmission efficiency (via HTTP for instance). This is achieved by eliminating redundancies (**lossless compression**) or prioritizing essential information (**lossy compression**).

Compression is particularly useful for satellite imagery, which often contains significant redundancies across spatial, temporal, and spectral band dimensions. GDAL supports various compression algorithms for GeoTIFF files, all documented in the [GTiff creation options](https://gdal.org/en/stable/drivers/raster/gtiff.html#creation-options) section. Selecting the right method ensures a balance between file size reduction and read/write performance.

### How do COMPRESS, INTERLEAVE, and TILE Interact?

Understanding how these parameters work together is crucial for optimal raster performance. Let's analyze their interplay
with a simple example. We will analyze a **900x900px 2-band image with `TILED=YES` and `BLOCKXSIZE=300` and `BLOCKYSIZE=300`**. We will explore five reading scenarios:

#### Case 1: COMPRESS=NONE, TILE=YES

When compression is disabled, GDAL can calculate the file size in advance. The INTERLEAVE parameter controls how pixel data is arranged while setting `TILED=YES` divides the image into 300x300 pixel blocks. Although the image is tiled, the access remains pixel-level, improving random access performance.

#### Case 2: COMPRESS != NONE, INTERLEAVE=PIXEL, TILE=YES

The `TILED=YES` option divides the image into 300x300 pixel blocks, while the pixel-interleaved layout arranges tiles sequentially 
following the band order: `[R1, G1, B1, R2, G2, B2...]`.  Importantly, compression is applied at the tile level, not per pixel.
Each tile acts as a self-contained compression unit, structured as a 2x300x300 block, **think of the tile itself as the foundational unit for compression, rather than individual pixels**. This data structure is highly efficient for region-specific operations involving all bands simultaneously, as all band values for a single tile are stored contiguously. In the example image, this results in **9-byte blocks** for the 2-band image.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/pixel.gif" alt="Pixel GIF" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 4:</b> The pixel-interleaved format. Notice that the compression occurs on a CxHxW block.</figcaption>
</figure>


#### Case 3: COMPRESS != NONE, INTERLEAVE=BAND, TILE=YES

The `TILED=YES` option divides the image into 300x300 pixel blocks, while the band-interleaved groups all values for a single band sequentially: `[R1, R2..., G1, G2...]`. Compression is applied to 1x300x300 band-specific blocks independently. This structure excels for band-specific operations like NDVI calculations, where only the red and NIR bands need to be accessed without decompressing unrelated data, significantly reducing processing time and memory usage. However, it is inefficient for region-specific workflows that need all bands, as accessing complete pixel data requires decompressing each band separately. In web environments, the non-contiguous byte storage of bands necessitates multiple GET range requests to fetch dispersed data. For the example image, this generates **18-byte blocks** for the 2-band image.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/band.gif" alt="Band GIF" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 5: </b>Band-interleaved storage. Notice that the compression occurs on a 1xHxW block.</figcaption>
</figure>

#### Case 5: COMPRESS != NONE, TILE=NO

When compression is applied to each strip and tiling is not used, GDAL can efficiently generate on-the-fly overviews, especially with nearest-neighbour resampling which is the default method for overviews. This approach enables GDAL to skip entire rows during downscaling by a factor of *N*, as it only reads every *N-th* row. As a result, the process becomes faster and more resource-efficient, making it ideal for large images where quick access to lower-resolution versions is essential. For more details, see the discussion in the [GDAL 4.0 meta-ticket](https://github.com/OSGeo/gdal/issues/8440).

## Conclusion

In this article, we've explored the GDALGeoTIFF format, a powerful extension of the standard GeoTIFF. We've discussed the `GDAL_METADATA` and `GDAL_NODATA` tags, which store additional metadata and nodata values, respectively. We've also covered how compression, interleaving, and tiling interact to optimize raster performance. Next time we will dive into the Cloud Optimized GeoTIFF (COG) format, which is still a GeoTIFF but with some modifications to make it more efficient for cloud-based environments. Stay tuned!
