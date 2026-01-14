/**
 * Standardized error types for MCP-PoB server
 */

export enum ErrorCode {
  INVALID_BASE64 = "INVALID_BASE64",
  DECOMPRESSION_ERROR = "DECOMPRESSION_ERROR",
  INVALID_XML = "INVALID_XML",
  UNSUPPORTED_VERSION = "UNSUPPORTED_VERSION",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  PASSIVE_TREE_ERROR = "PASSIVE_TREE_ERROR",
}

export interface McpError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details: string;
  };
}

/**
 * Creates a standardized error response for MCP tools
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: string
): McpError {
  return {
    success: false,
    error: {
      code,
      message,
      details: details || "",
    },
  };
}

/**
 * Error class for PoB parsing errors
 */
export class PoBParsingError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "PoBParsingError";
  }
}

/**
 * Wraps any error in a standardized MCP error response
 */
export function wrapError(error: unknown, context: string): McpError {
  if (error instanceof PoBParsingError) {
    return createErrorResponse(error.code, error.message, error.details);
  }

  if (error instanceof Error) {
    return createErrorResponse(
      ErrorCode.INVALID_XML,
      `${context}: ${error.message}`,
      error.stack
    );
  }

  return createErrorResponse(
    ErrorCode.INVALID_XML,
    `${context}: Unknown error`,
    String(error)
  );
}
