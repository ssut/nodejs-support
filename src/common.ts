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
export function typeCheck(values: any[], ...types: any[]) {
    const _types = new Set(types);

    new Set(values.map((x) => {
        let t = typeof x
        if (t === 'object')
            t = x.constructor.name;

        return t;
    })).forEach((t) => {
        assert(_types.has(t), `[${Array.from(_types).toString()}] 중 하나를 기대했지만 ${t} 타입이 들어왔습니다!`);
    });
}
