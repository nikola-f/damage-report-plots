import {GetQueueAttributesRequest, GetQueueAttributesResult,
  SendMessageBatchRequestEntryList, SendMessageBatchRequest,
  ReceiveMessageResult, ReceiveMessageRequest,
  MessageList, DeleteMessageBatchRequest,
  DeleteMessageBatchResult, DeleteMessageBatchRequestEntryList,
  Message} from 'aws-sdk/clients/sqs';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const sqs: AWS.SQS = new AWS.SQS();

const THREAD_COUNT: number = Number(process.env.THREAD_COUNT);

/**
 * キューに入っているメッセージの数を返す
 */
export const getNumberOfMessages = async (url: string): Promise<number> => {
  return new Promise<number>((resolve, reject) => {

    const params: GetQueueAttributesRequest = {
      QueueUrl: url,
      AttributeNames: ['ApproximateNumberOfMessages']
    };

    sqs.getQueueAttributes(params).promise()
    .then((result: GetQueueAttributesResult) => {
      resolve(Number(result.Attributes['ApproximateNumberOfMessages']));

    })
    .catch(reject);
  });
};


export const sendMessage = async (url: string, message: Message): Promise<number> => {
  return sendMessageBatch(url, [message]);
};


/**
 * まとめてキューイング
 */
export const sendMessageBatch = async (url: string,
  messages: MessageList): Promise<number> => {

    console.log('try to send messages:' + url);

    let queuedCount: number = 0;
    while(messages.length > 0) {
      // 10件ずつ
      const batchSize = messages.length>=10 ? 10 : messages.length
      const inBatch = messages.slice(0, batchSize);
      messages.splice(0, batchSize);

      let outBatch: SendMessageBatchRequestEntryList = [];
      for(let message of inBatch) {
        outBatch.push({
          "Id": message.MessageId,
          "MessageBody": message.Body,
          "MessageGroupId": "0" //固定値
        })
      }

      const req: SendMessageBatchRequest = {
        QueueUrl: url,
        Entries: outBatch,
      };
      try {
        await sqs.sendMessageBatch(req).promise();
        queuedCount += outBatch.length;
      }catch(err){
        console.error(err);
        continue;
      }
    }
    return Promise.resolve(queuedCount);
};

/**
 * 1件だけキューから受信
 */
export const receiveMessage = async (url: string): Promise<Message> => {

  console.log('try to receive message:' + url);

  const messages: MessageList = await receiveMessageBatch(url, 1);
  if(messages.length > 0) {
    return Promise.resolve(messages[0]);
  }else{
    return Promise.resolve(null);
  }
};

/**
 * 最大maxCount件 キューから受信
 */
export const receiveMessageBatch = async (url: string, maxCount: number): Promise<MessageList> => {

  console.log('try to receive messages:' + url);

  let remain = maxCount;
  let result: MessageList = [];
  while(remain > 0) {
    // console.log('remain:', remain);
    
    const req: ReceiveMessageRequest = {
      "MaxNumberOfMessages": 10,
      "QueueUrl": url
    };
    let res: ReceiveMessageResult;
    try {
      res = await sqs.receiveMessage(req).promise();
      
      // console.log('dump:', res);
    }catch(err){
      console.error(err);
      continue;
    }
    if(!res.Messages) {
      break;
    }
    remain -= res.Messages.length;
    Array.prototype.push.apply(result, res.Messages);
    
    const deletedCount = await deleteMessageBatch(url, res.Messages);

    if(res.Messages.length < 10) {
      break;
    }
  }

  console.log(`${result.length} messages received from ${url}`);
  return Promise.resolve(result);
};


/**
 * 1件だけキューから削除
 */
export const deleteMessage = async (url: string, message: Message): Promise<number> => {
  return deleteMessageBatch(url, [message]);
};


/**
 * まとめてキューから削除
 */
export const deleteMessageBatch = async (url: string, messages: MessageList): Promise<number> => {

  // console.log('try to delete messages:' + url);

  let deletedCount: number = 0;
  let toDeleteList = messages.slice();
  while(toDeleteList.length > 0) {
    // 10件ずつ
    let inBatch: MessageList = [];
    const batchSize = toDeleteList.length>=10 ? 10 : toDeleteList.length
    inBatch = toDeleteList.slice(0, batchSize);
    toDeleteList.splice(0, batchSize);

    let outBatch: DeleteMessageBatchRequestEntryList = [];
    for(let message of inBatch) {
      outBatch.push({
        "Id": message.MessageId,
        "ReceiptHandle": message.ReceiptHandle
      });
    }

    const req: DeleteMessageBatchRequest = {
      QueueUrl: url,
      Entries: outBatch
    };
    try {
      await sqs.deleteMessageBatch(req).promise();
      deletedCount += outBatch.length;
    }catch(err){
      console.error(err);
      continue;
    }
  }

  console.info(`${deletedCount} messages deleted.`);
  return Promise.resolve(deletedCount);
};
