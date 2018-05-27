
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
  // stateToken?: string
}


export interface Agent {
  openId: string,

  createTime: number,
  lastAccessTime: number,
  reportTableId?: string,
  // plotTableId?: string,
  // statTableId?: string

  mUpv?: number,
  mUpc?: number

}

export enum JobStatus {
  Created, Processing, Done, Cancelled
}

export interface Job {
  openId: string,
  createTime: number,

  status: JobStatus,
  lastAccessTime: number,
  rangeFromTime: number,
  rangeToTime: number,
  tokens: Tokens,
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
  rangeFromTime: number,
  rangeToTime: number,
}


export interface QueueThreadsMessage {
  job: Job,
  nextPageToken?: string
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
