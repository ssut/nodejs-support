/**
 * Data 구조를 모아놓은 module입니다.
 *
 * @module koalanlp/data
 * @example
 * import { Morpheme, Word, Sentence, SyntaxTree, DepEdge, RoleEdge, Entity, CoreferenceGroup } from 'koalanlp/data';
 */

import * as _ from 'lodash';
import { CoarseEntityType, DependencyTag, PhraseTag, POS, RoleType } from "./types";
import { JVM } from "./jvm";
import { assert, getOrUndefined, isDefined, typeCheck } from './common';

/** @private */
function writeonlyonce(target: any, defValue: any, ...properties: any[]) {
  for (const property of properties) {
    let value: any = undefined;
    let descriptor: any = {};
    descriptor.get = () => {
      return (!isDefined(value)) ? defValue : value
    };
    descriptor.set = (newValue: any) => {
      if (value === newValue)
        return;

      if (isDefined(value))
        throw TypeError(`${property} 변수는 1회 초기화된 이후에는 변경할 수 없습니다. (현재 값 ${value.toString()}, 새 값 ${newValue.toString()})`);

      value = newValue;
    };
    Object.defineProperty(target, property, descriptor);
  }
}


/** @private */
function replaceableifempty(target: any, ...properties: any[]) {
  for (const property of properties) {
    let value = Object.freeze([]);
    let descriptor: any = {};
    descriptor.get = () => value;
    descriptor.set = (newValue: any) => {
      if (value === newValue)
        return;

      if (value.length > 0)
        throw TypeError(`${property} 변수는 1회 초기화된 이후에는 변경할 수 없습니다. (현재 값 ${value}, 새 값 ${newValue})`);

      value = Object.freeze(newValue);
    };
    Object.defineProperty(target, property, descriptor);
  }
}

/**
 * JavaWrapper class
 * @private
 */
class JavaWrappable {
  /**
   * @private
   */
  private _reference: any;

  _initReference() {
    throw Error("구현이 필요합니다!");
  }

  equals(other: any) {
    throw Error("구현이 필요합니다!");
  }

  get reference() {
    if (!isDefined(this._reference))
      this._reference = this._initReference();

    return this._reference;
  }

  set reference(value) {
    if (isDefined(this._reference))
      throw TypeError("reference는 설정된 다음 변경할 수 없습니다.");

    this._reference = value;
  }
}

/* istanbul ignore next */
/**
 * Immutable Array.
 * @private
 * @template {T}
 */
class ImmutableArray<T> extends JavaWrappable {
  /**
   * Items.
   * @private
   * @type {Array.<T>}
   */
  private readonly _items: ReadonlyArray<T> = [];

  /**
   * Immutable Array 생성.
   * @param {Array.<T>} items
   * @param {*} type
   * @return {ImmutableArray.<T>}
   * @template {T}
   */
  constructor(items: T[], ...type: any[]) {
    super();
    typeCheck(items, ...type);

    Object.defineProperty(this, '_items', {
      value: Object.freeze(items),
      writable: false,
      configurable: false
    });

    return new Proxy(this, {
      get(target: any, name: any) {
        if (isDefined(target[name]))
          return target[name];
        else if (typeof name !== 'symbol' && !isNaN(name)) {
          name = parseInt(name);
          if (name >= 0) return target._items[name];
          else return target._items[target.length + name];
        } else
          return undefined;
      },
      set(target, name, value) {
        if (typeof name !== 'symbol' && !isNaN(name as any))
          return false;
        else
          // @ts-ignore
          return Reflect.set(...arguments);
      }
    });
  }

  /**
   * The length of array
   * @returns {Number}
   */
  get length(): number {
    return this._items.length;
  }

  /**
   * @returns {Iterator.<T>} Iterator를 반환합니다
   */
  [Symbol.iterator]() {
    return this._items[Symbol.iterator]();
  }

  /**
   * 두 대상이 Java KoalaNLP 조건에서 같은지 확인합니다.
   * (Javascript는 == 또는 === 연산자를 override할 수 없어 별도로 제공합니다.)
   *
   * @param {T} other 확인할 다른 대상.
   * @return {boolean} 같다면 true.
   */
  equals(other: any): boolean {
    if (typeof (other) === typeof (this) && other.length === this.length) {
      for (const [a, b] of _.zip(this._items, other)) {
        if (!(a as any).equals(b)) return false;
      }
      return true;
    } else return false;
  }

  /**
   * @see Array#indexOf
   * @param value 찾을 값
   * @returns {number}
   */
  indexOf(value: any): number {
    return this._items.indexOf(value);
  }

  /**
   * [equals] 함수를 사용하여 주어진 값과 값이 동일한 첫 index를 찾습니다.
   *
   * ** (참고) ** Javascript의 indexOf 함수는 strict equality를 사용하여 값이 같은 경우가 아닌 reference가 같은 경우를 조회합니다.
   *
   * @param {T} value 찾을 값.
   * @returns {number} 찾은 첫번째 값의 index. 없으면 -1
   */
  indexOfValue(value: T): number {
    return this.findIndex((x: any) => x.equals(value));
  }

  /**
   * @see Array#lastIndexOf
   * @param value 찾을 값
   * @returns {number}
   */
  lastIndexOf(value: any): number {
    return this._items.indexOf(value);
  }

  /**
   * [equals] 함수를 사용하여 주어진 값과 값이 동일한 마지막 index를 찾습니다.
   *
   * ** (참고) ** Javascript의 indexOf 함수는 strict equality를 사용하여 값이 같은 경우가 아닌 reference가 같은 경우를 조회합니다.
   *
   * @param {T} value 찾을 값.
   * @returns {number} 찾은 마지막 값의 index. 없으면 -1
   */
  lastIndexOfValue(value: T): number {
    return this.findLastIndex((x: any) => x.equals(value));
  }

  /**
   * @see Array#includes
   * @param value 찾을 값
   * @returns {boolean}
   */
  includes(value: any): boolean {
    return this._items.includes(value);
  }

  /**
   * [equals] 함수를 사용하여 주어진 값과 동일한 값이 있는지 확인합니다.
   *
   * ** (참고) ** Javascript의 includes 함수는 Same Value Zero를 사용하여 값이 같은 두 object라도 reference가 다르면 다르다고 판단합니다.
   *
   * @param {T} value 찾을 값.
   * @returns {boolean} 값이 있으면 true
   */
  includesValue(value: T): boolean {
    return this.indexOfValue(value) !== -1;
  }

  /**
   * @see Array#entries
   * @returns {Iterator.<T>}
   */
  entries() {
    return this._items.entries();
  }

  /**
   * @see Array#every
   * @param callback
   * @param thisArg
   * @returns {boolean}
   */
  every(callback: any, thisArg: any): boolean {
    return this._items.every(callback, thisArg);
  }

  /**
   * @see Array#filter
   * @param callback
   * @param thisArg
   * @returns {Array.<T>}
   */
  filter(callback: any, thisArg: any): T[] {
    return this._items.filter(callback, thisArg);
  }

  /**
   * @see Array#find
   * @param predicate
   * @param thisArg
   * @returns {T}
   */
  find(predicate: any, thisArg: any): T | undefined {
    return this._items.find(predicate, thisArg);
  }

  /**
   * @see Array#findIndex
   * @param predicate
   * @param thisArg
   * @returns {number}
   */
  findIndex(predicate: any, thisArg?: any): number {
    return this._items.findIndex(predicate, thisArg);
  }

  /**
   * 주어진 조건을 만족하는 마지막 값의 index를 찾습니다.
   * @param predicate
   * @returns {number}
   */
  findLastIndex(predicate: any): number {
    return _.findLastIndex(this._items, predicate);
  }

  /**
   * @see Array#forEach
   * @param callback
   * @param thisArg
   */
  forEach(callback: any, thisArg: any): void {
    return this._items.forEach(callback, thisArg);
  }

  /**
   * @see Array#map
   * @param callback
   * @param thisArg
   * @returns {Array}
   */
  map(callback: any, thisArg?: any): any[] {
    return this._items.map(callback, thisArg);
  }

  /**
   * @see Array#reduce
   * @param callback
   * @param initialValue
   * @returns {*}
   */
  reduce(callback: any, initialValue: any): any {
    return this._items.reduce(callback, initialValue);
  }

  /**
   * @see Array#reduceRight
   * @param callback
   * @param initialValue
   * @returns {*}
   */
  reduceRight(callback: any, initialValue: any): any {
    return this._items.reduceRight(callback, initialValue);
  }

  /**
   * @see Array#slice
   * @param start
   * @param end
   * @returns {Array.<T>}
   */
  slice(start: number, end: number): T[] {
    return this._items.slice(start, end);
  }

  /**
   * @see Array#some
   * @param callback
   * @param thisArg
   * @returns {boolean}
   */
  some(callback: any, thisArg: any): boolean {
    return this._items.some(callback, thisArg);
  }

  /**
   * @see Array#values
   * @returns {Iterator.<T>}
   */
  values(): Iterator<T> {
    return this._items.values();
  }

  /**
   * Javascript Array로 변환합니다. (변경불가능 상태)
   * @returns {Array.<T>}
   */
  toArray() {
    return this._items;
  }
}


/**
 * 개체명 분석 결과를 저장할 [Property] class
 *
 * ## 참고
 *
 * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
 *
 * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
 *
 * * '트럼프': 인물
 * * '미국' : 국가
 * * '대통령' : 직위
 * * '사우디' : 국가
 *
 * 아래를 참고해보세요.
 *
 * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
 * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소가 속하는 [Entity]를 가져오는 API
 * * {@link module:koalanlp/data.Word#entities|Word#entities} 어절에 연관된 모든 [Entity]를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
 * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
 *
 * @augments ImmutableArray.<Morpheme>
 */
export class Entity extends ImmutableArray<Morpheme> {

  public _surface: any;

  public _label: any;

  public _fineLabel: any;

  public _originalLabel: any;

  /**
   * 이 개체명과 공통된 대상을 지칭하는 공통 지시어 또는 대용어들의 묶음을 제공합니다.
   *
   * **[참고]**
   *
   * **공지시어 해소** 는 문장 내 또는 문장 간에 같은 대상을 지칭하는 어구를 찾아 묶는 분석과정입니다.
   *
   * 예) '삼성그룹의 계열사인 삼성물산은 같은 그룹의 계열사인 삼성생명과 함께'라는 문장에서
   *
   * * '삼성그룹'과 '같은 그룹'을 찾아 묶는 것을 말합니다.
   *
   * **영형대용어 분석** 은 문장에서 생략된 기능어를 찾아 문장 내 또는 문장 간에 언급되어 있는 어구와 묶는 분석과정입니다.
   *
   * 예) '나는 밥을 먹었고, 영희도 먹었다'라는 문장에서,
   *
   * * '먹었다'의 목적어인 '밥을'이 생략되어 있음을 찾는 것을 말합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.CorefResolver|CorefResolver} 공지시어 해소, 대용어 분석기 interface
   * * {@link module:koalanlp/data.Sentence#corefGroups|Sentence#corefGroups} 문장 내에 포함된 개체명 묶음 [CoreferenceGroup]들의 목록을 반환하는 API
   * * {@link module:koalanlp/data.CoreferenceGroup|CoreferenceGroup} 동일한 대상을 지칭하는 개체명을 묶는 API
   *
   * @type {CoreferenceGroup}
   */
  public corefGroup!: CoreferenceGroup;

  /**
   * 개체명 분석 결과를 저장합니다.
   * @param {!Object} value 개체명 분석 결과 객체
   * @param {!string} value.surface 개체명의 표면형 문자열.
   * @param {!string} value.label 개체명 대분류 값, [CoarseEntityType]에 기록된 개체명 중 하나의 name.
   * @param {!string} value.fineLabel 개체명 세분류 값으로, [label]으로 시작하는 문자열.
   * @param {!Morpheme[]} value.morphemes 개체명을 이루는 형태소의 목록
   * @param {string} [value.originalLabel=undefined] 원본 분석기가 제시한 개체명 분류의 값.
   */
  constructor(value: {
    surface: string;
    label: string;
    fineLabel: string;
    morphemes: Morpheme[];
    originalLabel?: string;
  }) {
    super(value.morphemes, 'Morpheme' as any);

    typeCheck([value.surface, value.fineLabel], 'string');
    typeCheck([value.label], 'string', 'CoarseEntityType');
    typeCheck([value.originalLabel], 'undefined', 'string');

    writeonlyonce(this, undefined, 'corefGroup');

    this._surface = value.surface;
    this._label = ((value as any).label instanceof CoarseEntityType) ? (value as any).label.tagname : value.label;
    this._fineLabel = value.fineLabel;
    this._originalLabel = value.originalLabel;

    for (const morph of this) {
      morph.entities.push(this);
    }
  }

  /**
   * 개체명의 표면형 문자열.
   * @type !string
   */
  get surface() {
    return this._surface;
  }

  /**
   * @return {!string} 개체명의 표면형 문자열.
   */
  getSurface(): string {
    return this.surface;
  }

  /**
   * 개체명 대분류 값, [CoarseEntityType]에 기록된 개체명 중 하나.
   * @type !CoarseEntityType
   */
  get label() {
    return CoarseEntityType.withName(this._label);
  }

  /**
   * @return {!CoarseEntityType} 개체명 대분류 값, [CoarseEntityType]에 기록된 개체명 중 하나.
   */
  getLabel(): CoarseEntityType {
    return this.label;
  }

  /**
   * 개체명 세분류 값으로, [label]으로 시작하는 문자열.
   * @type !string
   */
  get fineLabel() {
    return this._fineLabel;
  }

  /**
   * @return {!string} 개체명 세분류 값으로, [label]으로 시작하는 문자열.
   */
  getFineLabel(): string {
    return this.fineLabel;
  }

  /**
   * 원본 분석기가 제시한 개체명 분류의 값. 기본값은 null.
   * @type string
   */
  get originalLabel() {
    return this._originalLabel;
  }

  /**
   * 이 개체명과 공통된 대상을 지칭하는 공통 지시어 또는 대용어들의 묶음을 제공합니다.
   *
   * **[참고]**
   *
   * **공지시어 해소** 는 문장 내 또는 문장 간에 같은 대상을 지칭하는 어구를 찾아 묶는 분석과정입니다.
   *
   * 예) '삼성그룹의 계열사인 삼성물산은 같은 그룹의 계열사인 삼성생명과 함께'라는 문장에서
   *
   * * '삼성그룹'과 '같은 그룹'을 찾아 묶는 것을 말합니다.
   *
   * **영형대용어 분석** 은 문장에서 생략된 기능어를 찾아 문장 내 또는 문장 간에 언급되어 있는 어구와 묶는 분석과정입니다.
   *
   * 예) '나는 밥을 먹었고, 영희도 먹었다'라는 문장에서,
   *
   * * '먹었다'의 목적어인 '밥을'이 생략되어 있음을 찾는 것을 말합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.CorefResolver|CorefResolver} 공지시어 해소, 대용어 분석기 interface
   * * {@link module:koalanlp/data.Sentence#corefGroups|Sentence#corefGroups} 문장 내에 포함된 개체명 묶음 [CoreferenceGroup]들의 목록을 반환하는 API
   * * {@link module:koalanlp/data.CoreferenceGroup|CoreferenceGroup} 동일한 대상을 지칭하는 개체명을 묶는 API
   *
   * @return {CoreferenceGroup} 공통된 대상을 묶은 [CoreferenceGroup]. 없다면 null.
   */
  getCorefGroup(): CoreferenceGroup {
    return this.corefGroup;
  }

  /**
   * @return {string} 원본 분석기가 제시한 개체명 분류의 값. 기본값은 null.
   */
  getOriginalLabel(): string {
    return this.originalLabel;
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'Entity')(
      this.surface,
      JVM.koalaEnumOf('CoarseEntityType', this._label),
      this.fineLabel,
      JVM.listOf(this.map((m: { reference: any; }) => m.reference)),
      this.originalLabel
    );
  }

  /**
   * @inheritDoc
   */
  equals(other: Entity) {
    return this._label === other._label &&
      this.fineLabel === other.fineLabel &&
      super.equals(other);
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this._label}(${this.fineLabel}; '${this.surface}')`
  }
}

/**
 * 공지시어 해소 또는 대용어 분석 결과를 저장할 class입니다.
 *
 * ## 참고
 *
 * **공지시어 해소** 는 문장 내 또는 문장 간에 같은 대상을 지칭하는 어구를 찾아 묶는 분석과정입니다.
 *
 * 예) '삼성그룹의 계열사인 삼성물산은 같은 그룹의 계열사인 삼성생명과 함께'라는 문장에서
 *
 * * '삼성그룹'과 '같은 그룹'을 찾아 묶는 것을 말합니다.
 *
 * **영형대용어 분석** 은 문장에서 생략된 기능어를 찾아 문장 내 또는 문장 간에 언급되어 있는 어구와 묶는 분석과정입니다.
 *
 * 예) '나는 밥을 먹었고, 영희도 먹었다'라는 문장에서,
 *
 * * '먹었다'의 목적어인 '밥을'이 생략되어 있음을 찾는 것을 말합니다.
 *
 * 아래를 참고해보세요.
 * * {@link module:koalanlp/proc.CorefResolver|CorefResolver} 공지시어 해소, 대용어 분석기 interface
 * * {@link module:koalanlp/data.Sentence#corefGroups|Sentence#corefGroups} 문장 내에 포함된 개체명 묶음 [CoreferenceGroup]들의 목록을 반환하는 API
 * * {@link module:koalanlp/data.Entity#corefGroup|Entity#corefGroup} 각 개체명을 묶어 같은 지시 대상을 갖는 묶음인 [CoreferenceGroup]를 가져오는 API
 *
 * @augments ImmutableArray.<Entity>
 */
export class CoreferenceGroup extends ImmutableArray<Entity> {
  /**
   * 공지시어 해소 또는 대용어 분석 결과를 저장합니다.
   * @param {Entity[]} entities 묶음에 포함되는 개체명들의 목록
   */
  constructor(entities: Entity[]) {
    super(entities, 'Entity' as any);

    for (const entity of this) {
      entity.corefGroup = this;
    }
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'CoreferenceGroup')(
      JVM.listOf(this.map((e: { reference: any; }) => e.reference))
    );
  }
}

/**
 * 트리 구조를 저장할 [Property]입니다. {@link module:koalanlp/data.Word|Word}를 묶어서 표현하는 구조에 적용됩니다.
 *
 * @augments ImmutableArray.<Tree>
 */
export class Tree extends ImmutableArray<Tree> {

  _label: string;

  _terminal: any;

  /**
   * 부모 노드를 반환합니다.
   * * 부모 노드가 초기화되지 않은 경우 null을 반환합니다.
   * @type {Tree}
   */
  parent!: Tree;

  /**
   * 트리 형태의 구조를 저장합니다.
   * @param {!Object} value Tree 값 객체
   * @param {!string} value.label 트리에 붙어있는 표지자입니다. null일 수 없습니다.
   * @param {Word} value.terminal 트리의 노드에서 연결되는 [Word]
   * @param {Tree[]} value.children 트리/DAG의 자식 노드들
   */
  constructor(value: {
    label: string;
    terminal: Word;
    children: Tree[];
  }) {
    super(value.children, 'SyntaxTree' as any, 'Tree' as any);

    typeCheck([value.label], 'string');
    typeCheck([value.terminal], 'undefined', 'Word');
    writeonlyonce(this, undefined, 'parent');

    this._label = value.label;
    this._terminal = value.terminal;
  }

  get label() {
    throw Error("구현이 필요합니다!")
  }

  /**
   * @return {*} 트리에 붙어있는 표지자입니다. null일 수 없습니다.
   */
  getLabel(): any {
    return this.label;
  }

  /**
   * 트리의 노드에서 연결되는 [Word] 또는 null
   * @type Word
   */
  get terminal() {
    return this._terminal
  }

  /**
   * @return {Word} 트리의 노드에서 연결되는 [Word] 또는 null
   */
  getTerminal(): Word {
    return this.terminal;
  }

  /**
   * 이 노드가 최상위 노드인지 확인합니다.
   * @return {boolean} 최상위 노드인 경우 true
   */
  isRoot(): boolean {
    return !isDefined(this.parent);
  }

  /**
   * 이 노드가 (terminal node를 제외하고) 자식 노드를 갖는지 확인합니다.
   * * 구문분석 구조에서 terminal node는 [Word]가 됩니다.
   * @return {boolean} 자식노드가 있다면 True
   */
  hasNonTerminals(): boolean {
    return this.length > 0;
  }

  /**
   * 이 노드에서 출발하는 말단 노드를 모두 반환합니다.
   * * 구문분석 구조에서 말단 노드는 [Word]가 됩니다.
   * @returns {Array.<Word>}
   */
  getTerminals(): Array<Word> {
    let leaves = this.reduce((acc: { concat: (arg0: any) => void; }, child: { getTerminals: () => void; }) => acc.concat(child.getTerminals()), []);
    if (this.terminal !== undefined) {
      leaves.push(this.terminal);
    }

    return leaves.sort((x: { id: number; }, y: { id: number; }) => x.id - y.id);
  }

  /**
   * @param {!number} [depth=0] 들여쓰기할 수준입니다. 숫자만큼 들여쓰기됩니다.
   * @param {!string} [buffer=''] 텍스트 초기값입니다.
   * @return {!string} 트리구조의 표현을 문자열로 돌려줍니다.
   */
  getTreeString(depth: number = 0, buffer: string = ''): string {
    buffer += "| ".repeat(depth);
    buffer += this.toString();

    for (const child of this) {
      buffer += '\n';
      buffer = child.getTreeString(depth + 1, buffer);
    }

    return buffer;
  }

  /**
   * 부모 노드를 반환합니다.
   * * 부모 노드가 초기화되지 않은 경우 null을 반환합니다.
   * @return {Tree} 같은 타입의 부모 노드 또는 null
   */
  getParent(): Tree {
    return this.parent;
  }

  /**
   * 이 노드의 Non-terminal 자식 노드를 모읍니다.
   * * 이 함수는 읽기의 편의를 위한 syntactic sugar입니다. 즉 다음 구문은 동일합니다.
   * @example
   * ```javascript
   * for (const item in x.getNonTerminals()){...}
   * for (const item in x){...}
   * ```
   * @return {Tree[]} Non-terminal 자식노드들.
   */
  getNonTerminals() {
    return this.toArray();
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this._label}-Node(${this.terminal || ''})`
  }

  /**
   * @inheritDoc
   */
  equals(other: { _label: any; terminal: any; }) {
    if (isDefined(this.terminal))
      return this._label === other._label && this.terminal.equals(other.terminal) && super.equals(other);
    else
      return this._label === other._label && !isDefined(other.terminal) && super.equals(other);
  }
}

/**
 * 구문구조 분석의 결과를 저장할 [Property].
 *
 * ## 참고
 *
 * **구문구조 분석** 은 문장의 구성요소들(어절, 구, 절)이 이루는 문법적 구조를 분석하는 방법입니다.
 *
 * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는 2개의 절이 있습니다
 *
 * * 나는 밥을 먹었고
 * * 영희는 짐을 쌌다
 *
 * 각 절은 3개의 구를 포함합니다
 *
 * * 나는, 밥을, 영희는, 짐을: 체언구
 * * 먹었고, 쌌다: 용언구
 *
 * 아래를 참고해보세요.
 *
 * * {@link module:koalanlp/proc.Parser|Parser} 구문구조 분석을 수행하는 interface.
 * * {@link module:koalanlp/data.Word#phrase|Word#phrase} 어절이 직접 속하는 가장 작은 구구조 [SyntaxTree]를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#syntaxTree|Sentence#syntaxTree} 전체 문장을 분석한 [SyntaxTree]를 가져오는 API
 * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 구구조의 형태 분류를 갖는 Enum 값
 * @augments Tree
 */
export class SyntaxTree extends Tree {

  _originalLabel: any;

  /**
   * 구문구조 분석의 결과를 생성합니다.
   * @param {!Object} value SyntaxTree 값 객체
   * @param {string|PhraseTag} value.label 구구조 표지자입니다. [PhraseTag] Enum의 name 값.
   * @param {Word} [value.terminal=undefined] 현재 구구조에 직접 속하는 [Word]들. 중간 구문구조인 경우 leaf를 직접 포함하지 않으므로 undefined.
   * @param {Tree[]} [value.children=undefined] 현재 구구조에 속하는 하위 구구조 [SyntaxTree]
   * @param {string} [value.originalLabel=undefined] 원본 분석기의 표지자 String 값.
   */
  constructor(value: {
    label: string | PhraseTag;
    terminal?: Word;
    children?: Tree[];
    originalLabel?: string;
  }) {
    super(value as any);

    typeCheck([value.label], 'string', 'PhraseTag');
    typeCheck([value.originalLabel], 'undefined', 'string');

    value.children = value.children || [];
    value.label = (value.label instanceof PhraseTag) ? value.label.tagname : value.label;

    this._originalLabel = value.originalLabel;

    let term = this.terminal;
    if (term !== undefined) {
      term.phrase = this;
    }

    for (const child of this) {
      (child as any).parent = this;
    }
  }

  _initReference() {
    return JVM.koalaClassOf('data', 'SyntaxTree')(
      JVM.koalaEnumOf('PhraseTag', this._label),
      (this.terminal) ? this.terminal.reference : null,
      JVM.listOf(this.map((t: { reference: any; }) => t.reference)),
      this.originalLabel
    );
  }

  /**
   * 원본 분석기의 표지자 String 값. 기본값은 undefined.
   * @type string
   */
  get originalLabel() {
    return this._originalLabel;
  }

  /**
   * 원본 분석기의 표지자 String 값. 기본값은 undefined.
   * @return {string} 원본 분석기의 표지자 String 값.
   */
  getOriginalLabel(): string {
    return this.originalLabel;
  }

  /**
   * 구문구조 표지자
   * @type PhraseTag
   */
  get label(): any {
    return PhraseTag.withName(this._label);
  }
}


/**
 * DAG Edge를 저장합니다.
 */
export class DAGEdge extends JavaWrappable {

  _src: any;

  _dest: any;

  _label: string;

  /**
   * DAG Edge를 구성합니다.
   * @param {!Object} value DAG Edge 값 객체
   * @param {Word} value.src 시점
   * @param {!Word} value.dest 종점
   * @param {string} value.label 관계
   */
  constructor(value: {
    src: Word;
    dest: Word;
    label: string;
  }) {
    super();

    typeCheck([value.src], 'undefined', 'Word');
    typeCheck([value.dest], 'Word');
    typeCheck([value.label], 'undefined', 'string');

    this._src = value.src;
    this._dest = value.dest;
    this._label = value.label;
  }

  /**
   * Edge의 시작점. 의존구문분석인 경우 지배소, 의미역인 경우 동사.
   * @type Word
   */
  get src() {
    return this._src;
  }

  /**
   * @return {Word} Edge의 시작점. 의존구문분석인 경우 지배소, 의미역인 경우 동사.
   */
  getSrc(): Word {
    return this.src;
  }

  /**
   * Edge의 종점. 의존구문분석인 경우 피지배소, 의미역인 경우 논항.
   * @type Word
   */
  get dest() {
    return this._dest;
  }

  /**
   * @return {Word} Edge의 종점. 의존구문분석인 경우 피지배소, 의미역인 경우 논항.
   */
  getDest(): Word {
    return this.dest;
  }

  /**
   * Edge가 나타내는 관계.
   */
  get label() {
    throw Error("구현이 필요합니다!");
  }

  /**
   * Edge가 나타내는 관계.
   */
  getLabel() {
    return this.label;
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this._label || ''}('${this.src || 'ROOT'}' → '${this.dest}')`;
  }

  /**
   * 두 DAG Edge가 같은지 비교합니다.
   * @param other 비교할 대상
   * @return {boolean} 같은 정보를 담고 있다면 true
   */
  equals(other: any): boolean {
    return typeof (this) === typeof (other) && this._label === other._label &&
      this.src.equals(other.src) && this.dest.equals(other.dest)
  }
}


/**
 * 의존구문구조 분석의 결과.
 *
 * ## 참고
 *
 * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
 *
 * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
 *
 * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
 *
 * * '먹었고'가 '쌌다'와 대등하게 연결되고
 * * '나는'은 '먹었고'의 주어로 기능하며
 * * '밥을'은 '먹었고'의 목적어로 기능합니다.
 * * '영희는'은 '쌌다'의 주어로 기능하고,
 * * '짐을'은 '쌌다'의 목적어로 기능합니다.
 *
 * 아래를 참고해보세요.
 *
 * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
 * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록을 가져오는 API
 * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
 * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
 * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
 * @augments DAGEdge
 */
export class DepEdge extends DAGEdge {
  _originalLabel: any;
  _type: string;

  /**
   * 의존구문 구조를 생성합니다.
   * @param {!Object} value DepEdge 값을 나타내는 객체.
   * @param {Word} value.governor 의존구문구조의 지배소
   * @param {!Word} value.dependent 의존구문구조의 피지배소
   * @param {!string|PhraseTag} value.type 구문분석 표지자
   * @param {string|DependencyTag} [value.depType=undefined] 의존구문구조 표지자
   * @param {string} [value.originalLabel=undefined] 의존구문구조 표지자의 원본분석기 표기
   */
  constructor(value: {
    governor: Word;
    dependent: Word;
    type: string | PhraseTag;
    depType?: string | DependencyTag;
    originalLabel?: string;

    src?: any;
    dest?: any;
    label?: any;
  }) {
    super(value as any);

    typeCheck([value.type], 'string', 'PhraseTag');
    typeCheck([value.depType], 'undefined', 'string', 'DependencyTag');
    typeCheck([value.originalLabel], 'undefined', 'string');

    value.type = (value.type instanceof PhraseTag) ? value.type.tagname : value.type;
    value.depType = (value.depType instanceof DependencyTag) ? value.depType.tagname : value.depType;

    value.src = value.governor;
    value.dest = value.dependent;
    value.label = value.depType;

    this._type = value.type;
    this._originalLabel = value.originalLabel;

    if (isDefined(this.dest)) {
      this.dest.governorEdge = this;
    }

    if (isDefined(this.src)) {
      this.src.dependentEdges.push(this);
    }
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'DepEdge')(
      (isDefined(this.governor)) ? this.governor.reference : null,
      this.dependent.reference,
      JVM.koalaEnumOf('PhraseTag', this._type),
      JVM.koalaEnumOf('DependencyTag', this._label),
      this._originalLabel
    )
  }

  /**
   * 의존구조의 지배소 [Word]. 문장의 Root에 해당하는 경우 None.
   * @type Word
   */
  get governor() {
    return this.src;
  }

  /**
   * @return {Word} 의존구조의 지배소 [Word]. 문장의 Root에 해당하는 경우 None.
   */
  getGovernor(): Word {
    return this.governor;
  }

  /**
   * 의존구조의 피지배소 [Word]
   * @type Word
   */
  get dependent() {
    return this.dest;
  }

  /**
   * @return {Word} 의존구조의 피지배소 [Word]
   */
  getDependent(): Word {
    return this.dependent;
  }

  /**
   * @inheritDoc
   * @type {DependencyTag}
   */
  get label(): any {
    return DependencyTag.withName(this._label);
  }

  /**
   * 의존기능 표지자, [DependencyTag] Enum 값. 별도의 기능이 지정되지 않으면 undefined. (ETRI 표준안은 구구조+의존기능으로 의존구문구조를 표기함)
   * @type DependencyTag
   */
  get depType() {
    return this.label;
  }

  /**
   * @return {DependencyTag} 의존기능 표지자, [DependencyTag] Enum 값. 별도의 기능이 지정되지 않으면 undefined. (ETRI 표준안은 구구조+의존기능으로 의존구문구조를 표기함)
   */
  getDepType(): DependencyTag {
    return this.depType;
  }

  /**
   * 구구조 표지자, [PhraseTag] Enum 값 (ETRI 표준안은 구구조+의존기능으로 의존구문구조를 표기함)
   * @type PhraseTag
   */
  get type() {
    return PhraseTag.withName(this._type);
  }

  /**
   * @return {PhraseTag} 구구조 표지자, [PhraseTag] Enum 값 (ETRI 표준안은 구구조+의존기능으로 의존구문구조를 표기함)
   */
  getType(): PhraseTag {
    return this.type;
  }

  /**
   * 원본 분석기의 표지자 String 값. 기본값은 undefined.
   * @type string
   */
  get originalLabel() {
    return this._originalLabel;
  }

  /**
   * @return {string} 원본 분석기의 표지자 String 값. 기본값은 undefined.
   */
  getOriginalLabel(): string {
    return this.originalLabel;
  }

  /**
   * @inheritDoc
   */
  equals(other: any) {
    return this._type === other._type && super.equals(other);
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this._type}${super.toString()}`;
  }
}


/**
 * 의미역 구조 분석의 결과.
 *
 * ## 참고
 *
 * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
 *
 * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
 *
 * 동사 '먹었다'를 중심으로
 *
 * * '나는'은 동작의 주체를,
 * * '밥을'은 동작의 대상을,
 * * '어제'는 동작의 시점을
 * * '집에서'는 동작의 장소를 나타냅니다.
 *
 * 아래를 참고해보세요.
 *
 * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
 * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 논항들의 [RoleEdge] 목록을 가져오는 API
 * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
 * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
 * @augments DAGEdge
 */
export class RoleEdge extends DAGEdge {
  _originalLabel: any;
  _modifiers: any;

  /**
   * 의미역 구조를 생성합니다.
   * @param {!Object} value RoleEdge의 값을 나타내는 객체.
   * @param {!Word} value.predicate 의미역 구조의 술어
   * @param {!Word} value.argument 의미역 구조의 논항
   * @param {!string|RoleType} value.label 의미역 구조의 표지자
   * @param {Word[]} [value.modifiers=undefined] 논항의 수식어구들
   * @param {string} [value.originalLabel=undefined] 의미역 구조 표지자의 원본분석기 표기
   */
  constructor(value: {
    predicate: Word;
    argument: Word;
    label: string | RoleType;
    modifiers?: Word[];
    originalLabel?: string;

    [key: string]: any;
  }) {
    typeCheck([value.label], 'string', 'RoleType');
    typeCheck([value.originalLabel], 'undefined', 'string');

    value.modifiers = value.modifiers || [];
    typeCheck(value.modifiers, 'Word');

    assert(isDefined(value.predicate),
      '[value.predicate]은 undefined일 수 없습니다.');
    value.label = (value.label instanceof RoleType) ? value.label.tagname : value.label;

    value.src = value.predicate;
    value.dest = value.argument;
    super(value as any);

    this._modifiers = value.modifiers;
    this._originalLabel = value.originalLabel;

    if (isDefined(this.dest)) {
      this.dest.predicateRoles.push(this);
    }

    if (isDefined(this.src)) {
      this.src.argumentRoles.push(this);
    }
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'RoleEdge')(
      (isDefined(this.predicate)) ? this.predicate.reference : null,
      this.argument.reference,
      JVM.koalaEnumOf('RoleType', this._label),
      JVM.listOf(this.modifiers.map((x: { reference: any; }) => x.reference)),
      this._originalLabel
    )
  }

  /**
   * 의미역 구조에서 표현하는 동사 [Word]
   * @type !Word
   */
  get predicate() {
    return this.src;
  }

  /**
   * @return {!Word} 의미역 구조에서 표현하는 동사 [Word]
   */
  getPredicate(): Word {
    return this.predicate;
  }

  /**
   * 의미역 구조에서 서술된 논항 [Word]
   * @type !Word
   */
  get argument() {
    return this.dest;
  }

  /**
   * @return {!Word} 의미역 구조에서 서술된 논항 [Word]
   */
  getArgument(): Word {
    return this.argument;
  }

  /**
   * @inheritDoc
   * @type {RoleType}
   */
  get label(): any {
    return RoleType.withName(this._label);
  }

  /**
   * 논항의 수식어구들
   * @type ReadonlyArray<Word>
   */
  get modifiers() {
    return Object.freeze(this._modifiers);
  }

  /**
   * @return {ReadonlyArray<Word>} 논항의 수식어구들
   */
  getModifiers(): ReadonlyArray<Word> {
    return this.modifiers;
  }

  /**
   * 원본 분석기의 표지자 String 값. 기본값은 undefined.
   * @type string
   */
  get originalLabel() {
    return this._originalLabel;
  }

  /**
   * @return {string} 원본 분석기의 표지자 String 값. 기본값은 undefined.
   */
  getOriginalLabel(): string {
    return this.originalLabel;
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this._label}('${(isDefined(this.src)) ? this.src.surface : 'ROOT'}' → '${this.dest.surface}/${this.modifiers.map((w: { surface: any; }) => w.surface).join(' ')}')`;
  }
}

/**
 * 형태소를 저장하는 [Property] class입니다.
 *
 * ## 참고
 *
 * **형태소** 는 의미를 가지는 요소로서는 더 이상 분석할 수 없는 가장 작은 말의 단위로 정의됩니다.
 *
 * **형태소 분석** 은 문장을 형태소의 단위로 나누는 작업을 의미합니다.
 *
 * 예) '문장을 형태소로 나눠봅시다'의 경우,
 *
 * * 문장/일반명사, -을/조사,
 * * 형태소/일반명사, -로/조사,
 * * 나누-(다)/동사, -어-/어미, 보-(다)/동사, -ㅂ시다/어미
 *
 * 로 대략 나눌 수 있습니다.
 *
 * 아래를 참고해보세요.
 *
 * * {@link module:koalanlp/proc.Tagger|Tagger} 형태소 분석기의 최상위 Interface
 * * {@link module:koalanlp/types.POS|POS} 형태소의 분류를 담은 Enum class
 */
export class Morpheme extends JavaWrappable {
  _surface: string;
  _tag: string;
  public _originalTag: string | undefined;
  /**
   * 형태소의 어절 내 위치
   * @type {number}
   */
  public id!: number;
  /**
   * 형태소의 상위 어절.
   * @type {Word}
   */
  public word!: Word;
  /**
   * 형태소의 의미 어깨번호.
   * @type {number}
   */
  public wordSense!: number;
  /**
   * 개체명 분석을 했다면, 현재 형태소가 속한 개체명 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Word#entities|Word#entities} 어절에 연관된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
   *
   * @type {Entity[]}
   */
  entities: Entity[] = [];

  /**
   * 형태소를 생성합니다.
   * @param {!Object} value 형태소 값 객체
   * @param {!string} value.surface 형태소 표면형
   * @param {!string|POS} value.tag 형태소 품사 태그
   * @param {string} [value.originalTag=undefined] 형태소 품사 원본 표기
   * @param {Object} [value.reference=undefined] Java 형태소 객체
   */
  constructor(value: {
    surface: string;
    tag: string | POS;
    originalTag?: string;
    reference: any;
  }) {
    super();

    typeCheck([value.surface], 'string');
    typeCheck([value.tag], 'string', 'POS');
    typeCheck([value.originalTag], 'undefined', 'string');

    writeonlyonce(this, -1, 'id');
    writeonlyonce(this, undefined, 'word', 'wordsense');

    this._surface = value.surface;
    this._tag = (value.tag instanceof POS) ? value.tag.tagname : value.tag;
    this._originalTag = value.originalTag;
    this.reference = value.reference;

    if (isDefined(value.reference)) {
      this.wordSense = getOrUndefined(this.reference.getWordSense());
    }
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'Morpheme')(
      this.surface,
      JVM.koalaEnumOf('POS', this._tag),
      this.originalTag
    );
  }

  /**
   * 형태소 표면형 String
   * @type string
   */
  get surface() {
    return this._surface;
  }

  /**
   * @return {string} 형태소 표면형 String
   */
  getSurface(): string {
    return this.surface;
  }

  /**
   * 세종 품사표기
   * @type POS
   */
  get tag() {
    return POS.withName(this._tag);
  }

  /**
   * @return {POS} 세종 품사표기
   */
  getTag(): POS {
    return this.tag!;
  }

  /**
   * 원본 형태소 분석기의 품사 String (없으면 undefined)
   * @type string
   */
  get originalTag() {
    return this._originalTag;
  }

  /**
   * @return {string} 원본 형태소 분석기의 품사 String (없으면 undefined)
   */
  getOriginalTag(): string {
    return this.originalTag!;
  }

  /**
   * @return {number} 형태소의 어절 내 위치입니다.
   */
  getId(): number {
    return this.id;
  }

  /**
   * 다의어 분석 결과인, 이 형태소의 사전 속 의미/어깨번호 값을 돌려줍니다.
   *
   * 다의어 분석을 한 적이 없다면 undefined를 돌려줍니다.
   *
   * @return {number} 의미/어깨번호 값
   */
  getWordSense(): number {
    return this.wordSense;
  }

  /**
   * 개체명 분석을 했다면, 현재 형태소가 속한 개체명 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Word#entities|Word#entities} 어절에 연관된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값

   * @return {Entity[]} [Entity]의 목록입니다. 분석 결과가 없으면 빈 리스트
   */
  getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * @return {Word} 이 형태소를 포함하는 단어를 돌려줍니다.
   */
  getWord(): Word {
    return this.word;
  }

  /**
   * 체언(명사, 수사, 대명사) 형태소인지 확인합니다.
   * @return {boolean} 체언이라면 true
   */
  isNoun(): boolean {
    return this.tag.isNoun();
  }

  /**
   * 용언(동사, 형용사) 형태소인지 확인합니다.
   * @return {boolean} 용언이라면 true
   */
  isPredicate(): boolean {
    return this.tag.isPredicate();
  }

  /**
   * 수식언(관형사, 부사) 형태소인지 확인합니다.
   * @return {boolean} 수식언이라면 true
   */
  isModifier(): boolean {
    return this.tag.isModifier();
  }

  /**
   * 관계언(조사) 형태소인지 확인합니다.
   * @return {boolean} 관계언이라면 true
   */
  isJosa(): boolean {
    return this.tag.isPostPosition();
  }

  /**
   * 세종 품사 [tag]가 주어진 품사 표기 [partialTag] 묶음에 포함되는지 확인합니다.
   *
   * 예) "N"은 체언인지 확인하고, "NP"는 대명사인지 확인
   *
   * ## 단축명령
   *
   * * 체언(명사, 수사, 대명사) {@link module:koalanlp/data.Morpheme#isNoun|Morpheme#isNoun}
   * * 용언(동사, 형용사)는 {@link module:koalanlp/data.Morpheme#isPredicate|Morpheme#isPredicate}
   * * 수식언(관형사, 부사)는 {@link module:koalanlp/data.Morpheme#isModifier|Morpheme#isModifier}
   * * 관계언(조사)는 {@link module:koalanlp/data.Morpheme#isJosa|Morpheme#isJosa}
   *
   * **[참고]**
   *
   * * 분석불능범주(NA, NV, NF)는 체언(N) 범주에 포함되지 않습니다.
   * * 세종 품사표기는 [POS](https://koalanlp.github.io/koalanlp/api/koalanlp/kr.bydelta.koala/-p-o-s/index.html) 를 참고하세요.
   * * 품사 표기는 [비교표](https://docs.google.com/spreadsheets/d/1OGM4JDdLk6URuegFKXg1huuKWynhg_EQnZYgTmG4h0s/edit?usp=sharing) 에서 확인가능합니다.
   *
   * @param {!string} partialTag 포함 여부를 확인할 상위 형태소 분류 품사표기
   * @return {boolean} 포함되는 경우 True.
   */
  hasTag(partialTag: string): boolean {
    return this.tag.startsWith(partialTag);
  }

  /**
   * 세종 품사 [tag]가 주어진 품사 표기들 [tags] 묶음들 중 하나에 포함되는지 확인합니다.
   *
   * 예) hasTagOneOf("N", "MM")의 경우, 체언 또는 관형사인지 확인합니다.
   *
   * ## 단축명령
   *
   * * 체언(명사, 수사, 대명사) {@link module:koalanlp/data.Morpheme#isNoun|Morpheme#isNoun}
   * * 용언(동사, 형용사)는 {@link module:koalanlp/data.Morpheme#isPredicate|Morpheme#isPredicate}
   * * 수식언(관형사, 부사)는 {@link module:koalanlp/data.Morpheme#isModifier|Morpheme#isModifier}
   * * 관계언(조사)는 {@link module:koalanlp/data.Morpheme#isJosa|Morpheme#isJosa}
   *
   * **[참고]**
   *
   * * 분석불능범주(NA, NV, NF)는 체언(N) 범주에 포함되지 않습니다.
   * * 세종 품사표기는 [POS](https://koalanlp.github.io/koalanlp/api/koalanlp/kr.bydelta.koala/-p-o-s/index.html) 를 참고하세요.
   * * 품사 표기는 [비교표](https://docs.google.com/spreadsheets/d/1OGM4JDdLk6URuegFKXg1huuKWynhg_EQnZYgTmG4h0s/edit?usp=sharing) 에서 확인가능합니다.
   *
   * @param {string} tags 포함 여부를 확인할 상위 형태소 분류 품사표기들 (가변인자)
   * @return {boolean} 하나라도 포함되는 경우 True.
   */
  hasTagOneOf(...tags: string[]): boolean {
    return tags.some((t: string) => this.tag.startsWith(t));
  }

  /**
   * 원본 품사 [originalTag]가 주어진 품사 표기 [partialTag] 묶음에 포함되는지 확인합니다.
   *
   * 예) 지정된 원본 품사가 없으면 (즉, None이면) false를 반환합니다.
   *
   * ## 단축명령
   *
   * * 체언(명사, 수사, 대명사) {@link module:koalanlp/data.Morpheme#isNoun|Morpheme#isNoun}
   * * 용언(동사, 형용사)는 {@link module:koalanlp/data.Morpheme#isPredicate|Morpheme#isPredicate}
   * * 수식언(관형사, 부사)는 {@link module:koalanlp/data.Morpheme#isModifier|Morpheme#isModifier}
   * * 관계언(조사)는 {@link module:koalanlp/data.Morpheme#isJosa|Morpheme#isJosa}
   *
   * **[참고]**
   *
   * * 분석불능범주(NA, NV, NF)는 체언(N) 범주에 포함되지 않습니다.
   * * 세종 품사표기는 [POS](https://koalanlp.github.io/koalanlp/api/koalanlp/kr.bydelta.koala/-p-o-s/index.html) 를 참고하세요.
   * * 품사 표기는 [비교표](https://docs.google.com/spreadsheets/d/1OGM4JDdLk6URuegFKXg1huuKWynhg_EQnZYgTmG4h0s/edit?usp=sharing) 에서 확인가능합니다.
   *
   * @param {!string} partialTag 포함 여부를 확인할 상위 형태소 분류 품사표기
   * @return {boolean} 포함되는 경우 True.
   */
  hasOriginalTag(partialTag: string): boolean {
    if (isDefined(this.originalTag))
      return this.originalTag!.toUpperCase().startsWith(partialTag.toUpperCase());
    else
      return false;
  }

  /***
   * 타 형태소 객체 [other]와 형태소의 표면형이 같은지 비교합니다.
   * @param {Morpheme} other 표면형을 비교할 형태소
   * @return {boolean} 표면형이 같으면 True
   */
  equalsWithoutTag(other: Morpheme): boolean {
    return this.surface === other.surface;
  }

  /**
   * @inheritDoc
   */
  equals(other: any) {
    return other instanceof Morpheme && this.surface === other.surface && this._tag === other._tag;
  }

  /**
   * @inheritDoc
   */
  toString() {
    if (isDefined(this.originalTag)) {
      return `${this.surface}/${this._tag}(${this.originalTag})`
    } else {
      return `${this.surface}/${this._tag}`
    }
  }
}

/**
 * 어절을 저장합니다.
 *
 * @augments ImmutableArray.<Morpheme>
 */
export class Word extends ImmutableArray<Morpheme> {
  /**
   * 표면형
   * @private
   * @type {string}
   */
  private _surface: string;
  /**
   * 어절의 문장 내 위치입니다.
   * @type {number}
   */
  public id!: number;
  /**
   * 구문분석을 했다면, 현재 어절이 속한 직속 상위 구구조(Phrase)를 돌려줍니다.
   *
   * **[참고]**
   *
   * **구문구조 분석** 은 문장의 구성요소들(어절, 구, 절)이 이루는 문법적 구조를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는 2개의 절이 있습니다
   *
   * * 나는 밥을 먹었고
   * * 영희는 짐을 쌌다
   *
   * 각 절은 3개의 구를 포함합니다
   *
   * * 나는, 밥을, 영희는, 짐을: 체언구
   * * 먹었고, 쌌다: 용언구
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 구문구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Sentence#syntaxTree|Sentence#syntaxTree} 전체 문장을 분석한 [SyntaxTree]를 가져오는 API
   * * {@link module:koalanlp/data.SyntaxTree|SyntaxTree} 구문구조를 저장하는 형태
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 구구조의 형태 분류를 갖는 Enum 값
   * @type {SyntaxTree}
   */
  phrase!: SyntaxTree;
  /**
   * 의존구문분석을 했다면, 현재 어절이 지배소인 하위 의존구문 구조의 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   *
   * @type {DepEdge[]}
   */
  public dependentEdges: DepEdge[] = [];
  /**
   *
   * 의존구문분석을 했다면, 현재 어절이 의존소인 상위 의존구문 구조의 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   * @type {DepEdge}
   */
  public governorEdge!: DepEdge;
  /**
   * 의미역 분석을 했다면, 현재 어절이 술어로 기능하는 하위 의미역 구조의 목록을 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @type {RoleEdge[]}
   */
  public argumentRoles: RoleEdge[] = [];
  /**
   * 의미역 분석을 했다면, 현재 어절이 논항인 상위 의미역 구조를 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 논항들의 [RoleEdge] 목록을 가져오는 API
   * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @type {RoleEdge[]}
   */
  predicateRoles: RoleEdge[] = [];

  /**
   * 어절을 생성합니다.
   * @param {!Object} value 어절 값 객체
   * @param {!string} value.surface 어절의 표면형
   * @param {!Morpheme[]} value.morphemes 어절에 포함되는 형태소의 목록
   * @param {*} [value.reference=undefined] Java 어절 객체
   */
  constructor(value: {
    surface: string;
    morphemes: Morpheme[];
    reference?: any;
  }) {
    super(value.morphemes, 'Morpheme' as any);

    typeCheck([value.surface], 'string');
    writeonlyonce(this, -1, 'id');
    writeonlyonce(this, undefined, 'phrase', 'governorEdge');

    this._surface = value.surface;
    this.reference = value.reference;

    for (const [i, morph] of this.entries()) {
      morph.word = this;
      morph.id = i;
    }
  }


  _initReference() {
    return JVM.koalaClassOf('data', 'Word')(
      this.surface,
      JVM.listOf(this.map((m: { reference: any; }) => m.reference))
    )
  }

  /**
   * 어절의 표면형 String.
   * @type string
   */
  get surface() {
    return this._surface;
  }

  /**
   * @return {string} 어절의 표면형 String.
   */
  getSurface(): string {
    return this.surface;
  }

  /**
   * @return {number} 어절의 문장 내 위치입니다.
   */
  getId(): number {
    return this.id;
  }

  /**
   * 개체명 분석을 했다면, 현재 어절이 속한 개체명 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소를 포함하는 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
   *
   * @type {Entity[]}
   */
  get entities() {
    let result: any[] = [];
    for (const morpheme of this) {
      for (const entity of morpheme.entities) {
        if (!result.includes(entity)) {
          result.push(entity);
        }
      }
    }
    return result;
  };

  /**
   * 개체명 분석을 했다면, 현재 어절이 속한 개체명 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소를 포함하는 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
   *
   * @return {Entity[]} [Entity]의 목록입니다. 분석 결과가 없으면 빈 리스트.
   */
  getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * 구문분석을 했다면, 현재 어절이 속한 직속 상위 구구조(Phrase)를 돌려줍니다.
   *
   * **[참고]**
   *
   * **구문구조 분석** 은 문장의 구성요소들(어절, 구, 절)이 이루는 문법적 구조를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는 2개의 절이 있습니다
   *
   * * 나는 밥을 먹었고
   * * 영희는 짐을 쌌다
   *
   * 각 절은 3개의 구를 포함합니다
   *
   * * 나는, 밥을, 영희는, 짐을: 체언구
   * * 먹었고, 쌌다: 용언구
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 구문구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Sentence#syntaxTree|Sentence#syntaxTree} 전체 문장을 분석한 [SyntaxTree]를 가져오는 API
   * * {@link module:koalanlp/data.SyntaxTree|SyntaxTree} 구문구조를 저장하는 형태
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 구구조의 형태 분류를 갖는 Enum 값
   *
   * @return {SyntaxTree} 어절의 상위 구구조 [SyntaxTree]. 분석 결과가 없으면 undefined.
   */
  getPhrase(): SyntaxTree {
    return this.phrase;
  }

  /**
   * 의존구문분석을 했다면, 현재 어절이 지배소인 하위 의존구문 구조의 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   *
   * @return {DepEdge[]} 어절이 지배하는 의존구문구조 [DepEdge]의 목록. 분석 결과가 없으면 빈 리스트.
   */
  getDependentEdges(): DepEdge[] {
    return this.dependentEdges;
  }

  /**
   * 의존구문분석을 했다면, 현재 어절이 의존소인 상위 의존구문 구조의 값을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   *
   * @return {DepEdge} 어절이 지배당하는 의존구문구조 [DepEdge]. 분석 결과가 없으면 None
   */
  getGovernorEdge(): DepEdge {
    return this.governorEdge;
  }

  /**
   * 의미역 분석을 했다면, 현재 어절이 술어로 기능하는 하위 의미역 구조의 목록을 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
   * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @return {RoleEdge[]} 어절이 술어로 기능하는 하위 의미역 구조 [RoleEdge]의 목록. 분석 결과가 없으면 빈 리스트.
   */
  getArgumentRoles(): RoleEdge[] {
    return this.argumentRoles;
  }

  /**
   * 의미역 분석을 했다면, 현재 어절이 논항인 상위 의미역 구조를 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 논항들의 [RoleEdge] 목록을 가져오는 API
   * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @return {RoleEdge[]} 어절이 논항인 상위 의미역 구조 [RoleEdge]. 분석 결과가 없으면 None.
   */
  getPredicateRoles(): RoleEdge[] {
    return this.predicateRoles;
  }

  /**
   * 품사분석 결과를, 1행짜리 String으로 변환합니다.
   *
   * 예) '나/NP+는/JX'
   *
   * **[참고]**
   * * 세종 품사표기는 {@link module:koalanlp/types.POS|POS} 를 참고하세요.
   *
   * @return {string} 각 형태소별로 "표면형/품사" 형태로 기록하고 이를 +로 이어붙인 문자열.
   */
  singleLineString(): string {
    return this.map((m: { surface: any; _tag: any; }) => `${m.surface}/${m._tag}`).join('+')
  }

  /**
   * @inheritDoc
   */
  toString() {
    return `${this.surface} = ${this.singleLineString()}`;
  }

  /**
   * @inheritDoc
   */
  equals(other: { surface: string; }) {
    return super.equals(other) && this.surface === other.surface;
  }

  /***
   * 타 어절 객체 [other]와 표면형이 같은지 비교합니다.
   * @param {Word} other 표면형을 비교할 어절
   * @return {boolean} 표면형이 같으면 True
   */
  equalsWithoutTag(other: Word): boolean {
    return this.surface === other.surface;
  }
}

/**
 * 문장을 저장하는 Class 입니다.
 *
 * @augments ImmutableArray.<Word>
 */
export class Sentence extends ImmutableArray<Word> {
  /**
   * 구문분석을 했다면, 최상위 구구조(Phrase)를 돌려줍니다.
   *
   * **[참고]**
   *
   * **구문구조 분석** 은 문장의 구성요소들(어절, 구, 절)이 이루는 문법적 구조를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는 2개의 절이 있습니다
   *
   * * 나는 밥을 먹었고
   * * 영희는 짐을 쌌다
   *
   * 각 절은 3개의 구를 포함합니다
   *
   * * 나는, 밥을, 영희는, 짐을: 체언구
   * * 먹었고, 쌌다: 용언구
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 구문구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#phrase|Word#phrase} 어절의 직속 상위 [SyntaxTree]를 가져오는 API
   * * {@link module:koalanlp/data.SyntaxTree|SyntaxTree} 구문구조를 저장하는 형태
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 구구조의 형태 분류를 갖는 Enum 값
   * @type {SyntaxTree}
   */
  public syntaxTree!: SyntaxTree;
  /**
   * 의존구문분석을 했다면, 문장에 포함된 모든 의존구조의 목록을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
   * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록를 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   *
   * @type {DepEdge[]}
   */
  dependencies: DepEdge[];
  /**
   * 의미역 분석을 했다면, 문장에 포함된 의미역 구조의 목록을 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
   * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 [RoleEdge]의 논항들을 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @type {RoleEdge[]}
   */
  roles: RoleEdge[];
  /**
   * 개체명 분석을 했다면, 문장의 모든 개체명 목록을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소를 포함하는 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Word#entities|Word#entities} 해당 어절을 포함하는 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
   *
   * @type {Entity[]}
   */
  entities: Entity[];
  /**
   * 문장 내에 포함된 공통 지시어 또는 대용어들의 묶음을 제공합니다.
   *
   * **[참고]**
   *
   * **공지시어 해소** 는 문장 내 또는 문장 간에 같은 대상을 지칭하는 어구를 찾아 묶는 분석과정입니다.
   *
   * 예) '삼성그룹의 계열사인 삼성물산은 같은 그룹의 계열사인 삼성생명과 함께'라는 문장에서
   *
   * * '삼성그룹'과 '같은 그룹'을 찾아 묶는 것을 말합니다.
   *
   * **영형대용어 분석** 은 문장에서 생략된 기능어를 찾아 문장 내 또는 문장 간에 언급되어 있는 어구와 묶는 분석과정입니다.
   *
   * 예) '나는 밥을 먹었고, 영희도 먹었다'라는 문장에서,
   *
   * * '먹었다'의 목적어인 '밥을'이 생략되어 있음을 찾는 것을 말합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.CorefResolver|CorefResolver} 공지시어 해소, 대용어 분석기 interface
   * * {@link module:koalanlp/data.Entity#corefGroup|Entity#corefGroup} 해당 개체명이 포함된 개체명 묶음 [CoreferenceGroup]을 반환하는 API
   * * {@link module:koalanlp/data.CoreferenceGroup|CoreferenceGroup} 동일한 대상을 지칭하는 개체명을 묶는 API
   *
   * @type {CoreferenceGroup[]}
   */
  corefGroups: CoreferenceGroup[];

  /**
   * 문장을 만듭니다.
   * @param {!Object|Word[]} value 자바 문장 객체 또는 어절의 Array.
   */
  // @ts-ignore
  constructor(value: any) {
    if (!Array.isArray(value)) {
      let words = JVM.toJsArray(value,
        (w: any[]) => new Word({
          surface: (w as any).getSurface(),
          morphemes: JVM.toJsArray(w, (m) => new Morpheme({
            surface: m.getSurface(),
            tag: m.getTag().name(),
            originalTag: m.getOriginalTag(),
            reference: m
          })),
          reference: w
        })
      );
      super(words, 'Word');

      writeonlyonce(this, undefined, 'syntaxTree');
      replaceableifempty(this, 'dependencies', 'roles', 'entities', 'corefGroups');

      this.syntaxTree = this._reconSyntaxTree(value.getSyntaxTree())!;
      this.dependencies = JVM.toJsArray(value.getDependencies(), (x) => this._getDepEdge(x));
      this.roles = JVM.toJsArray(value.getRoles(), (x) => this._getRole(x));
      this.entities = JVM.toJsArray(value.getEntities(), (x) => this._getEntity(x));
      this.corefGroups = JVM.toJsArray(value.getCorefGroups(), (x) => this._getCorefGroup(x));
      this.reference = value;
    } else {
      super(value, 'Word');
      writeonlyonce(this, 'syntaxTree');
      replaceableifempty(this, 'dependencies', 'roles', 'entities', 'corefGroups');
    }

    for (const [i, word] of this.entries()) {
      word.id = i;
    }
  }

  _getWord(jword: { getId: () => string | number; }) {
    if (isDefined(jword)) {
      return (this as any)[jword.getId()];
    } else {
      return undefined;
    }
  }

  _getMorph(jmorph: { getWord: () => { getId: () => string | number; }; getId: () => string | number; }) {
    if (isDefined(jmorph)) {
      return (this as any)[jmorph.getWord().getId()][jmorph.getId()];
    } else {
      return undefined;
    }
  }

  _reconSyntaxTree(jtree: any) {
    if (!isDefined(jtree))
      return undefined;

    let term;
    let nonTerms;

    if (isDefined(jtree.getTerminal())) {
      term = this._getWord(jtree.getTerminal());
    }

    if (jtree.hasNonTerminals()) {
      nonTerms = JVM.toJsArray(jtree, (x) => this._reconSyntaxTree(x));
    }

    let tree = new SyntaxTree({
      label: jtree.getLabel().name(),
      terminal: term,
      children: nonTerms,
      originalLabel: getOrUndefined(jtree.getOriginalLabel())
    });
    tree.reference = jtree;

    return tree;
  }

  _getDepEdge(e: any) {
    let deptype = getOrUndefined(e.getDepType());
    deptype = (isDefined(deptype)) ? deptype.name() : deptype;

    let edge = new DepEdge({
      governor: this._getWord(e.getGovernor()),
      dependent: this._getWord(e.getDependent()),
      type: e.getType().name(),
      depType: deptype,
      originalLabel: getOrUndefined(e.getOriginalLabel())
    });
    edge.reference = e;

    return edge;
  }

  _getRole(e: any) {
    let edge = new RoleEdge({
      predicate: this._getWord(e.getPredicate()),
      argument: this._getWord(e.getArgument()),
      label: e.getLabel().name(),
      modifiers: JVM.toJsArray(e.getModifiers(), (x) => this._getWord(x)),
      originalLabel: getOrUndefined(e.getOriginalLabel())
    });
    edge.reference = e;

    return edge;
  }

  _getEntity(e: any) {
    let enty = new Entity({
      surface: e.getSurface(),
      label: e.getLabel().name(),
      fineLabel: e.getFineLabel(),
      morphemes: JVM.toJsArray(e, (x) => this._getMorph(x)),
      originalLabel: getOrUndefined(e.getOriginalLabel())
    });
    enty.reference = e;

    return enty;
  }

  _getCorefGroup(c: any[]) {
    let coref = new CoreferenceGroup(
      JVM.toJsArray(c, (e) => {
        let referenced = this._getEntity(e);
        return this.entities.find((enty) => enty.equals(referenced));
      })
    );

    coref.reference = c;
    return coref;
  }

  _initReference() {
    let jsent = JVM.koalaClassOf('data', 'Sentence')(JVM.listOf(this.map((w: { reference: any; }) => w.reference)));

    if (isDefined(this.syntaxTree)) {
      jsent.setSyntaxTree(this.syntaxTree.reference);
    }

    if (this.roles.length > 0) {
      jsent.setRoleEdges(JVM.listOf(this.roles.map((e) => e.reference)));
    }

    if (this.dependencies.length > 0) {
      jsent.setDepEdges(JVM.listOf(this.dependencies.map((e) => e.reference)));
    }

    if (this.entities.length > 0) {
      jsent.setEntities(JVM.listOf(this.entities.map((e) => e.reference)));
    }

    if (this.corefGroups.length > 0) {
      jsent.setCorefGroups(JVM.listOf(this.corefGroups.map((e) => e.reference)));
    }

    return jsent;
  }

  /**
   * 구문분석을 했다면, 최상위 구구조(Phrase)를 돌려줍니다.
   *
   * **[참고]**
   *
   * **구문구조 분석** 은 문장의 구성요소들(어절, 구, 절)이 이루는 문법적 구조를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는 2개의 절이 있습니다
   *
   * * 나는 밥을 먹었고
   * * 영희는 짐을 쌌다
   *
   * 각 절은 3개의 구를 포함합니다
   *
   * * 나는, 밥을, 영희는, 짐을: 체언구
   * * 먹었고, 쌌다: 용언구
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 구문구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#phrase|Word#phrase} 어절의 직속 상위 [SyntaxTree]를 가져오는 API
   * * {@link module:koalanlp/data.SyntaxTree|SyntaxTree} 구문구조를 저장하는 형태
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 구구조의 형태 분류를 갖는 Enum 값
   *
   * @return {SyntaxTree} 최상위 구구조 [SyntaxTree]. 분석 결과가 없으면 undefined.
   */
  getSyntaxTree(): SyntaxTree {
    return this.syntaxTree;
  }

  /**
   * 의존구문분석을 했다면, 문장에 포함된 모든 의존구조의 목록을 돌려줍니다.
   *
   * **[참고]**
   *
   * **의존구조 분석** 은 문장의 구성 어절들이 의존 또는 기능하는 관계를 분석하는 방법입니다.
   *
   * 예) '나는 밥을 먹었고, 영희는 짐을 쌌다'라는 문장에는
   *
   * 가장 마지막 단어인 '쌌다'가 핵심 어구가 되며,
   *
   * * '먹었고'가 '쌌다'와 대등하게 연결되고
   * * '나는'은 '먹었고'의 주어로 기능하며
   * * '밥을'은 '먹었고'의 목적어로 기능합니다.
   * * '영희는'은 '쌌다'의 주어로 기능하고,
   * * '짐을'은 '쌌다'의 목적어로 기능합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.Parser|Parser} 의존구조 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
   * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록를 가져오는 API
   * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
   * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
   * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
   * @return {DepEdge[]} 문장 내 모든 의존구문구조 [DepEdge]의 목록. 분석 결과가 없으면 빈 리스트.
   */
  getDependencies(): DepEdge[] {
    return this.dependencies;
  }

  /**
   * 의미역 분석을 했다면, 문장에 포함된 의미역 구조의 목록을 돌려줌.
   *
   * **[참고]**
   *
   * **의미역 결정** 은 문장의 구성 어절들의 역할/기능을 분석하는 방법입니다.
   *
   * 예) '나는 밥을 어제 집에서 먹었다'라는 문장에는
   *
   * 동사 '먹었다'를 중심으로
   *
   * * '나는'은 동작의 주체를,
   * * '밥을'은 동작의 대상을,
   * * '어제'는 동작의 시점을
   * * '집에서'는 동작의 장소를 나타냅니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.RoleLabeler|RoleLabeler} 의미역 분석을 수행하는 interface.
   * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
   * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 [RoleEdge]의 논항들을 가져오는 API
   * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
   * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
   *
   * @return {RoleEdge[]} 문장 속의 모든 의미역 구조 [RoleEdge]의 목록. 분석 결과가 없으면 빈 리스트.
   */
  getRoles(): RoleEdge[] {
    return this.roles;
  }

  /**
   * 개체명 분석을 했다면, 문장의 모든 개체명 목록을 돌려줍니다.
   *
   * **[참고]**
   *
   * **개체명 인식** 은 문장에서 인물, 장소, 기관, 대상 등을 인식하는 기술입니다.
   *
   * 예) '철저한 진상 조사를 촉구하는 국제사회의 목소리가 커지고 있는 가운데, 트럼프 미국 대통령은 되레 사우디를 감싸고 나섰습니다.'에서, 다음을 인식하는 기술입니다.
   *
   * * '트럼프': 인물
   * * '미국' : 국가
   * * '대통령' : 직위
   * * '사우디' : 국가
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.EntityRecognizer|EntityRecognizer} 개체명 인식기 interface
   * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소를 포함하는 모든 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Word#entities|Word#entities} 해당 어절을 포함하는 [Entity]를 가져오는 API
   * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
   * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
   *
   * @return {Entity[]} 문장에 포함된 모든 [Entity]의 목록입니다.
   */
  getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * 문장 내에 포함된 공통 지시어 또는 대용어들의 묶음을 제공합니다.
   *
   * **[참고]**
   *
   * **공지시어 해소** 는 문장 내 또는 문장 간에 같은 대상을 지칭하는 어구를 찾아 묶는 분석과정입니다.
   *
   * 예) '삼성그룹의 계열사인 삼성물산은 같은 그룹의 계열사인 삼성생명과 함께'라는 문장에서
   *
   * * '삼성그룹'과 '같은 그룹'을 찾아 묶는 것을 말합니다.
   *
   * **영형대용어 분석** 은 문장에서 생략된 기능어를 찾아 문장 내 또는 문장 간에 언급되어 있는 어구와 묶는 분석과정입니다.
   *
   * 예) '나는 밥을 먹었고, 영희도 먹었다'라는 문장에서,
   *
   * * '먹었다'의 목적어인 '밥을'이 생략되어 있음을 찾는 것을 말합니다.
   *
   * 아래를 참고해보세요.
   *
   * * {@link module:koalanlp/proc.CorefResolver|CorefResolver} 공지시어 해소, 대용어 분석기 interface
   * * {@link module:koalanlp/data.Entity#corefGroup|Entity#corefGroup} 해당 개체명이 포함된 개체명 묶음 [CoreferenceGroup]을 반환하는 API
   * * {@link module:koalanlp/data.CoreferenceGroup|CoreferenceGroup} 동일한 대상을 지칭하는 개체명을 묶는 API
   *
   * @return {CoreferenceGroup[]} 공통된 대상을 묶은 [CoreferenceGroup]의 목록. 없다면 빈 리스트.
   */
  getCorefGroups(): CoreferenceGroup[] {
    return this.corefGroups;
  }

  /**
   * 체언(명사, 수사, 대명사) 및 체언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 체언, 명사형 전성어미 [POS.ETN], 명사 파생 접미사 [POS.XSN]
   * - 제외: 관형형 전성어미 [POS.ETM], 동사/형용사/부사 파생 접미사 [POS.XSV], [POS.XSA], [POS.XSM]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @type {Word[]}
   */
  get nouns() {
    let result = [];
    for (const word of this) {
      const inclusion = word.findIndex((m: any) => m.isNoun() || m.hasTagOneOf('ETN', 'XSN'));
      const exclusion = word.findLastIndex((m: { hasTagOneOf: (arg0: string, arg1: string, arg2: string) => void; }) => m.hasTagOneOf('XSV', 'XSA', 'XSM'));

      if (inclusion !== -1 && inclusion > exclusion) {
        result.push(word);
      }
    }

    return result;
  }

  /**
   * 체언(명사, 수사, 대명사) 및 체언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 체언, 명사형 전성어미 [POS.ETN], 명사 파생 접미사 [POS.XSN]
   * - 제외: 관형형 전성어미 [POS.ETM], 동사/형용사/부사 파생 접미사 [POS.XSV], [POS.XSA], [POS.XSM]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @return {Word[]} 체언 또는 체언 성격의 어휘를 포함하는 어절의 목록
   */
  getNouns(): Word[] {
    return this.nouns;
  }

  /**
   * 용언(동사, 형용사) 및 용언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 용언, 동사 파생 접미사 [POS.XSV]
   * - 제외: 명사형/관형형 전성어미 [POS.ETN], [POS.ETM], 명사/형용사/부사 파생 접미사 [POS.XSN], [POS.XSA], [POS.XSM]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @type {Word[]}
   */
  get verbs() {
    let result = [];
    for (const word of this) {
      const inclusion = word.findIndex((m: any) => m.isPredicate() || m.tag.equals((POS as any).XSV));
      const exclusion = word.findLastIndex((m: { hasTagOneOf: (arg0: string, arg1: string, arg2: string, arg3: string, arg4: string) => void; }) => m.hasTagOneOf('ETN', 'ETM', 'XSN', 'XSA', 'XSM'));

      if (inclusion !== -1 && inclusion > exclusion) {
        result.push(word);
      }
    }

    return result;
  }

  /**
   * 용언(동사, 형용사) 및 용언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 용언, 동사 파생 접미사 [POS.XSV]
   * - 제외: 명사형/관형형 전성어미 [POS.ETN], [POS.ETM], 명사/형용사/부사 파생 접미사 [POS.XSN], [POS.XSA], [POS.XSM]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @return {Word[]} 용언 또는 용언 성격의 어휘를 포함하는 어절의 목록
   */
  getVerbs(): Word[] {
    return this.verbs;
  }

  /**
   * 수식언(관형사, 부사) 및 수식언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 수식언, 관형형 전성어미 [POS.ETM], 형용사/부사 파생 접미사 [POS.XSA], [POS.XSM]
   * - 제외: 명사형 전성어미 [POS.ETN], 명사/동사 파생 접미사 [POS.XSN], [POS.XSV]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @type {Word[]}
   */
  get modifiers() {
    let result = [];
    for (const word of this) {
      const inclusion = word.findIndex((m: any) => m.isPredicate() || m.hasTagOneOf("ETM", "XSA", "XSM"));
      const exclusion = word.findLastIndex((m: { hasTagOneOf: (arg0: string, arg1: string, arg2: string) => void; }) => m.hasTagOneOf("ETN", "XSN", "XSV"));

      if (inclusion !== -1 && inclusion > exclusion) {
        result.push(word);
      }
    }

    return result;
  }

  /**
   * 수식언(관형사, 부사) 및 수식언 성격의 어휘를 포함하는 어절들을 가져옵니다.
   *
   * - 포함: 수식언, 관형형 전성어미 [POS.ETM], 형용사/부사 파생 접미사 [POS.XSA], [POS.XSM]
   * - 제외: 명사형 전성어미 [POS.ETN], 명사/동사 파생 접미사 [POS.XSN], [POS.XSV]
   * - 가장 마지막에 적용되는 어미/접미사를 기준으로 판정함
   *
   * **[참고]**
   *
   * **전성어미** 는 용언 따위에 붙어 다른 품사의 기능을 수행하도록 변경하는 어미입니다.
   * 예) '멋지게 살다'를 '멋지게 삶'으로 바꾸는 명사형 전성어미 '-ㅁ'이 있습니다. 원 기능은 동사이므로 부사의 수식을 받고 있습니다.
   *
   * **파생접미사** 는 용언의 어근이나 단어 따위에 붙어서 명사로 파생되도록 하는 접미사입니다.
   * 예) 역시 '살다'를 '삶'으로 바꾸는 명사파생 접미사 '-ㅁ'이 있습니다. 이 경우 명사이므로 '멋진 삶'과 같이 형용사의 수식을 받습니다.
   *
   * @return {Word[]} 수식언 또는 수식언 성격의 어휘를 포함하는 어절의 목록
   */
  getModifiers(): Word[] {
    return this.modifiers;
  }

  /**
   * 어절의 표면형을 이어붙이되, 지정된 [delimiter]로 띄어쓰기 된 문장을 반환합니다.
   * @param {!string} [delimiter=' '] 어절 사이의 띄어쓰기 방식. 기본값 = 공백(" ")
   * @return {string} 띄어쓰기 된 문장입니다.
   */
  surfaceString(delimiter: string = ' '): string {
    return this.map((w: { surface: any; }) => w.surface).join(delimiter);
  }

  /**
   * 품사분석 결과를, 1행짜리 String으로 변환합니다.
   * @return {string} 품사분석 결과를 담은 1행짜리 String.
   */
  singleLineString(): string {
    return this.map((w: { singleLineString: () => void; }) => w.singleLineString()).join(' ')
  }

  /**
   * @inheritDoc
   */
  toString() {
    return this.surfaceString();
  }
}
