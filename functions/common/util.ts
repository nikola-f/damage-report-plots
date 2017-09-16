
/**
 * 階層オブジェクトの存在チェック
 * @param  {Function} fn [description]
 * @return {boolean}     [description]
 */
export function isSet(fn): boolean {
  let value;
  try {
    value = fn();
  }catch(err){
    value = undefined;
  }finally{
    return value !== undefined;
  }
};
