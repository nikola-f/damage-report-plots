import { assertEquals } from "./deps.ts";
import { Report, Mail, Range } from "./model.ts";


import testData from "./model.test.json" assert { type: "json" };


Deno.test({
    name: "Report#toSpreradsheetsRow()",
    fn: () => {
        const name = "AAA Portal テスト 测试 Name";
        const report = new Report(1662685525000, 35.695427, -139.770442, true, name);

        assertEquals(
            report.toSpreradsheetsRow().slice(0, 5),
            ['N4r15#g4z5Z0', 35.695427, -139.770442, 1, `${1662685525000/1000},${name}`]
        )
    }
});


Deno.test({
    name: "Report.dedupe()",
    fn: () => {
        const deduped = Report.dedupe([
            new Report(1662685525000, 35.695427, -139.770442, false, "old name"),
            new Report(1662685526000, 35.695427, -139.770442, true,  "old name/owned"),
            new Report(1662685525000, -35.695427, 139.770442, false, "another portal"),
            new Report(1662685527000, 35.695427, -139.770442, false, "new name"),
            new Report(1762685525000, 35.695427, -139.770442, false, "another day"),
        ]);

        assertEquals(deduped.length, 3);
        assertEquals(deduped[0].toSpreradsheetsRow()[3], 1);
        assertEquals(deduped[0].toSpreradsheetsRow()[4], "1662685525,new name");
        assertEquals(deduped[1].toSpreradsheetsRow()[0], "}5}RN`IQD06Q");
        assertEquals(deduped[2].toSpreradsheetsRow()[0], "N4r15#g4z5Z0");

    }
});

  

Deno.test({
    name: "Mail#toReportArray()",
    fn: () => {
        const mail = new Mail(1662685525001, testData.payloadBase64);
        assertEquals(mail.toReportArray().length, 10);

    }
});


Deno.test({
    name: "Range.createArray()",
    fn: () => {
        const ranges = Range.createArray(new Date(Date.now()-1000)); // a little ago
        assertEquals(ranges.length, 1);

    }
});

