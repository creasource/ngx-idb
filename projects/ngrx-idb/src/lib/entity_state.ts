import { EntityIndexDefinition, IDBEntityState } from './models';

export function getInitialEntityState<V>(): IDBEntityState<V> {
  return {
    keys: [],
    entities: {},
    indexes: {},
  };
}

export function createInitialStateFactory<V>(
  indexes: EntityIndexDefinition<V>[]
) {
  function getInitialState(): IDBEntityState<V>;
  function getInitialState<S extends object>(
    additionalState: S
  ): IDBEntityState<V> & S;
  function getInitialState(additionalState: any = {}): any {
    const indexesNames = indexes.map((def) =>
      typeof def === 'string' ? def : def.name
    );
    const obj = Object.assign(getInitialEntityState(), additionalState);
    indexesNames.forEach(
      (name) =>
        (obj.indexes[name] = {
          keys: [],
          entities: {},
        })
    );
    return obj;
  }

  return { getInitialState };
}
