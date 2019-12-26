
export interface Session {
  openId: string,

  createTime: number,
  lastAccessTime: number,
  // ttl: number,
  photoUrl?: string
  tokens: Tokens
}

export interface Tokens {
  meAccessToken?: string,
  jobAccessToken?: string,
  jobRefreshToken?: string,
}


export interface Agent {
  openId: string,

  createTime: number,
  lastAccessTime: number,
  // reportTableId?: string,
  spreadsheetId?: string,

  // mUpv?: number,
  // mUpc?: number

}

export enum JobStatus {
  Created, Processing, Timeout, Done, Cancelled
}

export interface Job {
  openId: string,
  createTime: number,

  status: JobStatus,
  lastAccessTime: number,
  rangeFromTime?: number,
  rangeToTime?: number,
  tokens: Tokens,
  agent: Agent,
  ranges?: Range[],
  thread?: {
    queueUrl: string,
    queuedCount: number
  },
  report?: {
    queueUrl: string,
    queuedCount: number
  }
}

export interface Range {
  fromTime: number,
  toTime: number,
  done: boolean
}


export interface CreateJobMessage {
  rangeFromTime: number,
  rangeToTime: number,
}


export interface QueueThreadsMessage {
  job: Job,
  nextPageToken?: string
}


export interface ThreadArrayMessage {
  ids: string[]
}

// TODEL
export interface OneThreadMessage {
  id: string
}

export interface OneMailMessage {
  id: string,
  internalDate: number;
  body: string
}


export interface OneReportMessage {
  // mailId: string,
  mailDate: number;
  portal: Portal
}


export interface Portal {
  name: string,
  latitude: number,
  longitude: number,
  owned: boolean
}


export interface EstimatedMailCount {
  count: number,
  startDate: number,
  endDate: number
}


export interface CreateJobRequest {
  jwt: string,
  accessToken: string
}


// export as namespace DamageReportPlots;

// declare module "*.json" {
//     const value: any;
//     export default value;
// }
