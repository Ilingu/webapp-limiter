export interface StorageShape {
  [url: string]: WebsiteLimiterShape;
}

export interface WebsiteLimiterShape {
  url: string;
  enable: boolean;
  MAX_TIME: number;
  ElapsedTime?: number;
  LastSession?: number /* timestamp */;
  ActiveSession: boolean;
}

export enum ConnInstruction {
  WORK, // From boss to worker
  REST, // From boss to worker
  REPORT, // From worker to boss
}

export interface BgCallPayload {
  do: ConnInstruction;
  proof: string;
}
export interface BgResShape {
  WorkSucceed: boolean;
  proof: string;
  resType: ConnInstruction.REPORT;
}
