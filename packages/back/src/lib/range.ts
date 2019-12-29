import {Job, JobStatus, Range} from '@common/types';


const INGRESS_EPOCH: number = Date.UTC(2012, 10, 15, 0, 0, 0, 0);




export const getRawRanges = (lastReportTime?: number): Range[] => {

  let fromTime: number = lastReportTime ? lastReportTime : INGRESS_EPOCH;
  const ranges: Range[] = [];
  const now: number = Date.now();
  const oneRange = 1000*3600*24*30; // 30 days
  
  do {
    ranges.push({
      "fromTime": fromTime,
      "toTime": fromTime + oneRange,
      "done": false
    });
    fromTime += oneRange;
  }while(fromTime < now && ranges.length < 100);
  
  return ranges;
};



export const nextRange = (ranges: Range[]): Range => {
  
  for(let i=0; i<ranges.length; i++) {
    if(ranges[i].done) {
      continue;
    }else{
      ranges[i].done = true;
      return ranges[i+1];
    }
  }
  return null; // unreachable
};


export const hasMoreRange = (ranges: Range[]): boolean => {
  for(let aRange of ranges) {
    if(!aRange.done) {
      return true;
    }
  }
  return false;
}