import {PublishInput} from 'aws-sdk/clients/sns';
import {Job, CreateJobMessage, QueueThreadsMessage,
  Agent} from './types';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);

import * as env from './env';

const sns: AWS.SNS = new AWS.SNS();


const TOPIC_PREFIX = 'arn:aws:sns:' + env.ARN_REGION_ACCOUNT + ':';


// export const createTableAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CreateTable',
//     "TopicArn": CREATE_TABLE_TOPIC
//   });
// };

export const createSheetsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateSheets',
    "TopicArn": TOPIC_PREFIX + 'drp-create-sheets'
  });
};


// export const checkTableAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CheckTable',
//     "TopicArn": CHECK_TABLE_TOPIC
//   });
// };



export const putJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'PutJob',
    "TopicArn": TOPIC_PREFIX + 'drp-put-job'
  });
};


export const finalizeJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'FinalizeJob',
    "TopicArn": TOPIC_PREFIX + 'drp-finalize-job'
  });
};


export const queueJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueJob',
    "TopicArn": TOPIC_PREFIX + 'drp-queue-job'
  });
};


export const createAgentQueueAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'CreateAgentQueue',
    "TopicArn": TOPIC_PREFIX + 'drp-create-agent-queue'
  });
};


export const deleteAgentQueueAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'DeleteAgentQueue',
    "TopicArn": TOPIC_PREFIX + 'drp-delete-agent-queue'
  });
};


export const putAgentAsync = (agent: Agent): Promise<void> => {
  return publish({
    "Message": JSON.stringify(agent),
    "Subject": 'PutAgent',
    "TopicArn": TOPIC_PREFIX + 'drp-put-agent'
  });
};


export const queueThreadsAsync = (qtm: QueueThreadsMessage): Promise<void> => {
  return publish({
    "Message": JSON.stringify(qtm),
    "Subject": 'QueueThreads',
    "TopicArn": TOPIC_PREFIX + 'drp-queue-threads'
  });
};

export const queueMailsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueMails',
    "TopicArn": TOPIC_PREFIX + 'drp-queue-mails'
  });
};

export const parseMailsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'ParseMails',
    "TopicArn": TOPIC_PREFIX + 'drp-parse-mails'
  });
};

// export const insertReportsAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'InsertReports',
//     "TopicArn": INSERT_REPORTS_TOPIC
//   });
// };



export const consumeTicketsAsync = (number: number): Promise<void> => {
  return publish({
    "Message": String(number),
    "Subject": 'ConsumeTicket',
    "TopicArn": TOPIC_PREFIX + 'drp-consume-ticket'
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
