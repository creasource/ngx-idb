import { EntityState, EntityStateAdapter } from '../src/lib/models';
import { createIDBEntityAdapter } from '../src/lib';
import {
  AClockworkOrange,
  AnimalFarm,
  BookModel,
  TheGreatGatsby,
} from './fixtures/book';

describe('Sorted State Adapter', () => {
  let adapter: EntityStateAdapter<BookModel>;
  let state: EntityState<BookModel>;

  beforeAll(() => {
    Object.defineProperty(Array.prototype, 'unwantedField', {
      enumerable: true,
      configurable: true,
      value: 'This should not appear anywhere',
    });
  });

  afterAll(() => {
    delete (Array.prototype as any).unwantedField;
  });

  beforeEach(() => {
    adapter = createIDBEntityAdapter({
      keySelector: (book: BookModel) => book.id,
      indexes: {},
    });

    state = { keys: [], entities: {}, indexes: {} };
  });

  it('should let you add one entity to the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    expect(withOneEntity).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
      indexes: {},
    });
  });

  it('should not change state if you attempt to re-add an entity', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const readded = adapter.addOne(TheGreatGatsby, withOneEntity);

    expect(readded).toBe(withOneEntity);
  });

  it('should let you add many entities to the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withManyMore = adapter.addMany(
      [AClockworkOrange, AnimalFarm],
      withOneEntity
    );

    expect(withManyMore).toEqual({
      keys: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
      indexes: {},
    });
  });

  it('should let you set many entities in the state', () => {
    const firstChange = { title: 'First Change' };
    const withMany = adapter.setAll([TheGreatGatsby], state);

    const withUpserts = adapter.setMany(
      [{ ...TheGreatGatsby, ...firstChange }, AClockworkOrange],
      withMany
    );

    expect(withUpserts).toEqual({
      keys: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
      indexes: {},
    });
  });

  it('should remove existing and add new ones on setAll', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withAll = adapter.setAll(
      [AClockworkOrange, AnimalFarm],
      withOneEntity
    );

    expect(withAll).toEqual({
      keys: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
      indexes: {},
    });
  });

  it('should let you add remove an entity from the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withoutOne = adapter.removeOne(TheGreatGatsby.id, state);

    expect(withoutOne).toEqual({
      keys: [],
      entities: {},
      indexes: {},
    });
  });

  it('should let you remove many entities by id from the state', () => {
    const withAll = adapter.setAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withoutMany = adapter.removeMany(
      [TheGreatGatsby.id, AClockworkOrange.id],
      withAll
    );

    expect(withoutMany).toEqual({
      keys: [AnimalFarm.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm,
      },
      indexes: {},
    });
  });

  it('should let you remove many entities by a predicate from the state', () => {
    const withAll = adapter.setAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withoutMany = adapter.removeMany(
      (p) => p.id.startsWith('a'),
      withAll
    );

    expect(withoutMany).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
      indexes: {},
    });
  });

  it('should let you remove all entities from the state', () => {
    const withAll = adapter.setAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withoutAll = adapter.removeAll(withAll);

    expect(withoutAll).toEqual({
      keys: [],
      entities: {},
      indexes: {},
    });
  });

  it('should let you update an entity in the state', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
      indexes: {},
    });
  });

  it('should not change state if you attempt to update an entity that has not been added', () => {
    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes: { title: 'A New Title' },
      },
      state
    );

    expect(withUpdates).toBe(state);
  });

  it('should not change ids state if you attempt to update an entity that does not impact sorting', () => {
    const withAll = adapter.setAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );
    const changes = { title: 'The Great Gatsby II' };

    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes,
      },
      withAll
    );

    expect(withAll.keys).toBe(withUpdates.keys);
  });

  it('should let you update the id of entity', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { id: 'A New Id' };

    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      keys: [changes.id],
      entities: {
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
      indexes: {},
    });
  });

  it.skip('should resort correctly if same id but sort key update', () => {
    const withAll = adapter.setAll(
      [TheGreatGatsby, AnimalFarm, AClockworkOrange],
      state
    );
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes,
      },
      withAll
    );

    expect(withUpdates).toEqual({
      keys: [AClockworkOrange.id, TheGreatGatsby.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
        [AnimalFarm.id]: AnimalFarm,
      },
      indexes: {},
    });
  });

  it('should resort correctly if the id and sort key update', () => {
    const withOne = adapter.setAll(
      [TheGreatGatsby, AnimalFarm, AClockworkOrange],
      state
    );
    const changes = { id: 'A New Id', title: AnimalFarm.title };

    const withUpdates = adapter.updateOne(
      {
        key: TheGreatGatsby.id,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      keys: [changes.id, AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
        [AnimalFarm.id]: AnimalFarm,
      },
      indexes: {},
    });
  });

  it('should let you update many entities by id in the state', () => {
    const firstChange = { title: 'Zack' };
    const secondChange = { title: 'Aaron' };
    const withMany = adapter.setAll([TheGreatGatsby, AClockworkOrange], state);

    const withUpdates = adapter.updateMany(
      [
        { key: TheGreatGatsby.id, changes: firstChange },
        { key: AClockworkOrange.id, changes: secondChange },
      ],
      withMany
    );

    expect(withUpdates).toEqual({
      keys: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange,
        },
      },
      indexes: {},
    });
  });

  it('should let you map over entities in the state', () => {
    const firstChange = { ...TheGreatGatsby, title: 'First change' };
    const secondChange = { ...AClockworkOrange, title: 'Second change' };

    const withMany = adapter.setAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withUpdates = adapter.map(
      (book) =>
        book.title === TheGreatGatsby.title
          ? firstChange
          : book.title === AClockworkOrange.title
          ? secondChange
          : book,
      withMany
    );

    expect(withUpdates).toEqual({
      keys: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange,
        },
        [AnimalFarm.id]: AnimalFarm,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
      },
      indexes: {},
    });
  });

  it('should let you map over one entity by id in the state', () => {
    const withMany = adapter.setAll([TheGreatGatsby, AClockworkOrange], state);

    const withUpdates = adapter.mapOne(
      {
        key: TheGreatGatsby.id,
        map: (entity) => ({ ...entity, title: 'Updated ' + entity.title }),
      },
      withMany
    );

    expect(withUpdates).toEqual({
      keys: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          title: 'Updated ' + TheGreatGatsby.title,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
      indexes: {},
    });
  });

  it('should let you add one entity to the state with upsert()', () => {
    const withOneEntity = adapter.upsertOne(TheGreatGatsby, state);
    expect(withOneEntity).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
      indexes: {},
    });
  });

  it('should let you update an entity in the state with upsert()', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.upsertOne(
      { ...TheGreatGatsby, ...changes },
      withOne
    );
    expect(withUpdates).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
      indexes: {},
    });
  });

  it('should let you upsert many entities in the state', () => {
    const firstChange = { title: 'Zack' };
    const withMany = adapter.setAll([TheGreatGatsby], state);

    const withUpserts = adapter.upsertMany(
      [{ ...TheGreatGatsby, ...firstChange }, AClockworkOrange],
      withMany
    );

    expect(withUpserts).toEqual({
      keys: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
      indexes: {},
    });
  });

  it('should let you add one entity to the state with setOne()', () => {
    const withOneEntity = adapter.setOne(TheGreatGatsby, state);
    expect(withOneEntity).toEqual({
      keys: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
      indexes: {},
    });
  });

  it('should let you replace an entity in the state with setOne()', () => {
    const withMany = adapter.addOne(
      TheGreatGatsby,
      adapter.addOne(AnimalFarm, adapter.addOne(AClockworkOrange, state))
    );
    const updatedBook = {
      id: TheGreatGatsby.id,
      title: 'A New Hope',
      /* description property is not provided */
    };

    const withUpdates = adapter.setOne(updatedBook, withMany);
    expect(withUpdates).toEqual({
      keys: [AClockworkOrange.id, AnimalFarm.id, updatedBook.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
        [updatedBook.id]: updatedBook,
      },
      indexes: {},
    });
  });
});
