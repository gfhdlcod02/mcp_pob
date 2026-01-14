/**
 * PoB XML Structure Parser
 *
 * Decodes base64, decompresses zlib, and extracts root XML element
 */

import { XMLParser } from "fast-xml-parser";
import { decodeBase64 } from "../utils/base64-decoder.js";
import { decompressWithFallback } from "../utils/decompressor.js";
import { ErrorCode, PoBParsingError } from "../utils/error-handler.js";

/**
 * Parses a PoB build code and returns the root XML object
 * @param buildCode - Base64-encoded, zlib-compressed PoB XML
 * @returns Parsed XML object
 * @throws PoBParsingError if parsing fails
 */
export function parsePoBXML(buildCode: string): any {
  // Step 1: Decode base64
  const decodedBuffer = decodeBase64(buildCode);

  // Step 2: Decompress zlib
  const xmlString = decompressWithFallback(decodedBuffer);

  // Step 3: Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseAttributeValue: true,
    trimValues: true,
  });

  try {
    const parsed = parser.parse(xmlString);

    // Validate root element is PathOfBuilding
    if (!parsed.PathOfBuilding) {
      throw new PoBParsingError(
        ErrorCode.INVALID_XML,
        "Root element must be <PathOfBuilding>"
      );
    }

    return parsed.PathOfBuilding;
  } catch (error) {
    if (error instanceof PoBParsingError) {
      throw error;
    }
    throw new PoBParsingError(
      ErrorCode.INVALID_XML,
      "Failed to parse XML structure",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Validates PoB version
 */
export function validatePoBVersion(pobXML: any): void {
  if (!pobXML.version) {
    throw new PoBParsingError(
      ErrorCode.UNSUPPORTED_VERSION,
      "PoB version not specified"
    );
  }

  const version = pobXML.version;
  const minVersion = "1.4.170";

  // Simple version string comparison (works for our format)
  if (version < minVersion) {
    throw new PoBParsingError(
      ErrorCode.UNSUPPORTED_VERSION,
      `PoB version ${version} is not supported (minimum: ${minVersion})`
    );
  }
}
