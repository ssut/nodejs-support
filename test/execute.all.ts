jest.setTimeout(1000000);
import { initialize } from '../src/Util';
import dictest from './dictionary';
import typetest from './type';
import exttest from './extension';
import proctest from './proc';
import datatest from './datacheck';

import { JVM } from '../src/jvm';

beforeAll(async () => {
  await initialize({ packages: { OKT: 'LATEST', HNN: 'LATEST', ETRI: 'LATEST', KKMA: 'LATEST' } });
});

describe('JVM', () => {
  it('can check loadable packages', () => {
    expect(JVM.canLoadPackages({ ARIRANG: 'LATEST' })).toEqual({ ARIRANG: false });
    expect(JVM.canLoadPackages({ OKT: 'LATEST' })).toEqual({ OKT: true });
    expect(JVM.canLoadPackages({ OKT: '3.0.0' })).toEqual({ OKT: false });
  });
  it('only initialize once', () => {
    expect(() => JVM.init(null, {})).toThrowError();
    expect(() => JVM.init(null, {})).toThrowError();
    expect(() => JVM.init(null, {})).toThrowError();
  });
});

dictest();
typetest();
exttest();
proctest();
datatest();
