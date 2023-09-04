export {
    assertEquals 
} from "https://deno.land/std@0.201.0/assert/mod.ts";

export { mockClient } from "npm:aws-sdk-client-mock";

export {
    SQSClient,
    GetQueueAttributesCommand
} from "npm:@aws-sdk/client-sqs";

export { decode } from "https://deno.land/std@0.201.0/encoding/base64url.ts";
export { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";
import Hashids from "npm:hashids@^2.2.10";
export { Hashids };

import CheerioAPI from "npm:cheerio@^1.0.0-rc.12";
const cheerioAPI = CheerioAPI.load;
export { cheerioAPI };