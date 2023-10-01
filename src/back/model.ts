import { decode, datetime, Hashids, cheerioAPI } from "./deps.ts";

// class Job {

//     static OAUTH2_SCOPE: string;

//     accessToken: string;
//     expiresAt: number;
//     analysisStartDate: number;

// }

export interface Auth {
    accessToken: string,
    userId: string
}


export class Range {

    private static INGRESS_EPOCH: Date = new Date(Date.UTC(2012, 10, 15, 0, 0, 0, 0));

    private constructor(
        private from: Date,
        private to: Date
    ){}

    static createArray = (start?: Date): Array<Range> => {

        const ranges: Range[] = [];
        const pointer: Date = start ? start : Range.INGRESS_EPOCH;
        while(pointer.getTime() < Date.now()) {
            const from: number = pointer.getTime();
            pointer.setUTCMonth(pointer.getUTCMonth()+1, 1);  // 1st of next month
            const to: number = pointer.getTime();
            ranges.push(new Range(new Date(from), new Date(to)));
        }
        return ranges;
    }

    toQueryString = (): string => { // before=less than, after=greater than or equal to
        return ` after:${datetime(this.from).toUTC().format("YYYY/MM/dd")} before:${datetime(this.to).toUTC().format("YYYY/MM/dd")} `;
    }
}


export class Mail {

    private reports: Report[] = [];

    static parse = (internalDate: number, base64: string): Report[] => {
        return new Mail(internalDate, base64).toReportArray();
    }

    constructor(internalDate: number, base64: string) {
        const $ = cheerioAPI(new TextDecoder().decode(decode(base64)));

        const agent = $("div > table > tbody > tr:nth-child(2) > td > table > tbody > tr:first-child > td > span:nth-child(2)").text();

        let latitude: number, longitude: number, name: string;
        const reportBase = $("div > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:has(div):gt(0)");
        reportBase.each((i: number, td) => {

            if(i % 2 === 0) { // lat, lng, name
                const url = $(td).find("div > a").attr("href");
                latitude  = url ? Number(url.split("pll=")[1].split("&")[0].split(",")[0]) : 0;
                longitude = url ? Number(url.split("pll=")[1].split("&")[0].split(",")[1]) : 0;
                name = $(td).find("div:first").text();

            }else{ // owner
                this.reports.push(new Report(
                    internalDate,
                    latitude,
                    longitude,
                    agent === $(td).find("table > tbody > tr > td:last > div > span").text(),
                    name
                ));

            }
        });
    }

    toReportArray = (): Array<Report> => {
        return this.reports;
    }

}



export class Report {

    constructor(
        private internalDate: number,
        private latitude: number,
        private longitude: number,
        private owned: boolean,
        private name: string
    ){}


    static dedupe = (reports: Array<Report>): Array<Report> => {
        const dedupedMap = new Map<string, Report>;

        for(let aReport of reports) {
            const key = JSON.stringify([
                aReport.latitude,
                aReport.longitude,
                Math.floor(aReport.internalDate /(1000*3600*24)) // round down 24hrs
            ])

            const preceded = dedupedMap.get(key);
            if(preceded) {
                aReport = new Report(
                    aReport.internalDate < preceded.internalDate ? aReport.internalDate : preceded.internalDate, // select older
                    aReport.latitude,
                    aReport.longitude,
                    aReport.owned || preceded.owned,
                    aReport.internalDate > preceded.internalDate ? aReport.name : preceded.name // select newer
                );
            }
            dedupedMap.set(key, aReport);
        }

        return Array.from(dedupedMap.values());
    };


    private hash = (): string => {
        const hashids = new Hashids('', 0,
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!#$%&()*+-;<=>?@^_`{|}~'
        );
        // eliminate decimals and signs
        const latToHash = (this.latitude +90) *1000000;
        const lngToHash = (this.longitude +180) *1000000;
        return hashids.encode(latToHash, lngToHash);
    }


    toSpreradsheetsRow = (): Array<string | number> => {
        return [
            this.hash(),
            this.latitude,
            this.longitude,
            this.owned ? 1 : 0,
            `${Math.floor(this.internalDate /1000)},${this.name}`,
            Number(datetime(new Date()).toUTC().format("YYMMddHHmmss"))
        ];
    }

}