import { assertEquals, mockClient, SQSClient, GetQueueAttributesCommand,
    SendMessageBatchCommand, ReceiveMessageCommand, DeleteMessageBatchCommand } from "./deps.ts";
import { Queue } from "./handler.ts";
import { Report } from "./model.ts";

Deno.test({
    name: "MockQueue#length()",
    fn: async () => {
        const mockSQS = mockClient(SQSClient);
        mockSQS.on(GetQueueAttributesCommand).resolves({Attributes: {
            ApproximateNumberOfMessages: "123"
        }});

        const url = '';
        const queue = new Queue(url);
        assertEquals(await queue.length(), 123);

        mockSQS.reset();
    }
})


Deno.test({
    name: "MockQueue#send()",
    fn: async (t) => {
        const mockSQS = mockClient(SQSClient);
        mockSQS.on(SendMessageBatchCommand).resolves({Successful: [
            {Id: "1", MessageId: "1", MD5OfMessageBody: "dummy-md5"}
        ]});
        const url = '';
        const queue = new Queue(url);
        const auth = {
            accessToken: "dummy-token",
            userId: "dummy-user-id@example.com"
        };

        await t.step({
            name: "3 reports",
            fn: async () => {
                const response = await queue.send([
                    new Report(1662685525000, 35.695427, -139.770442, false, "old name"),
                    new Report(1662685526000, 35.695427, -139.770442, true,  "old name/owned"),
                    new Report(1662685525000, -35.695427, 139.770442, false, "another portal"),
                ], auth
                );
                assertEquals(response.successful, 1); // mock
                assertEquals(response.failed, 0);
                assertEquals(response.message, 1);
                assertEquals(response.batch, 1);
            }
        });

        await t.step({
            name: "33000 reports, 16 messages, 2 batches",
            fn: async () => {
                const reportArray = [];
                for(let i=0; i<33000; i++) {
                    reportArray.push(new Report(1662685525000, 35.695427, -139.770442, false, `PORTAL NAME ********************************${i}}`));
                }
                const response = await queue.send(reportArray, auth);
                assertEquals(response.successful, 2); // mock
                assertEquals(response.failed, 0);
                assertEquals(response.message, 16);
                assertEquals(response.batch, 2);
            }
        });

        mockSQS.reset();
    }
});

Deno.test({
    name: "MockQueue#receive()",
    fn: async (t) => {
        const mockSQS = mockClient(SQSClient);
        mockSQS.on(ReceiveMessageCommand).resolvesOnce({
            Messages: [
                {
                    Body: "[[1662685525,35.695427,-139.770442,0,\"old name\"],[1662685526,35.695427,-139.770442,1,\"old name/owned\"],[1662685525,-35.695427,139.770442,0,\"another portal\"]]",
                    ReceiptHandle: "dummy-handle-0"
                },
            ]})
        .on(DeleteMessageBatchCommand).resolvesOnce({
            Successful: [{Id: "0"}, {Id: "1"}, {Id: "2"}],
            Failed: []
        });
        const url = '';
        const queue = new Queue(url);

        await t.step({
            name: "3 reports",
            fn: async () => {
                const response = await queue.receive();
                assertEquals(response.messages.length, 3);
                const done = await response.done();
                assertEquals(done.successful, 3);
                assertEquals(done.failed, 0);
            }
        });

        mockSQS.reset();
    }
});
