import { assertEquals } from "https://deno.land/std@0.186.0/testing/asserts.ts";
import { Report, Mail, Range } from "./model.ts";


import testData from "./model.test.json" assert { type: "json" };


Deno.test({
    name: "Report#toSpreradsheetsRow()",
    fn: async () => {
        const name = "AAA Portal テスト 测试 Name";
        const report = new Report(1662685525000, 35.695427, -139.770442, true, name);

        assertEquals(
            ["VBjzn0Szymyg", 35.695427, -139.770442, 1, `${1662685525000/1000},${name}`],
            (await report.toSpreradsheetsRow()).slice(0, 5)
        )
        // console.log(await report.toSpreradsheetsRow());
    }
});


Deno.test({
    name: "Report.dedupe()",
    fn: async () => {
        const deduped = Report.dedupe([
            new Report(1662685525000, 35.695427, -139.770442, false, "old name"),
            new Report(1662685526000, 35.695427, -139.770442, true,  "old name/owned"),
            new Report(1662685525000, -35.695427, 139.770442, false, "another portal"),
            new Report(1662685527000, 35.695427, -139.770442, false, "new name"),
            new Report(1762685525000, 35.695427, -139.770442, false, "another day"),
        ]);

        assertEquals(deduped.length, 3);
        assertEquals((await deduped[0].toSpreradsheetsRow())[3], 1);
        assertEquals((await deduped[0].toSpreradsheetsRow())[4], "1662685525,new name");
        assertEquals((await deduped[1].toSpreradsheetsRow())[0], "7VkkEgiAD9J7m");
        assertEquals((await deduped[2].toSpreradsheetsRow())[0], "VBjzn0Szymyg");

        // console.log(await deduped[1].toSpreradsheetsRow());
    }
});

  

Deno.test({
    name: "Mail#toReportArray()",
    fn: async () => {
        const mailLinkDestroyed = new Mail(1662685525001, testData.payloadBase64);
        assertEquals(mailLinkDestroyed.toReportArray().length, 10);

    }
});


Deno.test({
    name: "Range.createArray()",
    fn: async () => {
        const ranges = Range.createArray(new Date(Date.now()-1000)); // a little ago
        assertEquals(ranges.length, 1);


        console.log(ranges[0].toQueryString());

    }
});

/*

*/