
# Validation

Validates the integrity of a `tacozip` archive at different levels of depth.

```python
tacozip.validate(
    zip_path: str,
    level: int = TACOZIP_VALIDATE_NORMAL
) -> int
```

## Parameters

- `zip_path` (str): The path to the ZIP file to validate.
- `level` (int, optional): The validation level to perform.
- `tacozip.TACOZIP_VALIDATE_QUICK`: (Level 0) Checks the TACO header only. Very fast.
- `tacozip.TACOZIP_VALIDATE_NORMAL`: (Level 1) Header checks + structure (EOCD, Central Directory).
- `tacozip.TACOZIP_VALIDATE_DEEP`: (Level 2) All previous checks + CRC32 validation (slower).

## Returns

An integer status code.

- `tacozip.TACOZ_VALID` (0): The file is valid.
- Any other negative value (e.g., `TACOZ_INVALID_NO_TACO`): Indicates a specific validation error.

## Validation Levels

You can choose how deep the validation should be:

  - `tacozip.TACOZIP_VALIDATE_QUICK` (0): Checks the TACO header signature only. This is the fastest.
  - `tacozip.TACOZIP_VALIDATE_NORMAL` (1): Performs `QUICK` checks plus ZIP structural validation (EOCD, Central Directory).
  - `tacozip.TACOZIP_VALIDATE_DEEP` (2): Performs `NORMAL` checks plus CRC32 validation on the Central Directory. This is the slowest but most thorough.

### Validation Return Codes

The function returns an integer code. `TACOZ_VALID` (0) indicates success. Any other code indicates a problem.

| Return Code | Constant Name | Description |
| :--- | :--- | :--- |
| 0 | `TACOZ_VALID` | Valid TACO archive. |
| -10 | `TACOZ_INVALID_NOT_ZIP` | Not a ZIP file (missing LFH signature). |
| -11 | `TACOZ_INVALID_NO_TACO` | No `TACO_HEADER` at offset 0 (file modified by external tool). |
| -12 | `TACOZ_INVALID_HEADER_SIZE` | Invalid header size (corrupted). |
| -13 | `TACOZ_INVALID_META_COUNT` | Invalid metadata count (must be 0-7). |
| -14 | `TACOZ_INVALID_FILE_SIZE` | File too small to be a valid archive. |
| -20 | `TACOZ_INVALID_NO_EOCD` | No End of Central Directory record found. |
| -21 | `TACOZ_INVALID_CD_OFFSET` | Invalid Central Directory offset. |
| -22 | `TACOZ_INVALID_NO_CD_ENTRY`| `TACO_HEADER` not found in Central Directory. |
| -23 | `TACOZ_INVALID_REORDERED` | Archive entries reordered (CD doesn't point to offset 0). |
| -30 | `TACOZ_INVALID_CRC_LFH` | CRC32 mismatch in Local File Header. |
| -31 | `TACOZ_INVALID_CRC_CD` | CRC32 mismatch in Central Directory. |

## Example

```python
import tacozip

# You can import the error messages for better debugging
from tacozip.config import VALIDATION_ERROR_MESSAGES

archive_path = "my_archive.zip"
result = tacozip.validate(archive_path, level=tacozip.TACOZIP_VALIDATE_DEEP)

if result == tacozip.TACOZ_VALID:
    print(f"{archive_path} is valid.")
else:
    error_message = VALIDATION_ERROR_MESSAGES.get(result, "Unknown validation error")
    print(f"Validation FAILED: {error_message} (Code: {result})")
```