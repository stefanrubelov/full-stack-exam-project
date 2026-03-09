// Named constants for the union types generated from the server.
// Import values from here; types remain compatible with generated-ts-client.

export const TurbineStatus = {
  Running: 'running',
  Stopped: 'stopped',
  Unknown: 'unknown',
} as const;

export type TurbineStatus = typeof TurbineStatus[keyof typeof TurbineStatus];

export const TurbineAction = {
  Start: 'start',
  Stop: 'stop',
  SetPitch: 'setPitch',
  SetInterval: 'setInterval',
} as const;

export type TurbineAction = typeof TurbineAction[keyof typeof TurbineAction];
