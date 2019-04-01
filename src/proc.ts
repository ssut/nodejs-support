/**
 * 여러 분석기를 모아놓은 module입니다.
 * @module koalanlp/proc
 * @example
 * import { SentenceSplitter, Tagger, Parser, RoleLabeler, EntityRecognizer, Dictionary } from 'koalanlp/proc';
 **/

import { JVM } from './jvm';
import { API, query } from './API';
import { POS } from './types';
import { Sentence, Word } from './data';
import { isDefined } from './common';

/**
 * POSFilter 함수
 */
export type POSFilter = (tag: POS) => boolean;

/**
 * 형태소 사전 항목. {'surface':형태소, 'tag':품사}
 */
export interface DicEntry {
  surface: string;
  tag: POS;
}

/**
 * Build a Function Proxy object
 * @param {Object} thisObj
 * @param {!string} method
 * @returns {Object}
 * @private
 */
function assignProxy(thisObj: any, method: string): any {
  if (method.endsWith('Sync')) {
    return new Proxy(thisObj, {
      async apply(target, thisArg, argArray) {
        return target[method](...argArray);
      },
    });
  }

  return new Proxy(thisObj, {
    async apply(target, thisArg, argArray) {
      return await target[method](...argArray);
    },
  });
}

/**
 * 문장분리기 Wrapper입니다.
 * @example
 * import { SentenceSplitter } from 'koalanlp/proc';
 * import { OKT } from 'koalanlp/API';
 *
 * let splitter = new SentenceSplitter(OKT);
 * splitter("문장을 분리해봅니다. 이렇게요.");
 */
export class SentenceSplitter extends Function {
  /**
   * Java API Object
   * @type {Object}
   * @private
   */
  private _api: any = null;

  /**
   * 문장분리기를 생성합니다.
   *
   * @param {!API} api 문장분리기 API 패키지.
   * @param {Object} [options={}] 기타 설정
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: API, options: any = {}) {
    super();
    this._api = query(api, this.constructor.name)();
    options.isAsyncDefault = isDefined(options.isAsyncDefault) ? options.isAsyncDefault : true;

    return assignProxy(this, (options.isAsyncDefault) ? 'sentences' : 'sentencesSync');
  }

  /**
   * 문단을 문장으로 분리합니다. (Asynchronous)
   * @param {...!string} text 분석할 문단들 (가변인자)
   * @returns {string[]} 분리한 문장들.
   */
  public async sentences(...text: string[]): Promise<string[]> {
    const result: string[] = [];

    for (const paragraph of text) {
      if (Array.isArray(paragraph)) {
        result.push(...await this.sentences(...paragraph));
      } else {
        if (paragraph.trim().length == 0)
          continue;

        let promiseResult = await this._api.sentencesPromise(paragraph);
        result.push(...JVM.toJsArray(promiseResult));
      }
    }

    return result;
  }

  /**
   * 문단을 문장으로 분리합니다. (Synchronous)
   * @param {...!string} text 분석할 문단들 (가변인자)
   * @returns {string[]} 분리한 문장들.
   */
  public sentencesSync(...text: string[]): string[] {
    const result: string[] = [];

    for (const paragraph of text) {
      if (Array.isArray(paragraph)) {
        result.push(...this.sentencesSync(...paragraph));
      } else {
        if (paragraph.trim().length === 0)
          continue;

        result.push(...JVM.toJsArray(this._api.sentences(paragraph)));
      }
    }

    return result;
  }

  /**
   * KoalaNLP가 구현한 문장분리기를 사용하여, 문단을 문장으로 분리합니다. (Asynchronous)
   * @param {Word[]} paragraph 분석할 문단. (품사표기가 되어있어야 합니다)
   * @returns {Sentence} 분리된 문장
   */
  static async sentences(paragraph: Word[]): Promise<Sentence> {
    let sent = [];
    for (const word of paragraph) {
      sent.push((word as any).getReference());
    }

    let promiseResult = await JVM.koalaClassOf('proc', 'SentenceSplitter').INSTANCE.sentencesPromise(sent);
    return JVM.toJsArray(promiseResult, (x: any) => new Sentence(x)) as any;
  }

  /**
   * KoalaNLP가 구현한 문장분리기를 사용하여, 문단을 문장으로 분리합니다. (Synchronous)
   * @param {Word[]} paragraph 분석할 문단. (품사표기가 되어있어야 합니다)
   * @returns {Sentence} 분리된 문장
   */
  static sentencesSync(paragraph: Word[]): Sentence[] {
    let sent: any[] = [];
    for (let word of paragraph) {
      sent.push((word as any).getReference());
    }

    return JVM.toJsArray(JVM.koalaClassOf('proc', 'SentenceSplitter').INSTANCE.sentences(sent), (x) => new Sentence(x));
  }
}

/**
 * 형태소 분석기
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
 * * {@link module:koalanlp/data.Morpheme|Morpheme} 형태소를 저장하는 형태.
 * * {@link module:koalanlp/types.POS|POS} 형태소의 분류를 담은 Enum class
 *
 * @example
 * import { Tagger } from 'koalanlp/proc';
 * import { KMR } from 'koalanlp/API';
 *
 * let tagger = new Tagger(KMR);
 * tagger("문장을 분석해봅니다. 이렇게요.");
 */
export class Tagger extends Function {
  /**
   * Java API Object
   * @type {Object}
   * @private
   */
  private api: any = null;

  /**
   * 품사분석기를 초기화합니다.
   *
   * @param {!API} api 사용할 품사분석기의 유형.
   * @param {Object} [options={}]
   * @param {string} options.apiKey ETRI 분석기의 경우, ETRI에서 발급받은 API Key
   * @param {boolean} [options.useLightTagger=false] 코모란(KMR) 분석기의 경우, 경량 분석기를 사용할 것인지의 여부.
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: API, {
    apiKey = '',
    useLightTagger = false,
    isAsyncDefault = true,
  } = {}) {
    super();

    switch (api) {
      case API.ETRI:
        this.api = query(api, this.constructor.name)(apiKey);
        break;

      case API.KMR:
        this.api = query(api, this.constructor.name)(useLightTagger);
        break;

      default:
        this.api = query(api, this.constructor.name)();
    }

    return assignProxy(this, isAsyncDefault ? 'tag' : 'tagSync');
  }

  /**
   * 문단(들)을 품사분석합니다. (Asynchronous)
   * @param {...(string|string[])} text 분석할 문단들. 텍스트와 string 리스트 혼용 가능. (가변인자)
   * @returns {Sentence[]} 분석된 결과 (Flattened list)
   */
  async tag(...text: (string | string[])[]): Promise<Sentence[]> {
    let result: Sentence[] = [];
    for (let paragraph of text) {
      let promiseResult: Sentence[];
      if (Array.isArray(paragraph)) {
        promiseResult = await this.tag(...paragraph);
        result.push(...promiseResult);
      } else {
        if (paragraph.trim().length == 0)
          continue;

        promiseResult = await this.api.tagPromise(paragraph);
        result.push(...JVM.toJsArray(promiseResult, (x) => new Sentence(x)));
      }
    }
    return result;
  }

  /**
   * 문단(들)을 품사분석합니다. (Synchronous)
   * @param {...(string|string[])} text 분석할 문단들. 텍스트와 string 리스트 혼용 가능. (가변인자)
   * @returns {Sentence[]} 분석된 결과 (Flattened list)
   */
  tagSync(...text: any[]): Sentence[] {
    let result = [];
    for (let paragraph of text) {
      if (Array.isArray(paragraph)) {
        result.push(...this.tagSync(...paragraph));
      } else {
        if (paragraph.trim().length == 0)
          continue;

        result.push(...JVM.toJsArray(this.api.tag(paragraph), (x) => new Sentence(x)));
      }
    }
    return result;
  }

  /**
   * 문장을 품사분석합니다. 각 인자 하나를 하나의 문장으로 간주합니다. (Asynchronous)
   *
   * @param {...!string} text 분석할 문장(들). (가변인자)
   * @returns {Sentence[]} 분석된 결과.
   */
  async tagSentence(...text: any[]): Promise<Sentence[]> {
    let result = [];
    for (let sentence of text) {
      let promiseResult;
      if (Array.isArray(sentence)) {
        promiseResult = await this.tagSentence(...sentence);
        result.push(...promiseResult);
      } else {
        if (sentence.trim().length == 0)
          continue;

        promiseResult = await this.api.tagSentencePromise(sentence);
        result.push(new Sentence(promiseResult));
      }
    }
    return result;
  }

  /**
   * 문장을 품사분석합니다. 각 인자 하나를 하나의 문장으로 간주합니다. (Synchronous)
   *
   * @param {...!string} text 분석할 문장(들). (가변인자)
   * @returns {Sentence[]} 분석된 결과.
   */
  tagSentenceSync(...text: any[]): Sentence[] {
    let result = [];
    for (let sentence of text) {
      if (Array.isArray(sentence)) {
        result.push(...this.tagSentenceSync(...sentence));
      } else {
        if (sentence.trim().length == 0)
          continue;

        result.push(new Sentence(this.api.tagSentence(sentence)));
      }
    }
    return result;
  }
}


/**
 * 문장 속성 부착기 Wrapper
 * @private
 */
class CanAnalyzeProperty extends Function {
  /**
   * Java API Object
   * @type {Object}
   * @private
   */
  _api: any = null;

  /**
   * 특성 부착형 분석기를 초기화합니다.
   *
   * @param {!API} api 사용할 분석기의 유형.
   * @param {!string} cls 사용할 클래스 유형.
   * @param {Object=} options
   * @param {string} options.apiKey ETRI 분석기의 경우, ETRI에서 발급받은 API Key
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: API, cls: any, options: any = {}) {
    super();

    if (api === API.ETRI) {
      let apiKey = options.apiKey;
      this._api = query(api, cls)(apiKey);
    } else {
      this._api = query(api, cls)();
    }

    options.isAsyncDefault = isDefined(options.isAsyncDefault) ? options.isAsyncDefault : true;
    return assignProxy(this, (options.isAsyncDefault) ? 'analyze' : 'analyzeSync');
  }

  /**
   * 문단(들)을 분석합니다. (Asynchronous)
   *
   * @param {...(string|Sentence|string[]|Sentence[])} texts 분석할 문단(들).
   * 각 인자는 텍스트(str), 문장 객체(Sentence), 텍스트의 리스트, 문장 객체의 리스트 혼용 가능 (가변인자)
   * @returns {Sentence[]} 분석된 결과 (Flattened list)
   */
  async analyze(...texts: (string | Sentence | string[] | Sentence[])[]): Promise<Sentence[]> {
    let result: Sentence[] = [];
    for (const paragraph of texts) {
      let promiseResult: Sentence[];

      if (paragraph instanceof Sentence) {
        promiseResult = await this._api.analyzePromise(paragraph.reference);
        result.push(new Sentence(promiseResult));
      } else if (Array.isArray(paragraph)) {
        promiseResult = await this.analyze(...paragraph);
        result.push(...promiseResult);
      } else {
        if (paragraph.trim().length === 0) {
          continue;
        }

        promiseResult = await this._api.analyzePromise(paragraph);
        result.push(...JVM.toJsArray(promiseResult, (x) => new Sentence(x)));
      }
    }

    return result;
  }

  /**
   * 문단(들)을 분석합니다. (Synchronous)
   *
   * @param {...(string|Sentence|string[]|Sentence[])} text 분석할 문단(들).
   * 각 인자는 텍스트(str), 문장 객체(Sentence), 텍스트의 리스트, 문장 객체의 리스트 혼용 가능 (가변인자)
   * @returns {Sentence[]} 분석된 결과 (Flattened list)
   */
  analyzeSync(...text: (string | Sentence | string[] | Sentence[])[]): Sentence[] {
    let result = [];
    for (let paragraph of text) {
      if (paragraph instanceof Sentence) {
        result.push(new Sentence(this._api.analyze(paragraph.reference)));
      } else if (Array.isArray(paragraph)) {
        result.push(...this.analyzeSync(...paragraph));
      } else {
        if (paragraph.trim().length == 0)
          continue;

        result.push(...JVM.toJsArray(this._api.analyze(paragraph), (x) => new Sentence(x)));
      }
    }

    return result;
  }
}

/**
 * 구문구조/의존구조 분석기 Wrapper
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
 * * {@link module:koalanlp/data.Word#phrase|Word#phrase} 어절이 속한 직속 상위 구구조(Phrase)를 돌려주는 API.
 * * {@link module:koalanlp/data.Word#governorEdge|Word#governorEdge} 어절이 지배당하는 상위 의존구조 [DepEdge]를 가져오는 API
 * * {@link module:koalanlp/data.Word#dependentEdges|Word#dependentEdges} 어절이 직접 지배하는 하위 의존구조 [DepEdge]의 목록를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#syntaxTree|Sentence#syntaxTree} 전체 문장을 분석한 [SyntaxTree]를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#dependencies|Sentence#dependencies} 전체 문장을 분석한 의존구조 [DepEdge]의 목록을 가져오는 API
 * * {@link module:koalanlp/data.SyntaxTree|SyntaxTree} 구문구조를 저장하는 형태
 * * {@link module:koalanlp/data.DepEdge|DepEdge} 의존구문구조의 저장형태
 * * {@link module:koalanlp/types.PhraseTag|PhraseTag} 의존구조의 형태 분류를 갖는 Enum 값 (구구조 분류와 같음)
 * * {@link module:koalanlp/types.DependencyTag|DependencyTag} 의존구조의 기능 분류를 갖는 Enum 값
 *
 * @inheritDoc
 * @example
 * import { Parser } from 'koalanlp/proc';
 * import { HNN } from 'koalanlp/API';
 *
 * let parser = new Parser(HNN);
 * parser("문장을 분석해봅니다. 이렇게요.");
 */
export class Parser extends CanAnalyzeProperty {
  /**
   * 구문구조/의존구조분석기를 초기화합니다.
   *
   * @param {!API} api 사용할 분석기의 유형.
   * @param {Object=} options
   * @param {string} options.apiKey ETRI 분석기의 경우, ETRI에서 발급받은 API Key
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: any, options: { apiKey?: string; isAsyncDefault: boolean } = { isAsyncDefault: true }) {
    super(api, 'Parser', options);
  }
}

/**
 * 개체명 인식기 Wrapper
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
 * * {@link module:koalanlp/data.Morpheme#entities|Morpheme#entities} 형태소를 포함하는 모든 [Entity]를 가져오는 API
 * * {@link module:koalanlp/data.Word#entities|Word#entities} 어절을 포함하는 모든 [Entity]를 가져오는 API
 * * {@link module:koalanlp/data.Sentence#entities|Sentence#entities} 문장에 포함된 모든 [Entity]를 가져오는 API
 * * {@link module:koalanlp/data.Entity|Entity} 개체명을 저장하는 형태
 * * {@link module:koalanlp/types.CoarseEntityType|CoarseEntityType} [Entity]의 대분류 개체명 분류구조 Enum 값
 *
 * @inheritDoc
 * @example
 * import { EntityRecognizer } from 'koalanlp/proc';
 * import { ETRI } from 'koalanlp/API';
 *
 * let parser = new EntityRecognizer(ETRI);
 * parser("문장을 분석해봅니다. 이렇게요.");
 */
export class EntityRecognizer extends CanAnalyzeProperty {
  /**
   * 개체명 인식기를 초기화합니다.
   *
   * @param {!API} api 사용할 분석기의 유형.
   * @param {Object=} options
   * @param {string} options.apiKey ETRI 분석기의 경우, ETRI에서 발급받은 API Key
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: any, options: object | undefined = {}) {
    super(api, 'EntityRecognizer', options);
    return assignProxy(this, 'analyze');
  }
}

/**
 * 의미역 분석기 Wrapper
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
 * * {@link module:koalanlp/data.Word#predicateRoles|Word#predicateRoles} 어절이 논항인 [RoleEdge]의 술어를 가져오는 API
 * * {@link module:koalanlp/data.Word#argumentRoles|Word#argumentRoles} 어절이 술어인 [RoleEdge]의 논항들을 가져오는 API
 * * {@link module:koalanlp/data.Sentence#roles|Sentence#roles} 전체 문장을 분석한 의미역 구조 [RoleEdge]를 가져오는 API
 * * {@link module:koalanlp/data.RoleEdge|RoleEdge} 의미역 구조를 저장하는 형태
 * * {@link module:koalanlp/types.RoleType|RoleType} 의미역 분류를 갖는 Enum 값
 *
 * @inheritDoc
 * @example
 * import { RoleLabeler } from 'koalanlp/proc';
 * import { ETRI } from 'koalanlp/API';
 *
 * let parser = new RoleLabeler(ETRI);
 * parser("문장을 분석해봅니다. 이렇게요.");
 */
export class RoleLabeler extends CanAnalyzeProperty {
  /**
   * 의미역 분석기를 초기화합니다.
   *
   * @param {!API} api 사용할 분석기의 유형.
   * @param {Object=} options
   * @param {string} options.apiKey ETRI 분석기의 경우, ETRI에서 발급받은 API Key
   * @param {boolean} [options.isAsyncDefault=true] 객체를 함수처럼 사용할 때, 즉 processor("문장")과 같이 사용할 때, 기본 호출을 async로 할 지 선택합니다. 기본값은 Asynchronous 호출입니다.
   */
  constructor(api: any, options: object | undefined = {}) {
    super(api, 'RoleLabeler', options);
    return assignProxy(this, 'analyze');
  }
}

/**
 * Java 사전 항목을 JS 사전 항목으로 변환.
 * @param entry Java 사전 항목
 * @return {DicEntry} JS 사전 항목
 * @private
 */
function readDicEntry(entry: any): DicEntry {
  return {
    'surface': entry.getFirst(),
    'tag': POS.withName(entry.getSecond().name())
  };
}

/**
 * 사전 Wrapper
 * @example
 * import { Dictionary } from 'koalanlp/proc';
 * import { KKMA } from 'koalanlp/API';
 *
 * let dict = Dictionary(KKMA);
 * dict.addUserDictionary({'surface': "하림"});
 */
export class Dictionary {
  /**
   * Java API Object
   * @type {Object}
   * @private
   */
  _api: any = null;

  /**
   * 사용자 정의 사전을 연결합니다.
   *
   * @param {!API} api 사용자 정의 사전을 연결할 API 패키지.
   */
  constructor(api: any) {
    this._api = query(api, 'Dictionary').INSTANCE;
  }

  /**
   * 사용자 사전에, 표면형과 그 품사를 추가.
   * @param {...DicEntry} pairs 추가할 형태소와 품사들. (가변인자)
   */
  addUserDictionary(...pairs: any[]) {
    let surfaceList = [];
    let tagList = [];

    for (let pair of pairs) {
      surfaceList.push(pair.surface);

      let tag = pair.tag ? pair.tag.reference : POS.NNP.reference;
      tagList.push(tag);
    }

    this._api.addUserDictionary(JVM.listOf(surfaceList), JVM.listOf(tagList));
  }

  /**
   * 사전에 등재되어 있는지 확인합니다.
   * @param {string} word 확인할 형태소
   * @param {POS} posTags 세종품사들(기본값: NNP 고유명사, NNG 일반명사)
   * @returns {boolean} 사전에 포함된다면 True 아니면 False.
   */
  contains(word: any, ...posTags: any[]): boolean {
    let tags = (posTags.length > 0) ? posTags : [POS.NNP, POS.NNG];
    if (tags.length === 1) {
      let tag = tags[0];
      return this._api.contains(JVM.pair(word, tag.reference));
    } else {
      let tagsRef = tags.map((tag) => tag.reference);
      return this._api.contains(word, JVM.setOf(tagsRef));
    }
  }

  /**
   * 다른 사전을 참조하여, 선택된 사전에 없는 단어를 사용자사전으로 추가합니다.
   *
   * @param {Dictionary} other 참조할 사전
   * @param {boolean} [fastAppend=false] 선택된 사전에 존재하는지를 검사하지 않고 빠르게 추가하고자 할 때.
   * @param {POSFilter} [filter=(x) => x.isNoun()] 가져올 품사나, 품사의 리스트, 또는 해당 품사인지 판단하는 함수.
   */
  async importFrom(other: { _api: any; }, fastAppend: boolean = false, filter: POSFilter = (x) => x.isNoun()) {
    let tags = [];
    if (filter instanceof Function) {
      for (let tag of POS.values()) {
        if (filter(tag)) tags.push(tag.tagname);
      }
    } else {
      for (let tag of filter as any) {
        tags.push(tag.tagname);
      }
    }

    await this._api.importFromPromise(other._api, fastAppend, JVM.posFilter(tags));
  }

  /**
   * 원본 사전에 등재된 항목 중에서, 지정된 형태소의 항목만을 가져옵니다. (복합 품사 결합 형태는 제외)
   *
   * @param {POSFilter} [filter=(x) => x.isNoun()] 가져올 품사나, 품사의 리스트, 또는 해당 품사인지 판단하는 함수.
   * @return {Iterator.<DicEntry>} {'surface':형태소, 'tag':품사}의 generator
   */
  async getBaseEntries(filter: POSFilter = (x) => x.isNoun()): Promise<Iterator<DicEntry>> {
    let tags = [];
    if (filter instanceof Function) {
      for (let tag of POS.values()) {
        if (filter(tag)) tags.push(tag.tagname);
      }
    } else {
      for (let tag of filter as any) {
        tags.push(tag.tagname);
      }
    }

    let entries = await this._api.getBaseEntriesPromise(JVM.posFilter(tags));
    return (function* () {
      while (entries.hasNext()) {
        yield readDicEntry(entries.next());
      }
    })();
  }

  /**
   * 사용자 사전에 등재된 모든 항목을 가져옵니다.
   * @return {DicEntry[]} {'surface':형태소, 'tag':품사}의 list
   */
  async getItems(): Promise<DicEntry[]> {
    return JVM.toJsArray(await this._api.getItemsPromise(), readDicEntry);
  }

  /**
   * 사전에 등재되어 있는지 확인하고, 사전에 없는단어만 반환합니다.
   * @param {boolean} onlySystemDic 시스템 사전에서만 검색할지 결정합니다.
   * @param {DicEntry} word {'surface':형태소, 'tag':품사}들. (가변인자)
   * @return {DicEntry[]} 사전에 없는 단어들
   */
  async getNotExists(onlySystemDic: any, ...word: any[]): Promise<DicEntry[]> {
    let zipped = word.map((pair) => JVM.pair(pair.surface, pair.tag.reference));
    return JVM.toJsArray(await this._api.getNotExistsPromise(onlySystemDic, ...zipped), readDicEntry);
  }
}
