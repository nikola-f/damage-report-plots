import {PublishInput} from 'aws-sdk/clients/sns';
import AWS = require('aws-sdk');
import {Job, CreateJobMessage, QueueThreadsMessage,
  QueueMailsMessage, ParseMailsMessage,
  RecordReportsMessage, Agent} from '../types';
const sns: AWS.SNS = new AWS.SNS()
;


const TOPIC_PREFIX = 'arn:aws:sns:' + process.env.ARN_PART + ':',
  CONSUME_TOPIC = TOPIC_PREFIX + 'drp-consume-ticket',
  CREATE_JOB_TOPIC = TOPIC_PREFIX + 'drp-create-job',
  PUT_JOB_TOPIC = TOPIC_PREFIX + 'drp-put-job',
  CREATE_AGENT_QUEUE_TOPIC = TOPIC_PREFIX + 'drp-create-agent-queue',
  QUEUE_THREADS_TOPIC = TOPIC_PREFIX + 'drp-queue-threads',
  QUEUE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-queue-mails',
  PARSE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-parse-mails',
  RECORD_REPORTS_TOPIC = TOPIC_PREFIX + 'drp-record-reports',
  PUT_AGENT_TOPIC = TOPIC_PREFIX + 'drp-put-agent'
;



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


export function createAgentQueueAsync(job: Job): Promise<void> {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateAgentQueue',
    "TopicArn": CREATE_AGENT_QUEUE_TOPIC
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

export function recordReportsAsync(rrm: RecordReportsMessage): Promise<void> {
  return publish({
    "Message": JSON.stringify(rrm),
    "Subject": 'RecordReports',
    "TopicArn": RECORD_REPORTS_TOPIC
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
  console.log('do publish:' + JSON.stringify(input));
  sns.publish(input).promise()
  .then(() => {
    return Promise.resolve();
  })
  .catch((err) => {
    return Promise.reject(err);
  });
};
