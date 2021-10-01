import { createSelector } from '@ngrx/store';
import { EntityState, IDBEntitySelectors, Dictionary } from './models';

export function createSelectorsFactory<T>() {
  function getSelectors(): IDBEntitySelectors<T, EntityState<T>>;
  function getSelectors<V>(
    selectState: (state: V) => EntityState<T>
  ): IDBEntitySelectors<T, V>;
  function getSelectors(
    selectState?: (state: any) => EntityState<T>
  ): IDBEntitySelectors<T, any> {
    const selectKeys = (state: any) => state.keys;
    const selectEntities = (state: EntityState<T>) => state.entities;
    const selectAll = createSelector(
      selectKeys,
      selectEntities,
      (keys: T[], entities: Dictionary<T>): any =>
        keys.map((key: any) => (entities as any)[key])
    );

    const selectTotal = createSelector(selectKeys, (keys) => keys.length);

    const selectIndexKeys = (index: string) => (state: any) =>
      Object.keys(state.indexes[index]);

    const selectIndex = (index: string) => (state: any) => state.indexes[index];

    if (!selectState) {
      return {
        selectIndex,
        selectIndexKeys,
        selectKeys,
        selectEntities,
        selectAll,
        selectTotal,
      };
    }

    return {
      selectIndex: (index: string) =>
        createSelector(selectState, selectIndex(index)),
      selectIndexKeys: (index: string) =>
        createSelector(selectState, selectIndexKeys(index)),
      selectKeys: createSelector(selectState, selectKeys),
      selectEntities: createSelector(selectState, selectEntities),
      selectAll: createSelector(selectState, selectAll),
      selectTotal: createSelector(selectState, selectTotal),
    };
  }

  return { getSelectors };
}
