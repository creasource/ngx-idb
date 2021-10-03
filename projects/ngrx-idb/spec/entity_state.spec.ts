import { createIDBEntityAdapter, IDBEntityAdapter } from '../src/lib';
import { BookModel } from './fixtures/book';

describe('Entity State', () => {
  let adapter: IDBEntityAdapter<BookModel>;

  beforeEach(() => {
    adapter = createIDBEntityAdapter({
      keySelector: (book: BookModel) => book.id,
      indexes: [
        { name: 'title', keySelector: 'title' },
        { name: 'year', keySelector: (book: BookModel) => book.year },
        'editor',
      ],
    });
  });

  it('should let you get the initial state', () => {
    const initialState = adapter.getInitialState();

    expect(initialState).toEqual({
      keys: [],
      entities: {},
      indexes: {
        title: {
          keys: [],
          entities: {},
        },
        year: {
          keys: [],
          entities: {},
        },
        editor: {
          keys: [],
          entities: {},
        },
      },
    });
  });

  it('should let you provide additional initial state properties', () => {
    const additionalProperties = { isHydrated: true };

    const initialState = adapter.getInitialState(additionalProperties);

    expect(initialState).toEqual({
      ...additionalProperties,
      keys: [],
      entities: {},
      indexes: {
        title: {
          keys: [],
          entities: {},
        },
        year: {
          keys: [],
          entities: {},
        },
        editor: {
          keys: [],
          entities: {},
        },
      },
    });
  });
});
