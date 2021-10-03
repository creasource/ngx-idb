import { createSelector } from '@ngrx/store';
import { IDBEntityState, IDBEntitySelectors, Dictionary } from './models';

export function createSelectorsFactory<T>() {
  function getSelectors(): IDBEntitySelectors<T, IDBEntityState<T>>;
  function getSelectors<V>(
    selectState: (state: V) => IDBEntityState<T>
  ): IDBEntitySelectors<T, V>;
  function getSelectors(
    selectState?: (state: any) => IDBEntityState<T>
  ): IDBEntitySelectors<T, any> {
    const selectKeys = (state: IDBEntityState<T>) => state.keys;
    const selectEntities = (state: IDBEntityState<T>) => state.entities;
    const selectAll = createSelector(
      selectKeys,
      selectEntities,
      (keys: string[] | number[], entities: Dictionary<T>): any =>
        keys.map((key) => entities[key])
    );

    const selectTotal = createSelector(selectKeys, (keys) => keys.length);

    const selectIndexKeys = (index: string) => (state: IDBEntityState<T>) =>
      state.indexes[index].keys;

    const selectIndexEntities = (index: string) => (state: IDBEntityState<T>) =>
      state.indexes[index].entities;

    const selectIndexAll = (index: string) =>
      createSelector(
        selectIndexKeys(index),
        selectIndexEntities(index),
        selectEntities,
        (keys, index, entities) =>
          keys
            .map((key) => index[key] as [])
            .reduce((acc, curr) => [...acc, ...curr] as [], [])
            .map((key) => entities[key] as T)
      );

    if (!selectState) {
      return {
        selectIndexKeys,
        selectIndexEntities,
        selectIndexAll,
        selectKeys,
        selectEntities,
        selectAll,
        selectTotal,
      };
    }

    return {
      selectIndexKeys: (index: string) =>
        createSelector(selectState, selectIndexKeys(index)),
      selectIndexEntities: (index: string) =>
        createSelector(selectState, selectIndexEntities(index)),
      selectIndexAll: (index: string) =>
        createSelector(selectState, selectIndexAll(index)),
      selectKeys: createSelector(selectState, selectKeys),
      selectEntities: createSelector(selectState, selectEntities),
      selectAll: createSelector(selectState, selectAll),
      selectTotal: createSelector(selectState, selectTotal),
    };
  }

  return { getSelectors };
}
