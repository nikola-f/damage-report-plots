import { Queue } from "./handler.ts";

import { assertEquals, mockClient, SQSClient, GetQueueAttributesCommand } from "./deps.ts";

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
    name: "MockQueue#queue()",
    fn: async () => {
        // const mockSQS = mockClient(SQSClient);
        // mockSQS.on(GetQueueAttributesCommand).resolves({Attributes: {
        //     ApproximateNumberOfMessages: "123"
        // }});

        const url = '';
        const queue = new Queue(url);
        const queued = await queue.queue([], null);

        // mockSQS.reset();
    }
});

