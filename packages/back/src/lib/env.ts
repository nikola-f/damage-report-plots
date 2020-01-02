export const AWS_REGION: string = process.env.AWS_REGION || '';
export const ARN_REGION_ACCOUNT: string = process.env.ARN_REGION_ACCOUNT || '';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const GOOGLE_CALLBACK_URL_ME = process.env.GOOGLE_CALLBACK_URL_ME || '';
export const GOOGLE_CALLBACK_URL_JOB = process.env.GOOGLE_CALLBACK_URL_JOB || '';

export const SESSION_SECRET = process.env.SESSION_SECRET || '';

export const SNS_NOP: boolean = process.env.SNS_NOP === 'false' ? false : true;

export const CLIENT_ORIGIN: string = process.env.CLIENT_ORIGIN || '';


export const THREAD_FETCH_COUNT: number = 
  process.env.THREAD_FETCH_COUNT ? Number(process.env.THREAD_FETCH_COUNT) : undefined;
export const THREAD_QUEUE_ARRAY_SIZE: number = 
  process.env.THREAD_QUEUE_ARRAY_SIZE ? Number(process.env.THREAD_QUEUE_ARRAY_SIZE) : undefined;
export const THREAD_ARRAY_DEQUEUE_COUNT: number = 
  process.env.THREAD_ARRAY_DEQUEUE_COUNT ? Number(process.env.THREAD_ARRAY_DEQUEUE_COUNT) : undefined;

export const REPORTS_ARRAY_DEQUEUE_COUNT: number = 
  process.env.REPORTS_ARRAY_DEQUEUE_COUNT ? Number(process.env.REPORTS_ARRAY_DEQUEUE_COUNT) : undefined;

