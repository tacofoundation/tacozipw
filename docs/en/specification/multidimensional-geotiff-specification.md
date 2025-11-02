# The Multidimensional COG

## Overview

Unlike GeoTIFF, which enforces strict spatial metadata definition, traditional multidimensional formats typically rely on the flexible [CF metadata conventions](https://cfconventions.org/). While this flexibility offers broad applicability, it also leads to inconsistent implementations across software platforms and public datasets. Probably, the major concern is the lack of standardization for [CRS information](https://github.com/zarr-developers/geozarr-spec/issues/53); although CF conventions allow the inclusion of CRS details, they do not enforce a uniform format. Similar issues arise with other critical metadata components, such as the definition of temporal attributes and data overviews. Consequently, users often need to determine the appropriate structure manually, resulting in inconsistent dataset interpretations and additional preprocessing steps that further complicate geospatial workflows.

To address these challenges, the Multidimensional COG (mCOG) specification extends the traditional GeoTIFF format to support N-dimensional arrays. We designed mCOG to maintain compatibility with GDAL (from version 3.1, when COG was introduced) and to ensure that critical metadata is **always explicit**. The mCOG format maintains the simplicity and compatibility of COG/GeoTIFF, offers fast and partial data access, and ensures compatibility with any GIS software or library that supports the GDALGeoTIFF format.

The following decisions have been considered in the development of mCOG:

- An mCOG must adhere to the [COG specification](https://docs.ogc.org/is/21-026/21-026.html), meaning each file can have only one geotransform and one CRS.
- An mCOG must also comply with the [STAC datacube specification](https://github.com/stac-extensions/datacube), ensuring a single, standardized method for defining time and additional dimensions. Multiple variables are not supported.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/content-mcog.svg" alt="Band GIF" style="width: 40%">
</figure>

## File format details

This is the version `0.1.0` of the mCOG specification. From a high-level perspective, the main difference between a [traditional COG](https://docs.ogc.org/is/19-008r4/19-008r4.html) and an mCOG is the addition of a TAG named **`MD_METADATA`** that contains the metadata of the multidimensional array. With this metadata, client libraries can reshape the data from a 3D array (band, x, y) structure to an N-dimensional array.

The `MD_METADATA` tag is embedded within the `TIFFTAG_GDAL_METADATA` ASCII tag (code 42112), as recommended by the [GDAL documentation](https://gdal.org/en/stable/drivers/raster/gtiff.html#metadata) for handling non-standard metadata. This approach ensures compatibility with the GeoTIFF specification while enabling support for multidimensional arrays. The table below highlights the mandatory and optional fields within the `MD_METADATA` JSON structure:

| Field  | Type | Required | Details |
|---|---|---|---|
| md:pattern | string | Yes | A string defining the strategy to reshape the data into a 3D array (band, x, y). It is based on the [Einstein-Inspired Notation for OPerationS](https://openreview.net/pdf?id=oapKSVM2bcj), einops. The pattern is a space-separated list of dimension names, followed by an arrow `->`, and the new order of the dimensions. For example, `time band y x -> (time band) y x` rearranges the dimensions from `(time, band, y, x)` to `time×band y x`, where `time×band` is a new number of channels. As GeoTIFF define explicitly the `y` and `x` dimensions, the pattern **MUST** always include them in the same order. There are no restrictions on the number of input dimensions. However, reshape operations that modify `y` or `x` are not allowed, and the resulting pattern must always yield exactly three dimensions after the arrow. Refer to the [einops paper](https://openreview.net/pdf?id=oapKSVM2bcj) for more details about the notation. |
| md:coordinates | Map<string, [Dimension Object](https://github.com/stac-extensions/datacube?tab=readme-ov-file#dimension-object)> | Yes | Uniquely named dimensions of the datacube. Based on the [datacube STAC extension](https://github.com/stac-extensions/datacube) proposed by [Matthias Mohr](https://mohr.ws/). |
| md:attributes | dictionary | No | A dictionary of additional metadata attributes to include in the file. It **MUST** comply with the [JSON standard](https://www.json.org/json-en.html). |
| md:blockzsize | integer | No | A new `create option` parameter that defines the block size for the bands in a GeoTIFF. It must be set to either 1 or an integer value that is divisible by the number of bands after rearranging, with the default value being 1. This setting allows for greater control over how data is segmented within the file, which is important for optimizing access patterns and performance. Additionally, the division between `md:blockzsize` and the scale **MUST** yield a terminating number, ensuring that the scaling process does not result in non-terminating decimals. |

## Example

The following is an example of the `MD_METADATA` tag in a mGeoTIFF file:

```json
{
  "md:pattern": "time band y x -> (time band) y x",
  "md:coordinates": {
    "time": {
        "type": "temporal",
        "values": [
          "2016-05-03T13:21:30.040Z"
        ]
    },
    "band": {
        "type": "bands",
        "values": [
          "red",
          "green",
          "blue"
        ]
    }
    "y": {
        "type": "spatial",
        "axis": "y",
        "extent": [
          37.48803556,
          37.613537207
        ],
        "reference_system": 4326
    },
    "x": {
        "type": "spatial",
        "axis": "x",
        "extent": [
          -122.59750209,
          -122.2880486
        ],
        "reference_system": 4326
    },
  },  
  "md:attributes": {
    "title": "Multidimensional GeoTIFF Example",
    "description": "This is a toy example of a Multidimensional GeoTIFF file."
  }
}
```

## Understanding I/O Operations

### Writing Data

To simplify the explanation of how the I/O works, we will reference the current Python API of [mrio](https://github.com/tacofoundation/mrio). When writing a mGeoTIFF file, users must define the `MD_METADATA` tag as a dictionary. This dictionary is validated using Python dataclass fields ([validation details](https://github.com/tacofoundation/mrio-python/blob/main/mrio/fields.py)) and then converted to a JSON string. Refer to the mrio [Python examples](https://https://tacofoundation.github.io/mrio/en/python/examples.html) for guidance on writing an mGeoTIFF file. 

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/write_mode.gif" alt="Band GIF" style="width: 70%">
  <figcaption style="text-align: center"><b>Figure 1:</b> Writing an nD Array to a GDALGeoTIFF Using mrio.</figcaption>
</figure>

By default, all `mrio` files are created as COGs without overviews. The default creation options are as follows:

```python
creation_options = [
    "COMPRESS=DEFLATE",
    "BLOCKSIZE=128",
    "INTERLEAVE=TILE",
    "BIGTIFF=YES",
    "OVERVIEWS=NONE"
]
```

Arrays of arbitrary dimensions are reshaped into a 3D array (band, y, x) using the `md:pattern` field. With the `INTERLEAVE=TILE` option (check our post about [COGs](https://https://tacofoundation.github.io/mrio/en/specification/cog.html#file-requirements)), data is compressed into `1 × BLOCKSIZE × BLOCKSIZE` tiles and arranged contiguously along the band dimension.

In a 4-D array, the `md:pattern` can be defined in two ways.

- In the case `time band y x -> (time band) y x`, data is stored 
continuously by band within each time step, such as: `b1time1, b2time1, ..., b1time2, b2time2, ..., b1time3, b2time3, ....`

- In the case `time band y x -> (band time) y x`, data is stored 
continuously by time within each band, such as: `b1time1, b1time2, ..., b2time1, b2time2, ..., b3time1, b3time2, ....`

Data providers with large time dimensions (e.g., daily satellite imagery spanning decades) might prefer the band-time interleave layout. This approach ensures temporal byte continuity within the file, enabling efficient retrieval of time-series data. Specifically, requests for any length of time-series data can be fulfilled with just **a single HTTP range request**.

<figure>
  <img src="../../public/mode.svg" alt="GeoTIFF file structure" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 2:</b>Visual comparison of the effects of different `md:pattern` strategies.</figcaption>
</figure>

By default, `mrio` assigns band descriptions (also known as band names) following the GDAL GeoTIFF convention when the `md:blockzsize` is set to 1.These descriptions are stored in the `TIFFTAG_GDAL_METADATA` XML tag. The band descriptions set names based on the `md:coordinates` key-value pairs. For example, given a Sentinel-2 5D array with the `md:pattern` of `product time band y x -> (band product time) y x`, the resulting band descriptions will be:

```
band[0]__product[0]__time[0] # B01__boa__20210101
band[0]__product[0]__time[1] # B01__boa__20210106
band[0]__product[0]__time[2] # B01__boa__20210111
...
band[0]__product[1]__time[0] # B01__toa__20210101
band[0]__product[1]__time[1] # B01__toa__20210106
band[0]__product[1]__time[2] # B01__toa__20210111
...
band[1]__product[0]__time[0] # B02__boa__20210101
band[1]__product[0]__time[1] # B02__boa__20210106
band[1]__product[0]__time[2] # B02__boa__20210111
...
band[1]__product[1]__time[0] # B02__toa__20210101
band[1]__product[1]__time[1] # B02__toa__20210106
band[1]__product[1]__time[2] # B02__toa__20210111
```

Here, `band[x]`, `product[y]`, and `time[z]` correspond to the names specified in the `md:coordinates` dictionary. The `__` separator is used to distinguish between dimensions. When dragging and dropping mCOG files into GIS software, the band descriptions will be displayed as the band names.

<figure>
  <img src="../../public/qgis.png" alt="GeoTIFF file structure" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 3: </b>Example of a mCOG displayed in QGIS</figcaption>
</figure>

### Reading Data

When reading a mGeoTIFF file, the `mrio` API reconstructs the original multidimensional array 
and metadata by reversing the transformations applied during the writing process. 

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/read_mode.gif" style="width: 70%">
  <figcaption style="text-align: center"><b>Figure 4: </b>Reading a GDAL GeoTIFF into an nD Array Using mrio.</figcaption>
</figure>

The reconstruction involves the following steps:

1. **Opening the File**: The file is opened using the GDAL utility, and the `TIFFTAG_GDAL_METADATA` 
tag is accessed to retrieve the `MD_METADATA` JSON string. 

2. **Parsing Metadata**: The `MD_METADATA` string is parsed into a Python dictionary. Key fields, 
such as `md:pattern` and `md:coordinates`, are used to determine how the array should be 
reshaped to restore its original dimensions. Partial reads are supported, by 
[vectorized operations](https://github.com/tacofoundation/mrio-python/blob/708ce05b5cebbf38c2114399ed54c5b4b5769443/mrio/chunk_reader.py#L69).

3. **Creating the Output**: When the `engine` parameter is set to `xarray` (the default), the 
`md:attributes` field is also extracted. This enables the API to construct an `xarray.DataArray` 
object with the associated attributes and coordinates. Numpy is supported too.

### BLOCKZSIZE

The `BLOCKZSIZE` or `md:blockzsize` is not specified within the TIFF or GeoTIFF documentation. mCOG provides `BLOCKZSIZE` by compressing bands in space. While this is not an elegant solution, it allows storing millions of bands without compromising performance. The only value affected is the scale in the geotransform; the rotation and translation remain unchanged. The logic is as follows: if `md:blockzsize` is greater than 1, then:  

1) Apply the `md:pattern` to rearrange the nD tensor into 3D.  

2) Apply the arrangement once more with the pattern `(c c1 c2) h w -> c (h c1) (w c2)`, where `c1` and `c2` are the values of `md:blockzsize`. To avoid repeating decimals, the division between the scale and `md:blockzsize` **must** always result in a number with terminating decimals.

<figure>
  <img src="../../public/blockzsize.svg" alt="GeoTIFF file structure" style="width: 100%">
  <figcaption style="text-align: center"><b>Figure 5: </b>Visual comparison of the effects of different `md:blockzsize` strategies.</figcaption>
</figure>


:::warning  
Setting `BLOCKZSIZE` higher than 1 will generate data overviews that simplify not only the spatial dimensions (`x` and `y`) but also the band structure. This 
may cause QGIS and ArcGIS to misrepresent the data.  
:::

## FAQ

::: details Is it supported by QGIS? {close}
If you open a mGeoTIFF file in QGIS, QGIS will display a `special` band name that
are generated by `mrio`. Check `BLOCKZSIZE` section for more details about problems with visualization.
:::


::: details Is it supported by GDAL? {close}
Not natively. **mrio** was developed to manage n-dimensional data within our deep learning pipelines. Depending on community feedback, we would be happy to develop a dedicated GDAL driver to enhance interoperability in other programming languages. However, since **mCOG** is a Cloud-Optimized GeoTIFF (COG), it can already be read by GDAL. In fact, that is actually what the current Python API does. It uses GDAL to read the file, and then it virtually reshapes the data to the original shape.
:::

::: details Which programming languages are supported? {close}
The `mrio` API is currently available in Python.
:::

::: details Can I use it with TensorFlow or PyTorch? {close}
Yes, you can! In fact, we developed `mrio` specifically for use in our internal deep-learning pipes at 
[ISP - Image and Signal Processing group](https://isp.uv.es/).
:::


## Why not use NetCDF, HDF5, or Zarr?

While there are many existing byte containers for multidimensional arrays, such as NetCDF, HDF5, 
and Zarr, our decision to use GeoTIFF stems from a combination of practical and community-based considerations:

1. **Good software is more important than specifications**: In theory, one 
could design a multidimensional array format using TIFF by saving 
each n-dimensional chunk in a separate IFD. With some effort, this approach could potentially 
achieve efficiency comparable to other n-dimensional array formats. However, by choosing 
the COG layout **all the necessary tools already exist**. GDAL is highly optimized for 
working with COG files and is supported by a large, active community of experts continuously 
improving and maintaining it (This is more important than anything!). Back to the example of an
illusional n-D chunked TIFF format, it would not only require significant effort to develop but
also writing a lot of code to ensure compatibility with other software (i.e. QGIS). In practice,
the success of a format often depends more on the people supporting it than on whether a format
is theoretically better than another.

2. **Stability and Maturity**: GeoTIFF, in particular, has benefited from decades of development 
and refinement, making it a mature and highly stable format. This stability and maturity are key 
factors in its widespread adoption and reliability. One could argue that HDF5 is also `stable`. 
However, the key difference lies in its scope; HDF5 is an extremely ambitious project compared 
to GeoTIFF or Zarr. Maintaining its large number of features and extensions is a complex task. Check 
the [HDF5 specification](https://support.hdfgroup.org/documentation/hdf5/latest/_f_m_t3.html) to
give you an idea of the complexity. Breaking changes between minor versions are very common, which 
can disrupt compatibility for software or formats built on top of it, such as NetCDF. This complexity
makes HDF5 less interoperable, specifically for less experienced users.

3. **Why not just Zarr?**: Zarr is another general-purpose format that is relatively new and highly
flexible, with a specification of fewer than 10 pages. In Zarr, almost everything, except for the
datatype, compression, shape, and chunk size, is implicit. As of this writing, there is no established
standard within Zarr comparable to GeoTIFF. Rather than being a fully self-contained file format, Zarr
functions more as a convention for organizing n-dimensional arrays within a folder structure. One of our
main concerns when adopting Zarr is that the main changes are made without proper documentation. For
instance, [Zarr V3](https://zarr-specs.readthedocs.io/en/latest/v3/data-types.html) is still
`under construction` at the time of writing, despite having been released months ago. This issue is
particularly critical given that Zarr's official implementation is written in Python, as
opposed to the cross-platform C implementations found in formats such as HDF or GeoTIFF (GDAL). The
direct consequence is a lack of interoperability between the software that implements the Zarr format.
From our perspective, Zarr cannot be considered a viable option for production until a clear plan for a
cross-platform implementation is established. Currently, there are efforts to support
[Zarr in GDAL](https://gdal.org/en/stable/drivers/raster/zarr.html), but it seems that its community is
shifting towards Rust, specifically with the [Icechunk project](https://icechunk.io/en/latest/).


## Final thoughts

As you can see, there is no perfect format for n-dimensional data. With mCOG, we aim to
provide a simple, stable, and spatially explicit format for n-dimensional arrays. By building on top of the
COG layout. However, there are some drawbacks to this approach that data providers should be aware of:

1. **Hard to apply streaming operations**, especially when data overviews are involved. While not technically
impossible, implementing streaming in mCOG is more complex and not as efficient compared to Zarr's chunked
design, where this process is quite straightforward.

3. **Limited support for complex nested data structures**. mCOG does not support complex 
nested data structures, like a list of n-dimensional variables. It is designed to handle one
coordinate reference system (CRS) and one transform per file.

4. **Fixed Chunking Schema**: In mCOG, the chunking schema is dimensionally fixed. This means that
for a 4D array, the chunking structure can only be defined as:
  - `(1 × BLOCKXSIZE × BLOCKYSIZE)` when interleaves is band or tile,  
  - `(C × BLOCKXSIZE × BLOCKYSIZE)` when interleaves is by pixel, or  
  - `(C' × BLOCKXSIZE' × BLOCKYSIZE')` when `md:blockzsize` is different from 1.  
Unlike Zarr or NetCDF5, which naturally support flexible chunking, this constraint in mCOG can lead to 
larger file sizes, particularly when handling highly redundant data (e.g., climate datasets).


Despite these limitations, we believe that mCOG is currently the best option 
for many use cases. Whether you are creating a web map to visualize 10 years of changes in your 
village or building a deep learning dataset with multitemporal samples, mCOG provides a 
robust, mature, and reliable solution.
