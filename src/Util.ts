import { Tag } from './types';
/**
 * 초기화 및 기타 작업에 필요한 함수를 제공합니다.
 *
 * @module koalanlp/Util
 * @example
 * import * as Util from 'koalanlp/Util';
 */

import { API, PACKAGE_REQUIRE_ASSEMBLY, getPackage } from './API';
import { JVM } from './jvm';
import { POS, CoarseEntityType, DependencyTag, PhraseTag, RoleType } from "./types";
import * as _ from 'lodash';
import { assert, isDefined } from './common';

import * as request from 'request-promise';

/**
 * @private
 * @param api
 */
async function queryVersion(api: API) {
  const url = `https://oss.sonatype.org/content/repositories/public/kr/bydelta/koalanlp-${api}`;
  const result = await request(url);

  const matches = result
    .match(new RegExp(`${url}/(\\d+\\.\\d+\\.\\d+)/`, 'g'))
    .map((line: string) => line.split('/').reverse()[1]);

  const version = matches.sort().reverse()[0];
  console.info(`[INFO] Latest version of kr.bydelta:koalanlp-${api} (${version}) will be used`);
  return version;
}

/**
 * API와 버전을 받아 Artifact 객체 구성
 * @param {API} api 분석기 패키지 이름
 * @param {!string} version 버전 또는 LATEST
 * @return {{groupId: string, artifactId: string, version: string}} Artifact 객체
 * @private
 */
async function makeDependencyItem(api: API, version: string) {
  const isAssembly = PACKAGE_REQUIRE_ASSEMBLY.includes(api);
  if (typeof version !== 'string' || version.toUpperCase() === 'LATEST') {
    version = await queryVersion(api);
  }

  return {
    groupId: "kr.bydelta",
    artifactId: `koalanlp-${api}`,
    version,
    ...(isAssembly ? { classifier: 'assembly' } : {}),
  };
}

/**
 * Remote Maven Repository list
 * @type {Object[]}
 * @private
 */
const remoteRepos = [
  {
    id: 'sonatype',
    url: 'https://oss.sonatype.org/content/repositories/public/'
  },
  {
    id: "jitpack.io",
    url: "https://jitpack.io/"
  },
  {
    id: 'jcenter',
    url: 'http://jcenter.bintray.com/'
  },
  {
    id: 'maven-central-1',
    url: 'http://repo1.maven.org/maven2/'
  },
  {
    id: 'maven-central-2',
    url: 'http://central.maven.org/maven2/'
  },
  {
    id: 'kotlin-dev',
    url: 'https://dl.bintray.com/kotlin/kotlin-dev/'
  }
];

function versionSplit(ver: string) {
  let dashAt = ver.indexOf('-');

  if (dashAt !== -1) {
    let semver: any[] = ver.substr(0, dashAt).split('\\.');
    let tag = ver.substr(dashAt + 1);

    semver = semver.map(parseInt);
    semver.push(tag);
    return semver;
  } else {
    let semver = ver.split('\\.');
    return semver.map(parseInt);
  }
}

/** @private */
function isRightNewer(ver1: string, ver2: string): boolean {
  let semver1 = versionSplit(ver1);
  let semver2 = versionSplit(ver2);

  let length = Math.max(semver1.length, semver2.length);
  for (let i of _.range(length)) {
    let comp1 = semver1[i];
    let comp2 = semver2[i];

    if (!isDefined(comp2)) return true; // 왼쪽은 Tag가 있지만 오른쪽은 없는 상태. (오른쪽이 더 최신)
    if (!isDefined(comp1)) return false; // 반대: 왼쪽이 더 최신
    if (comp1 !== comp2) return comp1 < comp2; // comp2 가 더 높으면 최신.
  }

  return false;
}

export interface InitializeOptions {
  packages: { [key: string]: string };
  javaOptions: string[];
  verbose: boolean;
  tempJsonName: string;
}

/**
 * 자바 및 의존패키지를 Maven Repository에서 다운받고, 자바 환경을 실행합니다.
 *
 * @param {Object} options
 * @param {Object.<string, string>} options.packages 사용할 패키지와 그 버전들.
 * @param {string[]} [options.javaOptions=["-Xmx4g", "-Dfile.encoding=utf-8"]] JVM 초기화 조건
 * @param {boolean} [options.verbose=true] 더 상세히 초기화 과정을 보여줄 것인지의 여부.
 * @param {!string} [options.tempJsonName='koalanlp.json'] Maven 실행을 위해 임시로 작성할 파일의 이름.
 * @example
 * import {initialize} from 'koalanlp/Util';
 * import {ETRI} from 'koalanlp/API';
 *
 * // Promise 방식
 * let promise = initialize({'packages': {ETRI: '2.0.4'}});
 * promise.then(...);
 *
 * // Async/Await 방식 (async function 내부에서)
 * await initialize({ETRI: '2.0.4'});
 * ...
 */
export async function initialize(options: Partial<InitializeOptions>) {
  if (!options.packages) {
    throw new Error('packages는 설정되어야 하는 값입니다.');
  }

  const packages = options.packages;
  const verbose = (isDefined(options.verbose)) ? options.verbose : false;
  const javaOptions = options.javaOptions || ["-Xmx4g", "-Dfile.encoding=utf-8"];
  const tempJsonName = options.tempJsonName || 'koalanlp.json';

  /***** 자바 초기화 ******/
  const java = require('java');

  if (!JVM.canLoadPackages(packages)) {
    throw Error(`JVM은 두번 이상 초기화될 수 없습니다. ${packages}를 불러오려고 시도했지만 이미 ${JVM.packages}를 불러온 상태입니다.`);
  }

  java.options.push(...javaOptions);
  java.asyncOptions = {
    asyncSuffix: undefined,   // Async Callback 무력화
    syncSuffix: '',           // Synchronized call은 접미사 없음
    promiseSuffix: 'Promise', // Promise Callback 설정
    promisify: require('util').promisify
  };

  /***** Maven 설정 *****/
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const mvn = require('node-java-maven');

  // 의존 패키지 목록을 JSON으로 작성하기
  const dependencies = await Promise.all(Object.keys(packages)
    .map((pack: any) => makeDependencyItem(getPackage(pack) as API, packages[pack])));

  // Package 버전 업데이트 (Compatiblity check 위함)
  for (const pack of dependencies) {
    packages[pack.artifactId.replace('koalanlp-', '').toUpperCase()] = pack.version;
  }

  // 저장하기
  const packPath = path.join(os.tmpdir(), tempJsonName);
  fs.writeFileSync(packPath, JSON.stringify({
    java: {
      dependencies: dependencies,
      exclusions: [
        {
          groupId: "com.jsuereth",
          artifactId: "sbt-pgp"
        }
      ]
    }
  }));

  const concurrency = Math.max(require('os').cpus().length - 1, 1);
  const promise = new Promise((resolve, reject) => {
    mvn({
      packageJsonPath: packPath,
      debug: verbose,
      repositories: remoteRepos,
      concurrency,
    }, function (err: Error, mvnResults: { dependencies: { groupId: any, artifactId: any, version: string, jarPath: string }[] }) {
      if (err) {
        console.error('필요한 의존패키지를 전부 다 가져오지는 못했습니다.');
        reject(err);
      } else {
        const cleanClasspath: { [key: string]: any } = {};

        for (const dependency of Object.values(mvnResults.dependencies)) {
          let group = dependency.groupId;
          let artifact = dependency.artifactId;
          let version = dependency.version;
          let key = `${group}:${artifact}`;

          if (!isDefined(cleanClasspath[key]) || isRightNewer(cleanClasspath[key].version, version)) {
            cleanClasspath[key] = {
              version: version,
              path: dependency.jarPath
            };
          }
        }

        for (const dependency of Object.values(cleanClasspath)) {
          if (!isDefined(dependency.path))
            continue;
          if (verbose)
            console.debug(`Classpath에 ${dependency.path} 추가`);
          java.classpath.push(path.resolve(dependency.path));
        }

        JVM.init(java, packages);

        // Enum 초기화.
        POS.values();
        PhraseTag.values();
        DependencyTag.values();
        RoleType.values();
        CoarseEntityType.values();

        resolve();
      }
    });
  });

  return await promise;
}

/**
 * 주어진 문자열 리스트에 구문분석 표지자/의존구문 표지자/의미역 표지/개체명 분류가 포함되는지 확인합니다.
 * @param {string[]} stringList 분류가 포함되는지 확인할 문자열 목록
 * @param {(POS|PhraseTag|DependencyTag|CoarseEntityType|RoleType)} tag 포함되는지 확인할 구문분석 표지자/의존구문 표지자/의미역 표지/개체명 분류
 * @return {boolean} 포함되면 true.
 * @example
 * import { contains } from 'koalanlp/Util';
 * contains(['S', 'NP'], PhraseTag.NP);
 */
export function contains(stringList: string[], tag: Tag): boolean {
  if (tag instanceof POS || tag instanceof PhraseTag ||
    tag instanceof DependencyTag || tag instanceof RoleType || tag instanceof CoarseEntityType) {
    return JVM.koalaClassOf('Util').contains(JVM.listOf(stringList), tag.reference);
  } else {
    return false;
  }
}
