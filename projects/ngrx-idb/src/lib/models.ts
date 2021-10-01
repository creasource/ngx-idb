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

export type EntityIndex = {
  [k: string]: string[] | number[];
  [k: number]: string[] | number[];
};

export interface EntityState<T> {
  keys: string[] | number[];
  entities: Dictionary<T>;
  indexes: {
    [name: string]: EntityIndex;
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
  addOne<S extends EntityState<T>>(entity: T, state: S): S;
  addMany<S extends EntityState<T>>(entities: T[], state: S): S;

  setAll<S extends EntityState<T>>(entities: T[], state: S): S;
  setOne<S extends EntityState<T>>(entity: T, state: S): S;
  setMany<S extends EntityState<T>>(entities: T[], state: S): S;

  removeOne<S extends EntityState<T>>(key: string, state: S): S;
  removeOne<S extends EntityState<T>>(key: number, state: S): S;

  removeMany<S extends EntityState<T>>(keys: string[], state: S): S;
  removeMany<S extends EntityState<T>>(keys: number[], state: S): S;
  removeMany<S extends EntityState<T>>(predicate: Predicate<T>, state: S): S;

  removeAll<S extends EntityState<T>>(state: S): S;

  updateOne<S extends EntityState<T>>(update: Update<T>, state: S): S;
  updateMany<S extends EntityState<T>>(updates: Update<T>[], state: S): S;

  upsertOne<S extends EntityState<T>>(entity: T, state: S): S;
  upsertMany<S extends EntityState<T>>(entities: T[], state: S): S;

  mapOne<S extends EntityState<T>>(map: EntityMapOne<T>, state: S): S;
  map<S extends EntityState<T>>(map: EntityMap<T>, state: S): S;
}

export interface IDBEntitySelectors<T, V> {
  selectIndexKeys: (index: string) => (state: V) => string[] | number[];
  selectIndex: (index: string) => (state: V) => EntityIndex | undefined;
  selectKeys: (state: V) => string[] | number[];
  selectEntities: (state: V) => Dictionary<T>;
  selectAll: (state: V) => T[];
  selectTotal: (state: V) => number;
}

export interface IDBEntityAdapter<T> extends EntityStateAdapter<T> {
  keySelector: KeySelector<T> | undefined;
  getInitialState(): EntityState<T>;
  getInitialState<S extends object>(state: S): EntityState<T> & S;
  getSelectors(): IDBEntitySelectors<T, EntityState<T>>;
  getSelectors<V>(
    selectState: (state: V) => EntityState<T>
  ): IDBEntitySelectors<T, V>;
}
