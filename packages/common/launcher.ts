import {PublishInput} from 'aws-sdk/clients/sns';
import {Job, CreateJobMessage, QueueThreadsMessage,
  Agent} from './types';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);

import * as env from './env';

const sns: AWS.SNS = new AWS.SNS();


const TOPIC_PREFIX = 'arn:aws:sns:' + env.ARN_REGION_ACCOUNT + ':',
  CONSUME_TOPIC = TOPIC_PREFIX + 'drp-consume-ticket',
  PUT_JOB_TOPIC = TOPIC_PREFIX + 'drp-put-job',
  QUEUE_JOB_TOPIC = TOPIC_PREFIX + 'drp-queue-job',
  FINALIZE_JOB_TOPIC = TOPIC_PREFIX + 'drp-finalize-job',
  CREATE_AGENT_QUEUE_TOPIC = TOPIC_PREFIX + 'drp-create-agent-queue',
  DELETE_AGENT_QUEUE_TOPIC = TOPIC_PREFIX + 'drp-delete-agent-queue',
  QUEUE_THREADS_TOPIC = TOPIC_PREFIX + 'drp-queue-threads',
  QUEUE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-queue-mails',
  PARSE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-parse-mails',
  INSERT_REPORTS_TOPIC = TOPIC_PREFIX + 'drp-insert-reports',
  PUT_AGENT_TOPIC = TOPIC_PREFIX + 'drp-put-agent',
  CREATE_TABLE_TOPIC = TOPIC_PREFIX + 'drp-create-table',
  CHECK_TABLE_TOPIC = TOPIC_PREFIX + 'drp-check-table'
;


export const createTableAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateTable',
    "TopicArn": CREATE_TABLE_TOPIC
  });
};


export const checkTableAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CheckTable',
    "TopicArn": CHECK_TABLE_TOPIC
  });
};



export const putJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'PutJob',
    "TopicArn": PUT_JOB_TOPIC
  });
};


export const finalizeJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'FinalizeJob',
    "TopicArn": FINALIZE_JOB_TOPIC
  });
};


export const queueJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueJob',
    "TopicArn": QUEUE_JOB_TOPIC
  });
};


export const createAgentQueueAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateAgentQueue',
    "TopicArn": CREATE_AGENT_QUEUE_TOPIC
  });
};


export const deleteAgentQueueAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'DeleteAgentQueue',
    "TopicArn": DELETE_AGENT_QUEUE_TOPIC
  });
};


export const putAgentAsync = (agent: Agent): Promise<void> => {
  return publish({
    "Message": JSON.stringify(agent),
    "Subject": 'PutAgent',
    "TopicArn": PUT_AGENT_TOPIC
  });
};


export const queueThreadsAsync = (qtm: QueueThreadsMessage): Promise<void> => {
  return publish({
    "Message": JSON.stringify(qtm),
    "Subject": 'QueueThreads',
    "TopicArn": QUEUE_THREADS_TOPIC
  });
};

export const queueMailsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueMails',
    "TopicArn": QUEUE_MAILS_TOPIC
  });
};

export const parseMailsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'ParseMails',
    "TopicArn": PARSE_MAILS_TOPIC
  });
};

export const insertReportsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'RecordReports',
    "TopicArn": INSERT_REPORTS_TOPIC
  });
};



export const consumeTicketsAsync = (number: number): Promise<void> => {
  return publish({
    "Message": String(number),
    "Subject": 'ConsumeTicket',
    "TopicArn": CONSUME_TOPIC
  });
};


const publish = async (input: PublishInput): Promise<void> => {
  if(env.SNS_NOP) {
    console.log('do publish provisionally:' + JSON.stringify(input));
    return Promise.resolve();
  }
  console.log('do publish:' + JSON.stringify(input));
  try {
    await sns.publish(input).promise();
    return Promise.resolve();
  }catch(err){
    return Promise.reject(err);
  }
};
