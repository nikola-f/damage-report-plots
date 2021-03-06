
export interface Session {
  sessionId: string,
  
  openId: string,
  idToken: string,
  createTime: number,
  ttl: number
}

// export interface Tokens {
//   meAccessToken?: string,
//   jobAccessToken?: string,
//   jobRefreshToken?: string,
// }


export interface Agent {
  openId: string,

  createTime: number,
  lastAccessTime: number,
  spreadsheetId?: string,
  name?: string,
  picture?: string,
  locale?: string

}

export enum JobStatus {
  Created, Processing, Timeout, Done, Cancelled
}

export interface Job {
  openId: string,
  createTime: number,

  status: JobStatus,
  lastAccessTime: number,
  lastReportTime?: number,
  rangeToTime?: number,
  // tokens: Tokens,
  accessToken: string,
  expiredAt: number,
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
  accessToken: string,
  expiredAt: number,
  rangeToTime: number,
  // rangeFromTime: number,
  // rangeToTime: number,
}


export interface QueueThreadsMessage {
  job: Job,
  range: Range,
  nextPageToken?: string
}


export interface ThreadArrayMessage {
  range: Range,
  ids: string[]
}

// TODEL
export interface OneThreadMessage {
  id: string
}

export interface OneMailMessage {
  id: string,
  internalDate: number,
  body: string
}


export interface OneReportMessage {
  mailDate: number,
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


// export interface CreateJobRequest {
//   jwt: string,
//   accessToken: string,
//   expiredAt: number
// }


// export as namespace DamageReportPlots;

// declare module "*.json" {
//     const value: any;
//     export default value;
// }
