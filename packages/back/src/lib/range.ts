import {Job, JobStatus, Range} from '@common/types';


const INGRESS_EPOCH: number = Date.UTC(2012, 10, 15, 0, 0, 0, 0);




export const getRawRanges = (lastReportTime?: number, rangeToTime?: number): Range[] => {

  let fromTime: number = lastReportTime ? lastReportTime+1 : INGRESS_EPOCH;
  const toTime: number = rangeToTime ? rangeToTime : Date.now();
  const ranges: Range[] = [];
  // const now: number = Date.now();
  // const oneRange = 1000*3600*24*30; // 30 days
  
  do {
    const oneRange = toTime - fromTime > 1000*3600*24*30 ?
      1000*3600*24*30 : toTime - fromTime;
    ranges.push({
      "fromTime": fromTime,
      "toTime": fromTime + oneRange,
      "done": false
    });
    fromTime += oneRange;
  }while(fromTime < toTime && ranges.length < 100);
  // }while(fromTime < now && ranges.length < 100);
  
  return ranges;
};


// FIXME
export const done = (ranges: Range[], current: Range) => {
  for(let i=0; i<ranges.length; i++) {
    if(ranges[i].fromTime === current.fromTime &&
        ranges[i].toTime === current.toTime) {
      ranges[i].done = true;
      console.log('done:', ranges[i]);
      return;
    }
  }
}


export const nextRange = (ranges: Range[]): Range => {
  
  for(let i=0; i<ranges.length; i++) {
    if(ranges[i].done) {
      continue;
    }else{
      // ranges[i].done = true;
      console.log('nextRange:', ranges[i]);
      return ranges[i];
    }
  }
  return null; // unreachable
};


export const hasMoreRange = (ranges: Range[]): boolean => {
  for(let aRange of ranges) {
    if(!aRange.done) {
      console.log('hasMoreRange:', aRange);
      return true;
    }
  }
  return false;
}