import * as Util from '../src/Util';
import { POS, CoarseEntityType, DependencyTag, PhraseTag, RoleType } from '../src/types';
import * as _ from 'lodash';

export default function () {
  describe('Type Tags', () => {
    describe('POS', () => {
      it('discriminate tags', () => {
        const SET_NOUNS = (x: any): boolean => x.isNoun();
        const SET_PREDICATES = (x: any): boolean => x.isPredicate();
        const SET_MODIFIERS = (x: any): boolean => x.isModifier();
        const SET_POSTPOSITIONS = (x: any): boolean => x.isPostPosition();
        const SET_ENDINGS = (x: any): boolean => x.isEnding();
        const SET_AFFIXES = (x: any): boolean => x.isAffix();
        const SET_SUFFIXES = (x: any): boolean => x.isSuffix();
        const SET_SYMBOLS = (x: any): boolean => x.isSymbol();
        const SET_UNKNOWNS = (x: any): boolean => x.isUnknown();

        let map = {
          'NNG': [SET_NOUNS],
          'NNP': [SET_NOUNS],
          'NNB': [SET_NOUNS],
          'NNM': [SET_NOUNS],
          'NR': [SET_NOUNS],
          'NP': [SET_NOUNS],
          'VV': [SET_PREDICATES],
          'VA': [SET_PREDICATES],
          'VX': [SET_PREDICATES],
          'VCP': [SET_PREDICATES],
          'VCN': [SET_PREDICATES],
          'MM': [SET_MODIFIERS],
          'MAG': [SET_MODIFIERS],
          'MAJ': [SET_MODIFIERS],
          'IC': [],
          'JKS': [SET_POSTPOSITIONS],
          'JKC': [SET_POSTPOSITIONS],
          'JKG': [SET_POSTPOSITIONS],
          'JKO': [SET_POSTPOSITIONS],
          'JKB': [SET_POSTPOSITIONS],
          'JKV': [SET_POSTPOSITIONS],
          'JKQ': [SET_POSTPOSITIONS],
          'JC': [SET_POSTPOSITIONS],
          'JX': [SET_POSTPOSITIONS],
          'EP': [SET_ENDINGS],
          'EF': [SET_ENDINGS],
          'EC': [SET_ENDINGS],
          'ETN': [SET_ENDINGS],
          'ETM': [SET_ENDINGS],
          'XPN': [SET_AFFIXES],
          'XPV': [SET_AFFIXES],
          'XSN': [SET_AFFIXES, SET_SUFFIXES],
          'XSV': [SET_AFFIXES, SET_SUFFIXES],
          'XSA': [SET_AFFIXES, SET_SUFFIXES],
          'XSM': [SET_AFFIXES, SET_SUFFIXES],
          'XSO': [SET_AFFIXES, SET_SUFFIXES],
          'XR': [],
          'SF': [SET_SYMBOLS],
          'SP': [SET_SYMBOLS],
          'SS': [SET_SYMBOLS],
          'SE': [SET_SYMBOLS],
          'SO': [SET_SYMBOLS],
          'SW': [SET_SYMBOLS],
          'NF': [SET_UNKNOWNS],
          'NV': [SET_UNKNOWNS],
          'NA': [SET_UNKNOWNS],
          'SL': [],
          'SH': [],
          'SN': []
        };

        let tagset = [SET_UNKNOWNS,
          SET_SYMBOLS,
          SET_SUFFIXES,
          SET_AFFIXES,
          SET_ENDINGS,
          SET_POSTPOSITIONS,
          SET_MODIFIERS,
          SET_PREDICATES,
          SET_NOUNS];

        expect(Object.keys(map).sort()).toEqual(POS.values()
          .filter((x) => x.tagname !== 'TEMP').map((x: any) => x.tagname).sort());

        for (const [tag, setup] of Object.entries(map)) {
          for (const target of tagset) {
            expect(target((POS as any)[tag])).toBe(setup.includes(target));
            expect((POS as any)[tag]).toBe(POS.withName(tag));
          }
        }
      });

      it('belongs to some partial tags', () => {
        let partialCodes: any[] = [];
        for (const tag of POS.values()) {
          if (tag !== (POS as any).TEMP) {
            let name = tag.tagname;

            _.range(1, name.length + 1).forEach((l) => {
              let substring = name.substr(0, l);
              if (!partialCodes.includes(substring)) {
                partialCodes.push(substring);
                partialCodes.push(substring.toLowerCase());
              }
            });
          }
        }

        for (const tag of POS.values()) {
          if (tag !== (POS as any).TEMP) {
            if (tag.isUnknown()) {
              for (const code of partialCodes) {
                if (code.toUpperCase() === 'N') {
                  expect(tag.startsWith(code)).toBe(false);
                } else {
                  expect(tag.startsWith(code)).toBe(tag.tagname.startsWith(code.toUpperCase()));
                }
              }
            } else {
              for (const code of partialCodes) {
                expect(tag.startsWith(code)).toBe(tag.tagname.startsWith(code.toUpperCase()));
              }
            }
          }
        }
      })
    });

    describe('PhraseTag', () => {
      it('discriminate tags', () => {
        let values = PhraseTag.values();
        let codes = values.map((c) => c.tagname);

        _.range(100).forEach(() => {
          let filtered = codes.filter(() => _.random(0, 1) == 1);
          for (const tag of values) {
            expect(Util.contains(filtered, tag)).toBe(filtered.includes(tag.tagname));
          }
        });

        for (const code of codes) {
          expect(PhraseTag.withName(code)).toBe((PhraseTag as any)[code]);
        }
      });
    });

    describe('DependencyTag', () => {
      it('discriminate tags', () => {
        let values = DependencyTag.values();
        let codes = values.map((c) => c.tagname);

        _.range(100).forEach(() => {
          let filtered = codes.filter(() => _.random(0, 1) == 1);
          for (const tag of values) {
            expect(Util.contains(filtered, tag)).toBe(filtered.includes(tag.tagname));
          }
        });

        for (const code of codes) {
          expect(DependencyTag.withName(code)).toBe((DependencyTag as any)[code]);
        }
      });
    });

    describe('RoleType', () => {
      it('discriminate tags', () => {
        let values = RoleType.values();
        let codes = values.map((c) => c.tagname);

        _.range(100).forEach(() => {
          let filtered = codes.filter(() => _.random(0, 1) == 1);
          for (const tag of values) {
            expect(Util.contains(filtered, tag)).toBe(filtered.includes(tag.tagname));
          }
        });

        for (const code of codes) {
          expect(RoleType.withName(code)).toBe((RoleType as any)[code]);
        }
      });
    });

    describe('CoarseEntityType', () => {
      it('discriminate tags', () => {
        let values = CoarseEntityType.values();
        let codes = values.map((c) => c.tagname);

        _.range(100).forEach(() => {
          let filtered = codes.filter(() => _.random(0, 1) == 1);
          for (const tag of values) {
            expect(Util.contains(filtered, tag)).toBe(filtered.includes(tag.tagname));
          }
        });

        for (const code of codes) {
          expect(CoarseEntityType.withName(code)).toBe((CoarseEntityType as any)[code]);
        }
      });
    });
  });
}
