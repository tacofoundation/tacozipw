# What is a Temporal GeoTIFF?

The Temporal GeoTIFF builds upon the mGeoTIFF format by adopting a stricter convention definition. A temporal 
GeoTIFF file **MUST** adhere to the following rules:

1. **Dimensions**: The file must include exactly four dimensions with the following names:
    - `time`: The temporal dimension.
    - `band`: The spectral dimension.
    - `x`: The spatial dimension along the x-axis.
    - `y`: The spatial dimension along the y-axis.

2. **Required Metadata Attributes**: The following metadata attributes are mandatory:
    - `md:id`: A unique identifier for the observation.
    - `md:time_start`: The nominal start time of the observation.
    - `md:time_end`: The nominal end time of the observation (optional).   

<!-- For additional information, please refer to the [Specification](SPECIFICATION.md). -->
