import {PublishInput} from 'aws-sdk/clients/sns';
import AWS = require('aws-sdk');
import {Job, CreateJobMessage, QueueThreadsMessage,
  QueueMailsMessage, ParseMailsMessage,
  InsertReportsMessage, Agent, CreateTableMessage,
  CheckTableMessage} from '../types';
const sns: AWS.SNS = new AWS.SNS(),
      SNS_NOP: boolean = Boolean(process.env.SNS_NOP) || false;
;


const TOPIC_PREFIX = 'arn:aws:sns:' + process.env.ARN_PART + ':',
  CONSUME_TOPIC = TOPIC_PREFIX + 'drp-consume-ticket',
  CREATE_JOB_TOPIC = TOPIC_PREFIX + 'drp-create-job',
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


export function createTableAsync(ctm: CreateTableMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(ctm),
    "Subject": 'CreateTable',
    "TopicArn": CREATE_TABLE_TOPIC
  });
};


export function checkTableAsync(ctm: CheckTableMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(ctm),
    "Subject": 'CheckTable',
    "TopicArn": CHECK_TABLE_TOPIC
  });
};



export function createJobAsync(cjm: CreateJobMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(cjm),
    "Subject": 'CreateJob',
    "TopicArn": CREATE_JOB_TOPIC
  });
};


export function putJobAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'PutJob',
    "TopicArn": PUT_JOB_TOPIC
  });
};


export function finalizeJobAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'FinalizeJob',
    "TopicArn": FINALIZE_JOB_TOPIC
  });
};


export function queueJobAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueJob',
    "TopicArn": QUEUE_JOB_TOPIC
  });
};


export function createAgentQueueAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateAgentQueue',
    "TopicArn": CREATE_AGENT_QUEUE_TOPIC
  });
};


export function deleteAgentQueueAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'DeleteAgentQueue',
    "TopicArn": DELETE_AGENT_QUEUE_TOPIC
  });
};


export function putAgentAsync(agent: Agent): Promise<void> {
  return publish({
    "Message": JSON.stringify(agent),
    "Subject": 'PutJob',
    "TopicArn": PUT_JOB_TOPIC
  });
};


export function queueThreadsAsync(qtm: QueueThreadsMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(qtm),
    "Subject": 'QueueThreads',
    "TopicArn": QUEUE_THREADS_TOPIC
  });
};

export function queueMailsAsync(qmm: QueueMailsMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(qmm),
    "Subject": 'QueueMails',
    "TopicArn": QUEUE_MAILS_TOPIC
  });
};

export function parseMailsAsync(pmm: ParseMailsMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(pmm),
    "Subject": 'ParseMails',
    "TopicArn": PARSE_MAILS_TOPIC
  });
};

export function insertReportsAsync(irm: InsertReportsMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(irm),
    "Subject": 'RecordReports',
    "TopicArn": INSERT_REPORTS_TOPIC
  });
};



export function consumeTicketsAsync(number: number): Promise<void> {
  return publish({
    "Message": String(number),
    "Subject": 'ConsumeTicket',
    "TopicArn": CONSUME_TOPIC
  });
};


async function publish(input: PublishInput): Promise<void> {
  if(SNS_NOP) {
    console.log('do publish provisionally:' + JSON.stringify(input));
    return Promise.resolve();
  }
  console.log('do publish:' + JSON.stringify(input));
  sns.publish(input).promise()
  .then(() => {
    return Promise.resolve();
  })
  .catch((err) => {
    return Promise.reject(err);
  });
};
