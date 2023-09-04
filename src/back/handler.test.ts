import { Queue } from "./handler.ts";

import { assertEquals } from "https://deno.land/std@0.186.0/testing/asserts.ts";
import { mockClient } from "npm:aws-sdk-client-mock";
import { SQSClient, GetQueueAttributesCommand } from "npm:@aws-sdk/client-sqs";

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

    }
})