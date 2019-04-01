import { NodeAPI } from 'java';

/**
 * this Wrapper
 * @private
 */
export class _JVM {
  /**
   * Reflection된 Java Class 보관소
   * @type {Object.<string, Object>}
   * @private
   */
  _classes: { [key: string]: any } = {};

  /**
   * 시스템에서 사용하는 this Instance
   */
  instance: any;

  constructor(
    /**
     * Node-java에서 사용하는 this interface
     */
    private java: NodeAPI | null = null,

    /**
     * 불러온 패키지 목록.
     */
    public packages: { [key: string]: any } = {},
  ) {
    if (java !== undefined && java !== null && packages !== undefined && packages !== null && typeof packages === 'object') {
      this.init(java, packages);
    }
  }

  public init(java: NodeAPI | null, packages: { [key: string]: any }) {
    if (typeof java === undefined || java === null || this.java) {
      throw TypeError('java는 null일 수 없고, this.init()은 한 번만 실행되어야 합니다.');
    }

    this.java = java;
    this.packages = packages;
  }

  /**
   * Java class 반환
   * @param {!string} path Class package path
   * @returns {Object} Java class
   */
  public classOf(...path: string[]) {
    let clsName = path.join('.');

    if (!this._classes.hasOwnProperty(clsName))
      this._classes[clsName] = this.java!.import(clsName);

    return this._classes[clsName];
  }

  /**
   * Koala Class 반환
   * @param {!string} path Class package path
   * @returns {Object} Java class
   */
  public koalaClassOf(...path: string[]) {
    return this.classOf('kr.bydelta.koala', ...path);
  }

  /**
   * Koala Enum 반환
   * @param {!string} tagset 표지자 집합 클래스 이름
   * @param {?string} tag 표지자 이름
   * @returns {?Object} 표지자 이름에 맞는 Java Enum
   */
  public koalaEnumOf(tagset: string, tag: string) {
    if (tag !== null && typeof tag !== 'undefined')
      return this.koalaClassOf(tagset).valueOf(tag);
    else return null;
  }

  /**
   * Java Iterable -> JSON Array
   * @param {Object} array
   * @param itemConverter
   * @returns {Array}
   */
  public toJsArray(array: any[], itemConverter = (x: any) => x) {
    if (typeof array === "undefined" || array === null)
      return [];
    if (Array.isArray(array))
      return array.map(itemConverter);

    let result: any[] = [];
    let it = (array as any).iterator();
    while (it.hasNext()) {
      result.push(itemConverter(it.next()));
    }

    return result;
  }

  /**
   * JSON Array -> Java List
   * @param {Object[]} array
   */
  public listOf(array: any[]) {
    let list = new (this.classOf('java.util.ArrayList'))();

    for (const item of array)
      list.add(item);

    return list;
  }

  /**
   * Make Java Pair
   * @param {Object} a First entry
   * @param {Object} b Second entry
   */
  public pair(a: any, b: any) {
    return new (this.classOf('kotlin.Pair'))(a, b);
  }

  /**
   * Make Java Char
   * @param {?string} ch Character
   * @returns {Object} Java Character
   */
  public char(ch?: string) {
    if (typeof ch !== 'string') {
      return null;
    }

    return this.java!.newChar(ch.charCodeAt(0));
  }

  /**
   * Make Java Set
   * @param {Object[]} array Items
   * @returns {Object} Java Set
   */
  public setOf(array: any[]) {
    let list = new (this.classOf('java.util.HashSet'))();

    for (const item of array)
      list.add(item);

    return list;
  }

  public posFilter(posSet: any) {
    return this.java!.newProxy('kotlin.jvm.functions.Function1', {
      'invoke': function (tag: any) {
        return posSet.includes(tag.name());
      }
    });
  }

  /**
   * Check whether these packages are compatible.
   * @param {Object.<string, string>} packages
   */
  public canLoadPackages(packages: { [key: string]: string }) {
    let result: { [key: string]: any } = {};

    if (this.java && this.java.isJvmCreated()) {
      for (let [pack, ver] of Object.entries(packages)) {
        result[pack] = this.packages.hasOwnProperty(pack) &&
          (ver.toUpperCase() === 'LATEST' || this.packages[pack] >= ver)
      }
    } else {
      for (let pack of Object.keys(packages)) {
        result[pack] = true;
      }
    }
    return result;
  }
}

export const JVM = new _JVM();
