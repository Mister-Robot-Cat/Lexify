import "server-only";

/** Server time in ms, sent to the browser so timers ignore a wrong device clock. */
export function serverClock(): number {
  return Date.now();
}
