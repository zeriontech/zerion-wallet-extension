export interface ParsedError {
  code: number | null;
  display: string | null;
  message: string;
}

export function parseError(error: Error): ParsedError {
  const { message } = error;
  const code = 'code' in error ? Number(error.code) : null;
  let display: string | null = null;
  let match: null | RegExpMatchArray = null;
  if (
    /insufficient funds/i.test(message) ||
    /consumed \d+ of \d+ compute units/i.test(message)
  ) {
    display = 'Insufficient Funds';
  } else if (/no record of a prior credit/i.test(message)) {
    display = 'Insufficient Funds';
  } else if ((match = message.match(/"message\\?":\\?"([^"]+)\\?"/))) {
    display = match.at(1)?.replace('\\', '') ?? null;
  }
  return { code, display, message };
}
