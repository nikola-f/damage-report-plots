const unique = require('make-unique');


/**
 * 階層オブジェクトの存在チェック
 * @param  {Function} fn [description]
 * @return {boolean}     [description]
 */
export const isSet = (fn): boolean => {
  let value;
  try {
    value = fn();
  }catch(err){
    value = undefined;
  }finally{
    return value !== undefined;
  }
};


/**
 * epoch time(ms)をISO形式日付文字列へ
 */
export const toString = (ms: number): string => {
  return (new Date(ms)).toISOString();
};


/**
 * 配列から重複削除
 */
export const dedupe = (list: Array<any>): Array<any> => {
  const result: Array<any> = unique(
    list,
    (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  );
  
  if(list.length > result.length) {
    console.log(`Array deduped ${list.length} to ${result.length}.`);
  }
  
  return result;
}