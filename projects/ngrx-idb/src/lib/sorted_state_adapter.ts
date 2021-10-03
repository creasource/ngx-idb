import {
  EntityIndexDefinition,
  EntityMap,
  EntityMapOneNum,
  EntityMapOneStr,
  EntityStateAdapter,
  IDBEntityState,
  KeySelector,
  Predicate,
  Update,
} from './models';
import { createStateOperator, DidMutate } from './state_adapter';
import { getKey, selectKeyValue } from './utils';

export function createSortedStateAdapter<T>(
  getInitialState: (state?: any) => any,
  autoIncrement: boolean,
  selectKey: KeySelector<T> | undefined,
  indexes: EntityIndexDefinition<T>[]
): EntityStateAdapter<T>;
export function createSortedStateAdapter<T>(
  getInitialState: (state?: any) => any,
  autoIncrement: boolean,
  selectKey: KeySelector<T> | undefined,
  indexes: EntityIndexDefinition<T>[]
): any {
  type R = IDBEntityState<T>;

  function* keyGenerator() {
    let index = 1;
    while (true) yield index++;
  }

  const keyGen = keyGenerator();

  function getIndexDefinition(index: EntityIndexDefinition<T>) {
    if (typeof index === 'string') {
      return {
        name: index,
        keySelector: (model: T) => (model as any)[index],
      };
    }
    return {
      name: index.name,
      keySelector:
        index.keySelector ?? ((model: T) => (model as any)[index.name]),
    };
  }

  const indexesDefs = indexes.map(getIndexDefinition);

  function removeAll<S extends R>(state: S): S {
    return Object.assign({}, state, getInitialState());
  }

  function deleteEntitiesFromIndexes(
    toDelete: string[] | number[],
    state: R
  ): void;
  function deleteEntitiesFromIndexes(toDelete: any[], state: any): void {
    indexesDefs.forEach((def) => {
      const index = state.indexes[def.name];

      const { keys, entities } = index;

      const obsoleteKeys: any[] = [];

      keys.forEach((key: any) => {
        entities[key] = entities[key].filter(
          (primaryKey: any) => !toDelete.includes(primaryKey)
        );
        if (entities[key].length === 0) {
          delete entities[key];
          obsoleteKeys.push(key);
        }
      });

      index.keys = keys.filter((k: any) => !obsoleteKeys.includes(k));
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

      deleteEntitiesFromIndexes(toDelete, state);
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
    const { entities, keys, indexes } = getInitialState();
    state.entities = entities;
    state.keys = keys;
    state.indexes = indexes;

    addManyMutably(models, state);

    return DidMutate.Both;
  }

  function setOneMutably(entity: T, state: R): DidMutate;
  function setOneMutably(entity: any, state: any): DidMutate {
    const key = selectKey ? selectKeyValue(entity, selectKey) : -1;
    if (key in state.entities) {
      state.keys = state.keys.filter((val: string | number) => val !== key);
      deleteEntitiesFromIndexes([key], state);
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
      const keysToDelete: any[] = [];
      state.keys = (state.keys as any[]).filter((key: any, index: number) => {
        if (key in state.entities) {
          return true;
        } else {
          updatedIndexes.push(index);
          keysToDelete.push(key);
          return false;
        }
      });

      deleteEntitiesFromIndexes(keysToDelete, state);

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

  function mergeKeys(
    modelKeys: any[],
    indexKeys: any[],
    uniq: boolean = false
  ) {
    const keys: any[] = [];

    let i = 0;
    let j = 0;

    while (i < modelKeys.length && j < indexKeys.length) {
      const modelKey = modelKeys[i];
      const entityKey = indexKeys[j];

      if (uniq && modelKey === entityKey) {
        i++;
        continue;
      }

      if ([modelKey, entityKey].sort()[0] === modelKey) {
        keys.push(modelKey);
        i++;
      } else {
        keys.push(entityKey);
        j++;
      }
    }

    return i < modelKeys.length
      ? keys.concat(modelKeys.slice(i))
      : keys.concat(indexKeys.slice(j));
  }

  function merge(models: T[], state: R): void;
  function merge(models: any[], state: any): void {
    if (models.length === 0) {
      return;
    }

    const modelWithKeys = models.map((model) => ({
      key: (selectKey && getKey(model, selectKey)) || keyGen.next().value,
      value: model,
    }));

    if (selectKey) {
      modelWithKeys.sort((a, b) =>
        a.key === b.key ? 0 : a.key > b.key ? 1 : -1
      );
    }

    state.keys = mergeKeys(
      modelWithKeys.map(({ key }) => key),
      state.keys
    );

    modelWithKeys.forEach(({ key, value }) => {
      state.entities[key] = value;
    });

    indexes.forEach((def) => {
      const { name, keySelector } = getIndexDefinition(def);
      const index = state.indexes[name];

      const modelWithIndexKeys = modelWithKeys
        .map(({ key, value }) => ({
          key,
          value,
          indexKey: getKey(value, keySelector),
        }))
        .filter((o) => o.indexKey !== undefined)
        .sort((o1, o2) =>
          o1.indexKey === o2.indexKey ? 0 : o1.indexKey > o2.indexKey ? 1 : -1
        );

      if (modelWithIndexKeys.length === 0) {
        return;
      }

      const uniq = (val: any, index: number, array: any[]) =>
        array.indexOf(val) === index;

      index.keys = mergeKeys(
        modelWithIndexKeys.map(({ indexKey }) => indexKey).filter(uniq),
        index.keys,
        true
      );

      modelWithIndexKeys.forEach(({ indexKey, key }) => {
        index.entities[indexKey] = mergeKeys(
          [key],
          index.entities[indexKey] ?? [],
          true
        );
      });
    });
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
