import { assertEquals, mockClient, SQSClient, GetQueueAttributesCommand,
    SendMessageBatchCommand } from "./deps.ts";
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
    fn: async () => {
        const mockSQS = mockClient(SQSClient);
        mockSQS.on(SendMessageBatchCommand).resolves({Successful: [
            {Id: "1", MessageId: "1", MD5OfMessageBody: "dummy-md5"}
        ]});

        const url = '';
        const queue = new Queue(url);
        const response = await queue.send([
            new Report(1662685525000, 35.695427, -139.770442, false, "old name"),
            new Report(1662685526000, 35.695427, -139.770442, true,  "old name/owned"),
            new Report(1662685525000, -35.695427, 139.770442, false, "another portal"),
        ], {
            accessToken: "dummy-token",
            userId: "dummy-user-id@example.com"
        });

        assertEquals(response.successful, 1);
        assertEquals(response.failed, 0);
        assertEquals(response.batch, 1);

        mockSQS.reset();
    }
});

