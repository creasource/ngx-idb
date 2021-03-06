import {
  createIDBEntityAdapter,
  IDBEntityAdapter,
  IDBEntityState,
} from '../src/lib';
import { IDBEntitySelectors } from '../src/lib/models';
import {
  BookModel,
  AClockworkOrange,
  AnimalFarm,
  TheGreatGatsby,
} from './fixtures/book';
import { MemoizedSelector, createSelector } from '@ngrx/store';

describe('Entity State Selectors', () => {
  describe('Composed Selectors', () => {
    interface State {
      books: IDBEntityState<BookModel, never>;
    }

    let adapter: IDBEntityAdapter<BookModel, never>;
    let selectors: IDBEntitySelectors<BookModel, never, State>;
    let state: State;

    beforeEach(() => {
      adapter = createIDBEntityAdapter({
        keySelector: (book: BookModel) => book.id,
        indexes: [],
      });

      state = {
        books: adapter.setAll(
          [AClockworkOrange, AnimalFarm, TheGreatGatsby],
          adapter.getInitialState()
        ),
      };

      selectors = adapter.getSelectors((state: State) => state.books);
    });

    it('should create a selector for selecting the ids', () => {
      const ids = selectors.selectKeys(state);

      expect(ids).toEqual(state.books.keys);
    });

    it('should create a selector for selecting the entities', () => {
      const entities = selectors.selectEntities(state);

      expect(entities).toEqual(state.books.entities);
    });

    it('should create a selector for selecting the list of models', () => {
      const models = selectors.selectAll(state);

      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby]);
    });

    it('should create a selector for selecting the count of models', () => {
      const total = selectors.selectTotal(state);

      expect(total).toEqual(3);
    });
  });

  describe('Uncomposed Selectors', () => {
    type State = IDBEntityState<BookModel, never>;

    let adapter: IDBEntityAdapter<BookModel, never>;
    let selectors: IDBEntitySelectors<BookModel, never, State>;
    let state: State;

    beforeEach(() => {
      adapter = createIDBEntityAdapter({
        keySelector: (book: BookModel) => book.id,
        indexes: [],
      });

      state = adapter.setAll(
        [AClockworkOrange, AnimalFarm, TheGreatGatsby],
        adapter.getInitialState()
      );

      selectors = adapter.getSelectors();
    });

    it('should create a selector for selecting the ids', () => {
      const ids = selectors.selectKeys(state);

      expect(ids).toEqual(state.keys);
    });

    it('should create a selector for selecting the entities', () => {
      const entities = selectors.selectEntities(state);

      expect(entities).toEqual(state.entities);
    });

    it('should type single entity from Dictionary as entity type or undefined', () => {
      // MemoizedSelector acts like a type checker
      // noinspection JSUnusedLocalSymbols
      const singleEntity: MemoizedSelector<
        IDBEntityState<BookModel, never>,
        BookModel | undefined
      > = createSelector(selectors.selectEntities, (entities) => entities[0]);
    });

    it('should create a selector for selecting the list of models', () => {
      const models = selectors.selectAll(state);

      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby]);
    });

    it('should create a selector for selecting the count of models', () => {
      const total = selectors.selectTotal(state);

      expect(total).toEqual(3);
    });
  });
});
