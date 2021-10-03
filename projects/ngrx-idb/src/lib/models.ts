export type Comparer<T> = (a: T, b: T) => number;

export type KeySelectorStr<T> = (model: T) => string | undefined;
export type KeySelectorNum<T> = (model: T) => number | undefined;

export type KeySelector<T> =
  | KeySelectorStr<T>
  | KeySelectorNum<T>
  | string
  | string[];

export interface DictionaryNum<T> {
  [id: number]: T | undefined;
}

export abstract class Dictionary<T> implements DictionaryNum<T> {
  [id: string]: T | undefined;
}

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

export interface IDBEntityState<T> {
  keys: string[] | number[];
  entities: Dictionary<T>;
  indexes: {
    [name: string]: {
      keys: string[] | number[];
      entities: Dictionary<string[] | number[]>;
    };
  };
}

export type EntityIndexDefinition<T> =
  | {
      name: string;
      multiEntry?: boolean;
      unique?: boolean;
      keySelector?: KeySelector<T>;
    }
  | string;

export interface EntityDefinition<T> {
  autoIncrement?: boolean;
  keySelector?: KeySelector<T>;
  indexes: EntityIndexDefinition<T>[];
}

export interface EntityStateAdapter<T> {
  addOne<S extends IDBEntityState<T>>(entity: T, state: S): S;
  addMany<S extends IDBEntityState<T>>(entities: T[], state: S): S;

  setAll<S extends IDBEntityState<T>>(entities: T[], state: S): S;
  setOne<S extends IDBEntityState<T>>(entity: T, state: S): S;
  setMany<S extends IDBEntityState<T>>(entities: T[], state: S): S;

  removeOne<S extends IDBEntityState<T>>(key: string, state: S): S;
  removeOne<S extends IDBEntityState<T>>(key: number, state: S): S;

  removeMany<S extends IDBEntityState<T>>(keys: string[], state: S): S;
  removeMany<S extends IDBEntityState<T>>(keys: number[], state: S): S;
  removeMany<S extends IDBEntityState<T>>(predicate: Predicate<T>, state: S): S;

  removeAll<S extends IDBEntityState<T>>(state: S): S;

  updateOne<S extends IDBEntityState<T>>(update: Update<T>, state: S): S;
  updateMany<S extends IDBEntityState<T>>(updates: Update<T>[], state: S): S;

  upsertOne<S extends IDBEntityState<T>>(entity: T, state: S): S;
  upsertMany<S extends IDBEntityState<T>>(entities: T[], state: S): S;

  mapOne<S extends IDBEntityState<T>>(map: EntityMapOne<T>, state: S): S;
  map<S extends IDBEntityState<T>>(map: EntityMap<T>, state: S): S;
}

export interface IDBEntitySelectors<T, V> {
  selectIndexKeys: (index: string) => (state: V) => string[] | number[];
  selectIndexEntities: (
    index: string
  ) => (state: V) => Dictionary<string[] | number[]>;
  selectIndexAll: (index: string) => (state: V) => T[];
  selectKeys: (state: V) => string[] | number[];
  selectEntities: (state: V) => Dictionary<T>;
  selectAll: (state: V) => T[];
  selectTotal: (state: V) => number;
}

export interface IDBEntityAdapter<T> extends EntityStateAdapter<T> {
  keySelector: KeySelector<T> | undefined;
  getInitialState(): IDBEntityState<T>;
  getInitialState<S extends object>(state: S): IDBEntityState<T> & S;
  getSelectors(): IDBEntitySelectors<T, IDBEntityState<T>>;
  getSelectors<V>(
    selectState: (state: V) => IDBEntityState<T>
  ): IDBEntitySelectors<T, V>;
}
