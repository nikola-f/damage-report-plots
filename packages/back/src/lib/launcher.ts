import {PublishInput} from 'aws-sdk/clients/sns';
import {Job, CreateJobMessage, QueueThreadsMessage,
  Agent} from '@common/types';

import * as env from './env';

import * as AWS from 'aws-sdk';
const sns: AWS.SNS = new AWS.SNS();


const TOPIC_PREFIX = 'arn:aws:sns:' + env.ARN_REGION_ACCOUNT + ':';


// export const createTableAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CreateTable',
//     "TopicArn": CREATE_TABLE_TOPIC
//   });
// };

// export const createSheetsAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CreateSheets',
//     "TopicArn": TOPIC_PREFIX + 'drp-create-sheets'
//   });
// };


export const preExecuteJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'PreExecuteJob',
    "TopicArn": TOPIC_PREFIX + 'drp-pre-execute-job'
  });
};


// export const checkSheetsExistenceAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CheckSheetsExistence',
//     "TopicArn": TOPIC_PREFIX + 'drp-check-sheets-existence'
//   });
// };

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


export const postExecuteJobAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'PostExecuteJob',
    "TopicArn": TOPIC_PREFIX + 'drp-post-execute-job'
  });
};


// export const queueJobAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'QueueJob',
//     "TopicArn": TOPIC_PREFIX + 'drp-queue-job'
//   });
// };


// export const createAgentQueueAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'CreateAgentQueue',
//     "TopicArn": TOPIC_PREFIX + 'drp-create-agent-queue'
//   });
// };


// export const deleteAgentQueueAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'DeleteAgentQueue',
//     "TopicArn": TOPIC_PREFIX + 'drp-delete-agent-queue'
//   });
// };


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

// export const queueMailsAsync = (job: Job): Promise<void> => {
//   return publish({
//     "Message": JSON.stringify(job),
//     "Subject": 'QueueMails',
//     "TopicArn": TOPIC_PREFIX + 'drp-queue-mails'
//   });
// };

export const queueReportsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'QueueReports',
    "TopicArn": TOPIC_PREFIX + 'drp-queue-reports'
  });
};

export const appendReportsToSheetsAsync = (job: Job): Promise<void> => {
  return publish({
    "Message": JSON.stringify(job),
    "Subject": 'AppendReportsToSheets',
    "TopicArn": TOPIC_PREFIX + 'drp-append-reports-to-sheets'
  });
};



const publish = async (input: PublishInput): Promise<void> => {
  if(env.SNS_NOP) {
    console.log('do publish provisionally:' + JSON.stringify(input));
    return Promise.resolve();
  }
  // console.log(typeof env.ARN_REGION_ACCOUNT);
  // console.log(env.ARN_REGION_ACCOUNT);
  // console.log(input.TopicArn);
  // console.log(process.env.ARN_REGION_ACCOUNT);
  try {
    await sns.publish(input).promise();
    console.log('published:' + JSON.stringify(input));
    return Promise.resolve();
  }catch(err){
    console.error(err);
    throw err;
    // return Promise.reject(err);
  }
};
