
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
