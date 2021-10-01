import { EntityIndexesDefinition, EntityState } from './models';

export function getInitialEntityState<V>(): EntityState<V> {
  return {
    keys: [],
    entities: {},
    indexes: {},
  };
}

export function createInitialStateFactory<V>(
  indexes: EntityIndexesDefinition<V>
) {
  function getInitialState(): EntityState<V>;
  function getInitialState<S extends object>(
    additionalState: S
  ): EntityState<V> & S;
  function getInitialState(additionalState: any = {}): any {
    const indexesNames = Object.keys(indexes);
    const obj = Object.assign(getInitialEntityState(), additionalState);
    indexesNames.forEach((name) => (obj.indexes[name] = []));
    return obj;
  }

  return { getInitialState };
}
