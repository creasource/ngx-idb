import {
  EntityIndexesDefinition,
  EntityMap,
  EntityMapOneNum,
  EntityMapOneStr,
  EntityState,
  EntityStateAdapter,
  KeySelector,
  Predicate,
  Update,
} from './models';
import { createStateOperator, DidMutate } from './state_adapter';
import { getKey, getSort, selectKeyValue } from './utils';

export function createSortedStateAdapter<T>(
  autoIncrement: boolean,
  selectKey: KeySelector<T> | undefined,
  indexes: EntityIndexesDefinition<T>
): EntityStateAdapter<T>;
export function createSortedStateAdapter<T>(
  autoIncrement: boolean,
  selectKey: KeySelector<T> | undefined,
  indexes: EntityIndexesDefinition<T>
): any {
  type R = EntityState<T>;

  function removeAll<S extends R>(state: S): S;
  function removeAll<S extends R>(state: any): S {
    return Object.assign({}, state, {
      keys: [],
      entities: {},
      indexes: {},
    });
  }

  function removeOneMutably(key: string | number, state: R): DidMutate;
  function removeOneMutably(key: any, state: any): DidMutate {
    return removeManyMutably([key], state);
  }

  function removeManyMutably(keys: string[] | number[], state: R): DidMutate;
  function removeManyMutably(predicate: Predicate<T>, state: R): DidMutate;
  function removeManyMutably(
    keysOrPredicate: any[] | Predicate<T>,
    state: any
  ): DidMutate {
    const keys =
      keysOrPredicate instanceof Array
        ? keysOrPredicate
        : state.keys.filter((key: any) => keysOrPredicate(state.entities[key]));

    const toDelete = keys.filter((key: any) => key in state.entities);

    toDelete.forEach((key: any) => delete state.entities[key]);

    const didMutate = toDelete.length > 0;

    if (didMutate) {
      state.keys = state.keys.filter((id: any) => id in state.entities);

      for (const index in indexes) {
        state.indexes[index] = state.indexes[index].filter(
          (m: any) => m.primaryKey in toDelete
        );
      }
    }

    return didMutate ? DidMutate.Both : DidMutate.None;
  }

  function addOneMutably(entity: T, state: R): DidMutate;
  function addOneMutably(entity: any, state: any): DidMutate {
    return addManyMutably([entity], state);
  }

  function addManyMutably(newModels: T[], state: R): DidMutate;
  function addManyMutably(newModels: any[], state: any): DidMutate {
    const models = selectKey
      ? newModels.filter(
          (model) => !(selectKeyValue(model, selectKey) in state.entities)
        )
      : newModels;

    if (models.length === 0) {
      return DidMutate.None;
    } else {
      merge(models, state);
      return DidMutate.Both;
    }
  }

  function setAllMutably(models: T[], state: R): DidMutate;
  function setAllMutably(models: any[], state: any): DidMutate {
    state.entities = {};
    state.keys = [];
    state.indexes = {};

    addManyMutably(models, state);

    return DidMutate.Both;
  }

  function setOneMutably(entity: T, state: R): DidMutate;
  function setOneMutably(entity: any, state: any): DidMutate {
    const key = selectKey ? selectKeyValue(entity, selectKey) : -1;
    if (key in state.entities) {
      state.keys = state.keys.filter((val: string | number) => val !== key);
      merge([entity], state);
      return DidMutate.Both;
    } else {
      return addOneMutably(entity, state);
    }
  }

  function setManyMutably(entities: T[], state: R): DidMutate;
  function setManyMutably(entities: any[], state: any): DidMutate {
    const didMutateSetOne = entities.map((entity) =>
      setOneMutably(entity, state)
    );

    switch (true) {
      case didMutateSetOne.some((didMutate) => didMutate === DidMutate.Both):
        return DidMutate.Both;
      case didMutateSetOne.some(
        (didMutate) => didMutate === DidMutate.EntitiesOnly
      ):
        return DidMutate.EntitiesOnly;
      default:
        return DidMutate.None;
    }
  }

  function updateOneMutably(update: Update<T>, state: R): DidMutate;
  function updateOneMutably(update: any, state: any): DidMutate {
    return updateManyMutably([update], state);
  }

  function takeUpdatedModel(models: T[], update: Update<T>, state: R): boolean;
  function takeUpdatedModel(models: any[], update: any, state: any): boolean {
    if (!(update.key in state.entities)) {
      return false;
    }

    const original = state.entities[update.key];
    const updated = Object.assign({}, original, update.changes);
    const newKey = selectKey ? selectKeyValue(updated, selectKey) : update.key;

    delete state.entities[update.key];

    models.push(updated);

    return newKey !== update.key;
  }

  function updateManyMutably(updates: Update<T>[], state: R): DidMutate;
  function updateManyMutably(updates: any[], state: any): DidMutate {
    const models: T[] = [];

    const didMutateKeys =
      updates.filter((update) => takeUpdatedModel(models, update, state))
        .length > 0;

    if (models.length === 0) {
      return DidMutate.None;
    } else {
      const originalKeys = state.keys;
      const updatedIndexes: any[] = [];
      state.keys = state.keys.filter((key: any, index: number) => {
        if (key in state.entities) {
          return true;
        } else {
          updatedIndexes.push(index);
          return false;
        }
      });

      merge(models, state);

      if (
        !didMutateKeys &&
        updatedIndexes.every((i: number) => state.keys[i] === originalKeys[i])
      ) {
        return DidMutate.EntitiesOnly;
      } else {
        return DidMutate.Both;
      }
    }
  }

  function mapMutably(map: EntityMap<T>, state: R): DidMutate;
  function mapMutably(updatesOrMap: any, state: any): DidMutate {
    const updates: Update<T>[] = state.keys.reduce(
      (changes: any[], key: string | number) => {
        const change = updatesOrMap(state.entities[key]);
        if (change !== state.entities[key]) {
          changes.push({ key, changes: change });
        }
        return changes;
      },
      []
    );

    return updateManyMutably(updates, state);
  }

  function mapOneMutably(map: EntityMapOneNum<T>, state: R): DidMutate;
  function mapOneMutably(map: EntityMapOneStr<T>, state: R): DidMutate;
  function mapOneMutably({ map, key }: any, state: any): DidMutate {
    const entity = state.entities[key];
    if (!entity) {
      return DidMutate.None;
    }

    const updatedEntity = map(entity);
    return updateOneMutably(
      {
        key: key,
        changes: updatedEntity,
      },
      state
    );
  }

  function upsertOneMutably(entity: T, state: R): DidMutate;
  function upsertOneMutably(entity: any, state: any): DidMutate {
    return upsertManyMutably([entity], state);
  }

  function upsertManyMutably(entities: T[], state: R): DidMutate;
  function upsertManyMutably(entities: any[], state: any): DidMutate {
    const added: any[] = [];
    const updated: any[] = [];

    for (const entity of entities) {
      const key = selectKey ? selectKeyValue(entity, selectKey) : -1;
      if (key in state.entities) {
        updated.push({ key, changes: entity });
      } else {
        added.push(entity);
      }
    }

    const didMutateByUpdated = updateManyMutably(updated, state);
    const didMutateByAdded = addManyMutably(added, state);

    switch (true) {
      case didMutateByAdded === DidMutate.None &&
        didMutateByUpdated === DidMutate.None:
        return DidMutate.None;
      case didMutateByAdded === DidMutate.Both ||
        didMutateByUpdated === DidMutate.Both:
        return DidMutate.Both;
      default:
        return DidMutate.EntitiesOnly;
    }
  }

  function merge(models: T[], state: R): void;
  function merge(models: any[], state: any): void {
    if (models.length === 0) {
      return;
    }

    const sort =
      selectKey &&
      getSort(
        models.find((model) => getKey(model, selectKey) !== undefined),
        selectKey
      );

    if (sort) {
      models.sort(sort);
    }

    const keys: any[] = [];
    const generatedKeys: any[] = [];

    let i = 0;
    let j = 0;

    while (i < models.length && j < state.keys.length) {
      const model = models[i];
      let modelKey: any;
      if (selectKey) {
        modelKey = selectKeyValue(model, selectKey);
      } else {
        modelKey = 0; // TODO
        generatedKeys.push(modelKey);
      }

      const entityKey = state.keys[j];
      const entity = state.entities[entityKey];

      if (sort && sort(model, entity) <= 0) {
        keys.push(modelKey);
        i++;
      } else {
        keys.push(entityKey);
        j++;
      }
    }

    if (i < models.length) {
      state.keys = keys.concat(
        selectKey
          ? models.slice(i).map((model) => getKey(model, selectKey))
          : generatedKeys
      );
    } else {
      state.keys = keys.concat(state.keys.slice(j));
    }

    if (selectKey) {
      models.forEach((model) => {
        state.entities[getKey(model, selectKey)] = model;
      });
    } else {
      generatedKeys.forEach((key, i) => (state.entities[key] = models[i]));
    }

    for (const index in indexes) {
      const keySelector = indexes[index].keySelector;
      const sort = getSort(
        models.find((model) => getKey(model, keySelector) !== undefined),
        keySelector
      );
      const indexObj = { ...state.indexes[index] } ?? {};
      const sortedModels = [...models].sort(sort);

      // const keys: any[] = [];
      //
      // let i = 0;
      // let j = 0;
      //
      // while (i < models.length && j < state.keys.length) {
      //   const model = models[i];
      //   let modelKey = selectKeyValue(model, keySelector);
      //
      //   const entityKey = state.keys[j];
      //   const entity = state.entities[entityKey];
      //
      //   if (sort && sort(model, entity) <= 0) {
      //     keys.push(modelKey);
      //     i++;
      //   } else {
      //     keys.push(entityKey);
      //     j++;
      //   }
      // }

      sortedModels
        .map((model, i) => ({
          key: getKey(model, keySelector),
          model,
          index: i,
        }))
        .filter((o) => o.key !== undefined)
        .forEach((o) => {
          const primaryKeys: any[] = [...(indexObj[o.key] ?? [])];
          selectKey
            ? primaryKeys.push(getKey(o.model, selectKey))
            : primaryKeys.push(generatedKeys[o.index]);
          indexObj[o.key] = primaryKeys;
        });
      delete state.indexes[index];
      state.indexes[index] = indexObj;
    }
  }

  return {
    removeAll,
    removeOne: createStateOperator(removeOneMutably),
    removeMany: createStateOperator(removeManyMutably),
    addOne: createStateOperator(addOneMutably),
    updateOne: createStateOperator(updateOneMutably),
    upsertOne: createStateOperator(upsertOneMutably),
    setAll: createStateOperator(setAllMutably),
    setOne: createStateOperator(setOneMutably),
    setMany: createStateOperator(setManyMutably),
    addMany: createStateOperator(addManyMutably),
    updateMany: createStateOperator(updateManyMutably),
    upsertMany: createStateOperator(upsertManyMutably),
    map: createStateOperator(mapMutably),
    mapOne: createStateOperator(mapOneMutably),
  };
}
