import { ErrorCode, PoBParsingError } from "./error-handler.js";

/**
 * Validates and decodes a base64-encoded string
 * @param input - Base64 string to decode
 * @returns Decoded buffer
 * @throws PoBParsingError if input is invalid base64
 */
export function decodeBase64(input: string): Buffer {
  // Validate input is a non-empty string
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new PoBParsingError(
      ErrorCode.INVALID_BASE64,
      "Input must be a non-empty base64 string"
    );
  }

  // Validate base64 format (only valid base64 characters)
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(input.trim())) {
    throw new PoBParsingError(
      ErrorCode.INVALID_BASE64,
      "Input contains invalid base64 characters"
    );
  }

  try {
    // Decode base64 to buffer
    const decoded = Buffer.from(input.trim(), "base64");

    // Validate decoding produced output
    if (decoded.length === 0) {
      throw new PoBParsingError(
        ErrorCode.INVALID_BASE64,
        "Decoded buffer is empty"
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof PoBParsingError) {
      throw error;
    }
    throw new PoBParsingError(
      ErrorCode.INVALID_BASE64,
      "Failed to decode base64 input",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Checks if input appears to be a valid base64 string
 * (quick validation without full decoding)
 */
export function isValidBase64(input: string): boolean {
  if (typeof input !== "string" || input.trim().length === 0) {
    return false;
  }

  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(input.trim());
}
