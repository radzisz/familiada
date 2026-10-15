/** Runtime precondition / postcondition check. Throws with a clear message when violated. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AssertionError(message);
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(`Assertion failed: ${message}`);
    this.name = "AssertionError";
  }
}
