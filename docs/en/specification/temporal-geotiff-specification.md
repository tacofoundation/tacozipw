# The Temporal COG

## Overview

[Temporal mini cubes](https://www.cambridge.org/core/journals/environmental-data-science/article/earth-system-data-cubes-avenues-for-advancing-earth-system-research/C49F497A29699C7A1A6A2830755CAA6D) are becoming increasingly popular in the Earth Observation community. They are used to store time series of satellite images, facilitating the analysis of land cover changes, crop monitoring, and other time-sensitive applications. The temporal COG (tCOG) specification refines the mCOG format by enforcing a more stringent convention for defining the time dimension.

<figure style="display: flex; flex-direction: column; align-items: center">
  <img src="../../public/content-tcog.svg" alt="Band GIF" style="width: 60%">
</figure>

## Format

This is the version `0.1.0` of the tCOG specification. The main difference between a mCOG and a tCOG is that the `md:pattern` is explicitly defined as `time band x y -> (band time) x y`. Additionally, certain dimensions **MUST**
be included in the `md:coordinates` field of the **`MD_METADATA`** mCOG tag:

| Attribute | Type | Required | Details |
|---|---|---|---|
| time | [Temporal Dimension Object](https://github.com/stac-extensions/datacube?tab=readme-ov-file#temporal-dimension-object) | Yes |The nominal start time of acquisition (`time_start`).  Based on the [datacube STAC extension](https://github.com/stac-extensions/datacube) proposed by [Matthias Mohr](https://mohr.ws/). |
| time_end | [Temporal Dimension Object](https://github.com/stac-extensions/datacube?tab=readme-ov-file#temporal-dimension-object) |  No | The nominal end time of the acquisition or composite period. It **MUST** have the same length as the `time` dimension. |
| id | [Additional Dimension Object](https://github.com/stac-extensions/datacube?tab=readme-ov-file#additional-dimension-object) | No | A unique identifier for each time step. Therefore, it **MUST** have the same length as the `time` dimension. |

## Example

The following is an example of the `MD_METADATA` tag in a tCOG file:

```json
{
  "md:pattern": "time band y x -> (band time) y x",
  "md:coordinates": {
    "time": {
        "type": "temporal",
        "extent": [
            "1980:00:00T00:00:00Z",
            "2020:00:00T00:00:00Z"
        ],
        "description": "Annual",
        "step": "P1Y"
    },
    "band": {
        "type": "bands",
        "values": [
          "red",
          "green",
          "blue"
        ]
    },
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
    }
  },
  "md:attributes": {
    "title": "Temporal COG Example",
    "description": "This is a toy example of a tCOG file."
  }
}
```
