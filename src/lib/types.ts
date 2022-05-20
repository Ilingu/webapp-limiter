export interface StorageShape {
  [url: string]: WebsiteLimiterShape;
}

export interface WebsiteLimiterShape {
  url: string;
  enable: boolean;
  MAX_TIME: number;
  ElapsedTime?: number;
  LastSession?: number /* timestamp */;
}
