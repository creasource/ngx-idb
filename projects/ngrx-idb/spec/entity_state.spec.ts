import { createIDBEntityAdapter, IDBEntityAdapter } from '../src/lib';
import { BookModel } from './fixtures/book';

describe('Entity State', () => {
  let adapter: IDBEntityAdapter<BookModel>;

  beforeEach(() => {
    adapter = createIDBEntityAdapter({
      keySelector: (book: BookModel) => book.id,
      indexes: {},
    });
  });

  it('should let you get the initial state', () => {
    const initialState = adapter.getInitialState();

    expect(initialState).toEqual({
      keys: [],
      entities: {},
      indexes: {},
    });
  });

  it('should let you provide additional initial state properties', () => {
    const additionalProperties = { isHydrated: true };

    const initialState = adapter.getInitialState(additionalProperties);

    expect(initialState).toEqual({
      ...additionalProperties,
      keys: [],
      entities: {},
      indexes: {},
    });
  });
});
