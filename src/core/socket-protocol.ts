export const WORLD_REQUEST_MESSAGE = '420["world"]';

export function isEngineHandshake(message: string): boolean {
  return message.startsWith("0{");
}

export function isSessionEvent(message: string): boolean {
  return message.includes('["session",');
}

/** Parsed Foundry game session payload from a `session` socket event. */
export function parseSessionPayload(
  message: string
): { sessionId?: string; userId?: string } | null {
  if (!isSessionEvent(message)) {
    return null;
  }
  try {
    const payload = JSON.parse(message.slice(2)) as unknown[];
    const session = payload[1];
    if (session && typeof session === "object") {
      return session as { sessionId?: string; userId?: string };
    }
  } catch {
    return null;
  }
  return null;
}

export function parseWorldResponseMessage(message: string): {
  matched: boolean;
  data?: Record<string, unknown>;
  error?: Error;
} {
  if (!message.startsWith("430")) {
    return { matched: false };
  }

  try {
    const jsonPart = message.slice(3);
    const responseArray = JSON.parse(jsonPart) as unknown[];

    if (!Array.isArray(responseArray) || responseArray.length === 0) {
      return { matched: true, error: new Error("Invalid response format: expected array with data") };
    }

    const responseData = responseArray[0] as Record<string, unknown>;
    return { matched: true, data: responseData };
  } catch (error) {
    return {
      matched: true,
      error: new Error(`Failed to parse world response: ${error}`),
    };
  }
}

export function parseAckMessage(message: string): {
  matched: boolean;
  payload?: unknown[];
  error?: Error;
} {
  if (!message.startsWith("43")) {
    return { matched: false };
  }

  const jsonStart = message.indexOf("[");
  if (jsonStart === -1) {
    return { matched: true, error: new Error("Invalid ack format: missing JSON array") };
  }

  try {
    const jsonPart = message.slice(jsonStart);
    const responseArray = JSON.parse(jsonPart) as unknown[];

    if (!Array.isArray(responseArray) || responseArray.length === 0) {
      return { matched: true, error: new Error("Invalid ack format: empty payload") };
    }

    return { matched: true, payload: responseArray };
  } catch (error) {
    return { matched: true, error: new Error(`Failed to parse ack response: ${error}`) };
  }
}

export function buildModifyDocumentMessage(
  ackId: number,
  payload: unknown
): string {
  return `42${ackId}${JSON.stringify(payload)}`;
}
