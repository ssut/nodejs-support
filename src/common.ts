import * as _ from 'lodash';

/** @private */
export function isDefined(value: any) {
  return typeof value !== 'undefined' && value !== null;
}

/** @private */
export function getOrUndefined(value: any) {
  return isDefined(value) ? value : undefined;
}

/** @private */
export function assert(condition: any, msg: string) {
  if (!condition)
    throw TypeError(msg);
}

/** @private */
export function typeCheck(values: any[], ...types: string[]) {
  const _types = new Set(types);

  new Set(
    values.map((value) => {
      let type: string = typeof value;
      if (type === 'object') {
        type = value.constructor.name;
      }

      return type;
    })
  ).forEach((t) => {
    assert(_types.has(t), `[${Array.from(_types).toString()}] 중 하나를 기대했지만 ${t} 타입이 들어왔습니다!`);
  });
}
