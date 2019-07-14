export const AWS_REGION = process.env.AWS_REGION || '';
export const ARN_REGION_ACCOUNT = process.env.ARN_REGION_ACCOUNT || '';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const GOOGLE_CALLBACK_URL_ME = process.env.GOOGLE_CALLBACK_URL_ME || '';
export const GOOGLE_CALLBACK_URL_JOB = process.env.GOOGLE_CALLBACK_URL_JOB || '';

export const SESSION_SECRET = process.env.SESSION_SECRET || '';

export const SNS_NOP: boolean = process.env.SNS_NOP === 'false' ? false : true;