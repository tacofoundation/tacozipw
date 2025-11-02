# Create

Creates a new, STORE-only ZIP archive with an embedded TACO Header.

```python
tacozip.create(
    zip_path: str,
    src_files: List[Union[str, pathlib.Path]],
    arc_files: List[str] = None,
    entries: List[Tuple[int, int]] = None
)
```

## Parameters
- `zip_path` (str): The output path for the ZIP file to be created.
- `src_files` (List[Union[str, pathlib.Path]]): A list of file paths on disk to be added to the archive.
- `arc_files` (List[str], optional): A list of names the files will have *inside* the ZIP. If `None`, the base names from `src_files` will be used. Must match the length of `src_files`.
- `entries` (List[Tuple[int, int]], optional): The metadata list to write into the TACO Header. Must be a list of up to 7 `(offset, length)` tuples. If `None`, a single empty `[(0, 0)]` entry is written.

## Raises

- `TacozipError`: If the C library returns an error (e.g., `TACOZ_ERR_IO`, `TACOZ_ERR_LIBZIP`).
- `ValueError`: If `arc_files` and `src_files` lengths do not match, or if more than 7 `entries` are provided.

## Example

```python
import tacozip
import os

# Create a dummy data file
with open("data.bin", "wb") as f:
    f.write(os.urandom(1000))

# Define metadata (e.g., offset, length)
metadata = [(100, 200), (300, 400)]

# Create the archive
tacozip.create(
    "my_archive.zip",
    src_files=["data.bin"],
    arc_files=["data_in_zip.bin"],
    entries=metadata
)

os.remove("data.bin")
os.remove("my_archive.zip")
```
