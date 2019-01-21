import { expect } from 'chai';
import { Replacement } from 'tslint';
import { getFailureMessage } from '../src/usePathMappingRule';
import { assertAnnotated, assertSuccess } from './helper';

const ruleName = `use-path-mapping`;

describe('use-path-mapping', () => {
  it('should succeed when used @core', () => {
    const source = `
    import { Foo } from '@core';
    `;
    assertSuccess(ruleName, source);
  });
  it('should fail when muse be used @core', () => {
    const source = `
    import { Foo } from '../core/index.ts';
                         ~~~~~~~~~~~~~~~~
    `;
    assertAnnotated({
      message: getFailureMessage('@core'),
      ruleName,
      source,
    });
  });
  it('should succeed when allow subdirectories', () => {
    const source = `
    import { Foo } from '@core/index.ts';
    `;
    assertSuccess(ruleName, source, [ true, [ '@core/*'] ]);
  });
  it('should fail when no-allow subdirectories', () => {
    const source = `
    import { Foo } from '@core/index.ts';
                         ~~~~~~~~~~~~~~
    `;
    assertAnnotated({
      message: getFailureMessage('@core'),
      ruleName,
      source,
      options: [ true, [ '@core'] ],
    });
  });
  describe('Fix', () => {
    it('should be fix import path', () => {
      const source = `
      import { Foo } from '@core/index.ts';
                           ~~~~~~~~~~~~~~
      `;
      // import { Foo } from@core s';
      const failures = assertAnnotated({
        message: getFailureMessage('@core'),
        ruleName,
        source,
        options: [ true, [ '@core'] ],
      });
      const res = Replacement.applyAll(source, failures[0].getFix());
      expect(res).to.eq(`
      import { Foo } from '@core';
                           ~~~~~~~~~~~~~~
      `);
    });
  });
});
