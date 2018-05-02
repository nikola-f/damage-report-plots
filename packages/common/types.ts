
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
  stateToken?: string
}


export interface Agent {
  openId: string,

  createTime: number,
  lastAccessTime: number,
  reportTableId?: string,
  // plotTableId?: string,
  // statTableId?: string

  // threadQueueUrl: string,
  // mailQueueUrl: string,
  mUpv?: number,
  mUpc?: number

}

export enum JobStatus {
  Created, Processing, Done, Cancelled
}

export interface Job {
  // agent: Agent,
  openId: string,
  createTime: number,

  status: JobStatus,
  lastAccessTime: number,
  rangeFromTime: number,
  rangeToTime: number,
  tokens: any,
  thread?: {
    queueUrl: string,
    queuedCount: number
    dequeuedCount: number,
  },
  mail?: {
    queueUrl: string,
    queuedCount: number
    dequeuedCount: number,
  },
  report?: {
    queueUrl: string,
    queuedCount: number
    dequeuedCount: number,
  }
}


export interface CreateJobMessage {
  // agent: Agent,
  rangeFromTime: number,
  rangeToTime: number,
  stateToken: string
  // tokens: any
}


export interface QueueThreadsMessage {
  job: Job,
  nextPageToken?: string
}

export interface QueueMailsMessage {
  job: Job,
}

export interface ParseMailsMessage {
  job: Job,
}

export interface InsertReportsMessage {
  job: Job,
}

export interface CreateTableMessage {
  agent: Agent,
  tokens: any
}

export interface CheckTableMessage {
  agent: Agent,
  tokens: any
}


export interface OneThreadMessage {
  id: string
}

export interface OneMailMessage {
  id: string,
  internalDate: number;
  body: string
}


export interface OneReportMessage {
  mailId: string,
  mailDate: number;
  portal: Portal
}


export interface Portal {
  name: string,
  latitude: number,
  longitude: number,
  owned: boolean
}



export interface EphemeralHistory {
  remoteIpAddress: string,

  ttl: number
}

// export as namespace DamageReportPlots;

// declare module "*.json" {
//     const value: any;
//     export default value;
// }