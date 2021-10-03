// noinspection JSUnusedLocalSymbols

import * as ngCore from '@angular/core';
import { AClockworkOrange } from './fixtures/book';
import { selectPrimaryKey } from '../src/lib/utils';

describe('Entity utils', () => {
  describe(`selectIdValue()`, () => {
    it('should not warn when key does exist', () => {
      const spy = spyOn(console, 'warn');

      const key = selectPrimaryKey(AClockworkOrange, (book) => book.id);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should warn when key does not exist in dev mode', () => {
      const spy = spyOn(console, 'warn');

      const key = selectPrimaryKey(AClockworkOrange, (book: any) => book.foo);

      expect(spy).toHaveBeenCalled();
    });

    it('should warn when key is undefined in dev mode', () => {
      const spy = spyOn(console, 'warn');

      const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined };
      const key = selectPrimaryKey(
        undefinedAClockworkOrange,
        (book: any) => book.id
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should not warn when key does not exist in prod mode', () => {
      spyOn(ngCore, 'isDevMode').and.returnValue(false);
      const spy = spyOn(console, 'warn');

      const key = selectPrimaryKey(AClockworkOrange, (book: any) => book.foo);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not warn when key is undefined in prod mode', () => {
      spyOn(ngCore, 'isDevMode').and.returnValue(false);
      const spy = spyOn(console, 'warn');

      const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined };
      const key = selectPrimaryKey(
        undefinedAClockworkOrange,
        (book: any) => book.id
      );

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
