/**
 * 품사, 구문구조 표지자 등 각종 표지자
 * @module koalanlp/types
 * @example
 * import { POS, PhraseTag, DependencyTag, RoleType, CoarseEntityType } from 'koalanlp/types';
 **/

import {JVM} from './jvm';
import * as _ from 'lodash';

export interface Tag {
  tagname: string;
  ordinal: number;
  classType: string;
  reference: any;
}

/**
 * 자바 Enum 표현
 * @private
 */
class JavaEnum implements Tag {
    /**
     * Enum 명칭
     * @type {string}
     */
    public tagname = '';
    /**
     * Enum 순서 번호
     * @type {number}
     */
    public ordinal = -1;
    /**
     * Enum class 이름
     * @type {string}
     */
    public classType = '';

    constructor(public reference: any) {
        this.tagname = reference.name();
        this.ordinal = reference.ordinal();
        this.classType = reference.getClass().getName();
    }

    /**
     * 문자열로 변환
     * @returns {string} 이 값을 표현하는 문자열
     */
    public toString() {
        return this.tagname;
    }

    /**
     * 두 대상이 같은지 확인합니다.
     * @param other 다른 대상
     * @returns {boolean} 같다면 true.
     */
    equals(other: any): boolean {
        if(other instanceof JavaEnum && this.classType === other.classType)
            return other.reference.equals(this.reference);
        else return false;
    }

    /**
     * 전체 값의 목록을 불러옵니다.
     * @param clsName 불러올 클래스
     * @returns {Array} 전체 값 목록
     */
    static getAllOf(...clsName: string[]): any[] {
        return JVM.toJsArray(JVM.koalaClassOf(...clsName).values());
    }
}

/**
 * 세종 품사표기
 * @example
 * import { POS } from 'koalanlp/types';
 * POS.NNP;
 */
export class POS extends JavaEnum implements Tag {
  /**
   * POS 값 전체
   * @type {Object.<string, POS>}
   * @private
   */
  static _values: { [key: string]: POS } = {};
  static NNP: any;
  static NNG: any;

  /**
   * POS 값들을 모두 돌려줍니다.
   * @returns {POS[]} POS값들의 array
   */
  static values() {
    if (_.isEmpty(POS._values)) {
      JavaEnum.getAllOf('POS').forEach(it => {
        let value = new POS(it);
        POS._values[value.tagname] = value;

        Object.defineProperty(POS, value.tagname, {
          value: value,
          writable: false,
          configurable: false
        });
      });

      Object.defineProperty(POS, '_values', {
        value: Object.freeze(POS._values),
        writable: false,
        configurable: false
      });
    }

    return _.values(POS._values)
  }

  /**
   * 이름에 해당하는 값을 찾아줍니다.
   * @param {!string} name 해당 이름으로 된 값
   * @returns {POS}
   */
  static withName(name: string): POS {
    return POS._values[name];
  }

  /**
   * 이 값이 체언인지 확인합니다.
   * @returns {boolean} 체언인 경우 true
   */
  isNoun(): boolean {
    return this.reference.isNoun();
  }

  /**
   * 이 값이 용언인지 확인합니다.
   * @returns {boolean} 용언인 경우 true
   */
  isPredicate(): boolean {
    return this.reference.isPredicate();
  }

  /**
   * 이 값이 수식언인지 확인합니다.
   * @returns {boolean} 수식언인 경우 true
   */
  isModifier(): boolean {
    return this.reference.isModifier();
  }

  /**
   * 이 값이 관계언인지 확인합니다.
   * @returns {boolean} 관계언인 경우 true
   */
  isPostPosition(): boolean {
    return this.reference.isPostPosition();
  }

  /**
   * 이 값이 어미인지 확인합니다.
   * @returns {boolean} 어미인 경우 true
   */
  isEnding(): boolean {
    return this.reference.isEnding();
  }

  /**
   * 이 값이 접사인지 확인합니다.
   * @returns {boolean} 접사인 경우 true
   */
  isAffix(): boolean {
    return this.reference.isAffix();
  }

  /**
   * 이 값이 접미사인지 확인합니다.
   * @returns {boolean} 접미사인 경우 true
   */
  isSuffix(): boolean {
    return this.reference.isSuffix();
  }

  /**
   * 이 값이 기호인지 확인합니다.
   * @returns {boolean} 기호인 경우 true
   */
  isSymbol(): boolean {
    return this.reference.isSymbol();
  }

  /**
   * 이 값이 미확인 단어인지 확인합니다.
   * @returns {boolean} 미확인 단어인 경우 true
   */
  isUnknown(): boolean {
    return this.reference.isUnknown();
  }

  /**
   * 이 값이 주어진 [tag]로 시작하는지 확인합니다.
   * @param {!string} tag 시작하는지 확인할 품사 분류
   * @returns {boolean} 포함되는 경우(시작하는 경우) True
   */
  startsWith(tag: string): boolean {
    return this.reference.startsWith(tag);
  }
}

/**
 * 세종 구문구조 표지자
 * @example
 * import { PhraseTag } from 'koalanlp/types';
 */
export class PhraseTag extends JavaEnum implements Tag {
  /**
   * 값 전체
   * @type {Object.<string, PhraseTag>}
   * @private
   */
  static _values: { [key: string]: PhraseTag } = {};

  /**
   * PhraseTag 값들을 모두 돌려줍니다.
   * @returns {PhraseTag[]} PhraseTag값들의 array
   */
  static values(): PhraseTag[] {
    if (_.isEmpty(PhraseTag._values)) {
      for (const it of JavaEnum.getAllOf('PhraseTag')) {
        let value = new PhraseTag(it);
        PhraseTag._values[value.tagname] = value;

        Object.defineProperty(PhraseTag, value.tagname, {
          value: value,
          writable: false,
          configurable: false
        });
      }

      Object.defineProperty(PhraseTag, '_values', {
        value: Object.freeze(PhraseTag._values),
        writable: false,
        configurable: false
      });
    }

    return _.values(PhraseTag._values);
  }

  /**
   * 이름에 해당하는 값을 찾아줍니다.
   * @param {!string} name 해당 이름으로 된 값
   * @returns {PhraseTag}
   */
  static withName(name: string): PhraseTag {
    return (PhraseTag as any)[name];
  }
}

/**
 * ETRI 의존구문구조 기능표지자
 * @example
 * import { DependencyTag } from 'koalanlp/types';
 */
export class DependencyTag extends JavaEnum implements Tag {
  /**
   * 값 전체
   * @type {Object.<string, DependencyTag>}
   * @private
   */
  static _values: { [key: string]: DependencyTag } = {};

  /**
   * DependencyTag 값들을 모두 돌려줍니다.
   * @returns {DependencyTag[]} DependencyTag값들의 array
   */
  static values(): DependencyTag[] {
    if (_.isEmpty(DependencyTag._values)) {
      JavaEnum.getAllOf('DependencyTag').forEach(it => {
        let value = new DependencyTag(it);
        DependencyTag._values[value.tagname] = value;

        Object.defineProperty(DependencyTag, value.tagname, {
          value: value,
          writable: false,
          configurable: false
        });
      });

      Object.defineProperty(DependencyTag, '_values', {
        value: Object.freeze(DependencyTag._values),
        writable: false,
        configurable: false
      });
    }

    return _.values(DependencyTag._values)
  }

  /**
   * 이름에 해당하는 값을 찾아줍니다.
   * @param {!string} name 해당 이름으로 된 값
   * @returns {DependencyTag}
   */
  static withName(name: string): DependencyTag {
    return DependencyTag._values[name];
  }
}

/**
 * ETRI 의미역 분석 표지
 * @example
 * import { RoleType } from 'koalanlp/types';
 */
export class RoleType extends JavaEnum implements Tag {
  /**
   * 값 전체
   * @type {Object.<string, RoleType>}
   * @private
   */
  static _values: { [key: string]: RoleType } = {};

  /**
   * RoleType 값들을 모두 돌려줍니다.
   * @returns {RoleType[]} RoleType값들의 array
   */
  static values(): RoleType[] {
    if (_.isEmpty(RoleType._values)) {
      JavaEnum.getAllOf('RoleType').forEach(it => {
        let value = new RoleType(it);
        RoleType._values[value.tagname] = value;

        Object.defineProperty(RoleType, value.tagname, {
          value: value,
          writable: false,
          configurable: false
        });
      });

      Object.defineProperty(RoleType, '_values', {
        value: Object.freeze(RoleType._values),
        writable: false,
        configurable: false
      });
    }

    return _.values(RoleType._values)
  }

  /**
   * 이름에 해당하는 값을 찾아줍니다.
   * @param {!string} name 해당 이름으로 된 값
   * @returns {RoleType}
   */
  static withName(name: string): RoleType {
    return RoleType._values[name];
  }
}

/**
 * ETRI 개체명 대분류
 * @example
 * import { CoarseEntityType } from 'koalanlp/types';
 */
export class CoarseEntityType extends JavaEnum implements Tag {
  /**
   * 값 전체
   * @type {Object.<string, CoarseEntityType>}
   * @private
   */
  static _values: { [key: string]: CoarseEntityType } = {};

  /**
   * CoarseEntityType 값들을 모두 돌려줍니다.
   * @returns {CoarseEntityType[]} CoarseEntityType값들의 array
   */
  static values(): CoarseEntityType[] {
    if (_.isEmpty(CoarseEntityType._values)) {
      JavaEnum.getAllOf('CoarseEntityType').forEach(it => {
        let value = new CoarseEntityType(it);
        CoarseEntityType._values[value.tagname] = value;

        Object.defineProperty(CoarseEntityType, value.tagname, {
          value: value,
          writable: false,
          configurable: false
        });
      });

      Object.defineProperty(CoarseEntityType, '_values', {
        value: Object.freeze(CoarseEntityType._values),
        writable: false,
        configurable: false
      });
    }

    return _.values(CoarseEntityType._values)
  }

  /**
   * 이름에 해당하는 값을 찾아줍니다.
   * @param {!string} name 해당 이름으로 된 값
   * @returns {CoarseEntityType}
   */
  static withName(name: string): CoarseEntityType {
    return CoarseEntityType._values[name];
  }
}
