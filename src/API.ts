/**
 * KoalaNLP가 지원하는 패키지의 목록을 키값으로 가지고 있습니다.
 *
 * * **주의** API를 import한다고 하여 자동으로 초기화가 되지 않으니 꼭 {@link module:koalanlp/Util.initialize}를 실행하시기 바랍니다.
 *
 * @module koalanlp/API
 * @example
 * import * as API from 'koalanlp/API';
 * **/

import { JVM } from './jvm';

export enum API {
  /**
   * 한나눔.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-hnn.svg?style=flat-square&label=r"/> 버전이 최신입니다. 문장분리, 품사분석, 구문분석, 의존분석이 가능합니다
   * @example
   * import { HNN } from 'koalanlp/API';
   */
  HNN = 'hnn',
  /**
   * 코모란.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-kmr.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석만 가능합니다
   * @example
   * import { KMR } from 'koalanlp/API';
   */
  KMR = 'kmr',
  /**
   * 꼬꼬마.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-kkma.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석, 의존분석만 가능합니다
   * @example
   * import { KKMA } from 'koalanlp/API';
   */
  KKMA = 'kkma',
  /*
   * 은전한닢.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-eunjeon.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석만 가능합니다
   * @example
   * import { EUNJEON } from 'koalanlp/API';
   */
  EUNJEON = 'eunjeon',
  /**
   * 아리랑.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-arirang.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석만 가능합니다
   * @example
   * import { ARIRANG } from 'koalanlp/API';
   */
  ARIRANG = 'arirang',
  /**
   * 라이노.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-rhino.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석만 가능합니다.
   * @example
   * import {RHINO} from 'koalanlp/API';
   */
  RHINO = 'rhino',
  /**
   * 트위터.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-okt.svg?style=flat-square&label=r"/> 버전이 최신입니다. 문장분리, 품사분석만 가능합니다.
   * @example
   * import {OKT} from 'koalanlp/API';
   */
  OKT = 'okt',
  /**
   * 다온.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-daon.svg?style=flat-square&label=r"/> 버전이 최신입니다. 품사분석만 가능합니다.
   * @example
   * import {DAON} from 'koalanlp/API';
   */
  DAON = 'daon',
  /**
   * ETRI Open API.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-etri.svg?style=flat-square&label=r"/> 버전이 최신입니다.
   * @example
   * import {ETRI} from 'koalanlp/API';
   */
  ETRI = 'etri',
  /**
   * Kakao Khaiii (Experimental)
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-khaiii.svg?style=flat-square&label=r"/> 버전이 최신입니다.
   *
   * **(참고)**
   * - 이 기능은 현재 실험적인 기능입니다.
   * - Khaiii는 C++로 개발되어 별도 설치가 필요합니다. [Khaiii](https://github.com/kakao/khaiii) 공식 홈페이지에서 설치법을 확인하시고, 설치하시면 됩니다.
   *
   * @example
   * import {KHAIII} from 'koalanlp/API';
   */
  KHAIII = 'khaiii',
  /**
   * 분석기 Interface 정의 라이브러리.
   * 현재 <img src="https://img.shields.io/maven-central/v/kr.bydelta/koalanlp-core.svg?style=flat-square&label=r"/> 버전이 최신입니다. 편의기능을 제공하며 타 분석기 참조시 함께 참조됩니다.
   * @example
   * import {CORE} from 'koalanlp/API';
   */
  CORE = 'core',
}

// to make sure version 3 will have compatibility with version 2
export const HNN = API.HNN;
export const KMR = API.KMR;
export const KKMA = API.KKMA;
export const EUNJEON = API.EUNJEON;
export const ARIRANG = API.ARIRANG;
export const RHINO = API.RHINO;
export const OKT = API.OKT;
export const DAON = API.DAON;
export const ETRI = API.ETRI;
export const KHAIII = API.KHAIII;
export const CORE = API.CORE;

/**
 * 'assembly' classifier 필요 여부
 * @private
 */
export const PACKAGE_REQUIRE_ASSEMBLY: API[] = [API.HNN, API.KKMA, API.ARIRANG, API.RHINO, API.DAON];

/**
 * 해당 API가 분석기를 지원하는지 확인함.
 * @private
 */
export function query(api: API, type: string): any {
  try {
      return JVM.koalaClassOf(api, type);
  } catch (e) {
      throw Error(`API.${api}에서 ${type}을 불러오는 데 실패했습니다! ${type}이 없거나, 다운로드가 완전하지 않았을 수 있습니다. Cause: ${e}`);
  }
}

/**
 * API의 패키지 이름 반환
 * @private
 */
export function getPackage(api: API) {
  return api.toLowerCase();
}
