import { PoBParsingError, ErrorCode } from "./error-handler.js";
import { inflateSync, inflateRawSync } from "zlib";

/**
 * Decompresses zlib-compressed data
 * @param compressed - Buffer containing zlib-compressed data
 * @returns Decompressed string
 * @throws PoBParsingError if decompression fails
 */
export function decompressZlib(compressed: Buffer): string {
  // Validate input is a buffer
  if (!Buffer.isBuffer(compressed)) {
    throw new PoBParsingError(
      ErrorCode.DECOMPRESSION_ERROR,
      "Input must be a Buffer"
    );
  }

  // Validate buffer is not empty
  if (compressed.length === 0) {
    throw new PoBParsingError(
      ErrorCode.DECOMPRESSION_ERROR,
      "Compressed buffer is empty"
    );
  }

  try {
    // Decompress using Node.js built-in zlib
    const decompressed = inflateSync(compressed);

    // Validate decompression produced output
    if (decompressed.length === 0) {
      throw new PoBParsingError(
        ErrorCode.DECOMPRESSION_ERROR,
        "Decompressed buffer is empty"
      );
    }

    // Convert to UTF-8 string
    return decompressed.toString("utf-8");
  } catch (error) {
    if (error instanceof PoBParsingError) {
      throw error;
    }
    throw new PoBParsingError(
      ErrorCode.DECOMPRESSION_ERROR,
      "Failed to decompress zlib data",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Attempts decompression with fallback for different compression formats
 * Tries zlib inflate first, then falls back to raw deflate
 */
export function decompressWithFallback(compressed: Buffer): string {
  try {
    // Try standard zlib inflation first
    return decompressZlib(compressed);
  } catch (zlibError) {
    try {
      // Try raw deflate (some PoB versions use this)
      const decompressed = inflateRawSync(compressed);
      if (decompressed.length === 0) {
        throw zlibError;
      }
      return decompressed.toString("utf-8");
    } catch (rawError) {
      throw new PoBParsingError(
        ErrorCode.DECOMPRESSION_ERROR,
        "Failed to decompress with both zlib and raw deflate",
        `zlib: ${zlibError instanceof Error ? zlibError.message : String(zlibError)}`
      );
    }
  }
}
