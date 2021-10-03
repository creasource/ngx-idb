export type KeySelectorStr<T> = (model: T) => string | undefined;
export type KeySelectorNum<T> = (model: T) => number | undefined;

export type KeySelector<T> =
  | KeySelectorStr<T>
  | KeySelectorNum<T>
  | string
  | string[];

export type Dictionary<T> = Record<any, T | undefined>;

// export abstract class Dictionary<T> {
//   [id: string]: T | undefined;
//   [id: number]: T | undefined;
// }

export interface UpdateStr<T> {
  key: string;
  changes: Partial<T>;
}

export interface UpdateNum<T> {
  key: number;
  changes: Partial<T>;
}

export type Update<T> = UpdateStr<T> | UpdateNum<T>;

export type Predicate<T> = (entity: T) => boolean;

export type EntityMap<T> = (entity: T) => T;

export interface EntityMapOneNum<T> {
  key: number;
  map: EntityMap<T>;
}

export interface EntityMapOneStr<T> {
  key: string;
  map: EntityMap<T>;
}

export type EntityMapOne<T> = EntityMapOneNum<T> | EntityMapOneStr<T>;

export interface IDBEntityState<T, Index extends string> {
  keys: string[] | number[];
  entities: Dictionary<T>;
  indexes: {
    [name in Index]: {
      keys: string[] | number[];
      entities: Dictionary<string[] | number[]>;
    };
  };
}

export type EntityIndexDefinition<T, Index extends string> =
  | {
      name: Index;
      multiEntry?: boolean;
      unique?: boolean;
      keySelector?: KeySelector<T>;
    }
  | Index;

export interface EntityDefinition<T, Index extends string> {
  autoIncrement?: boolean;
  keySelector?: KeySelector<T>;
  indexes: readonly EntityIndexDefinition<T, Index>[];
}

export interface IDBEntityStateAdapter<T, Index extends string> {
  addOne<S extends IDBEntityState<T, Index>>(entity: T, state: S): S;
  addMany<S extends IDBEntityState<T, Index>>(entities: T[], state: S): S;

  setAll<S extends IDBEntityState<T, Index>>(entities: T[], state: S): S;
  setOne<S extends IDBEntityState<T, Index>>(entity: T, state: S): S;
  setMany<S extends IDBEntityState<T, Index>>(entities: T[], state: S): S;

  removeOne<S extends IDBEntityState<T, Index>>(key: string, state: S): S;
  removeOne<S extends IDBEntityState<T, Index>>(key: number, state: S): S;

  removeMany<S extends IDBEntityState<T, Index>>(keys: string[], state: S): S;
  removeMany<S extends IDBEntityState<T, Index>>(keys: number[], state: S): S;
  removeMany<S extends IDBEntityState<T, Index>>(
    predicate: Predicate<T>,
    state: S
  ): S;

  removeAll<S extends IDBEntityState<T, Index>>(state: S): S;

  updateOne<S extends IDBEntityState<T, Index>>(update: Update<T>, state: S): S;
  updateMany<S extends IDBEntityState<T, Index>>(
    updates: Update<T>[],
    state: S
  ): S;

  upsertOne<S extends IDBEntityState<T, Index>>(entity: T, state: S): S;
  upsertMany<S extends IDBEntityState<T, Index>>(entities: T[], state: S): S;

  mapOne<S extends IDBEntityState<T, Index>>(map: EntityMapOne<T>, state: S): S;
  map<S extends IDBEntityState<T, Index>>(map: EntityMap<T>, state: S): S;
}

export interface IDBEntitySelectors<T, Index extends string, V> {
  selectIndexKeys: (index: Index) => (state: V) => string[] | number[];
  selectIndexEntities: (
    index: Index
  ) => (state: V) => Dictionary<string[] | number[]>;
  selectIndexAll: (index: Index) => (state: V) => T[];
  selectKeys: (state: V) => string[] | number[];
  selectEntities: (state: V) => Dictionary<T>;
  selectAll: (state: V) => T[];
  selectTotal: (state: V) => number;
}

export interface IDBEntityAdapter<T, Index extends string>
  extends IDBEntityStateAdapter<T, Index> {
  keySelector: KeySelector<T> | undefined;
  getInitialState(): IDBEntityState<T, Index>;
  getInitialState<S extends object>(state: S): IDBEntityState<T, Index> & S;
  getSelectors(): IDBEntitySelectors<T, Index, IDBEntityState<T, Index>>;
  getSelectors<V>(
    selectState: (state: V) => IDBEntityState<T, Index>
  ): IDBEntitySelectors<T, Index, V>;
}
