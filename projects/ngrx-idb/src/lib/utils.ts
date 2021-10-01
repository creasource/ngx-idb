import { isDevMode } from '@angular/core';
import { Comparer, KeySelector } from './models';

export function getKey<T>(entity: T, selectKey: KeySelector<T>) {
  return typeof selectKey === 'string'
    ? (entity as any)[selectKey]
    : selectKey instanceof Array
    ? selectKey.reduce(
        (result, path) => entity && (entity as any)[path],
        entity
      )
    : selectKey(entity);
}

export function selectKeyValue<T>(entity: T, selectKey: KeySelector<T>) {
  const key = getKey(entity, selectKey);

  if (isDevMode() && key === undefined) {
    console.warn(
      '@creasource/ngrx-idb: The entity passed to the `selectKey` implementation returned undefined.',
      'You should probably provide your own `selectKey` implementation.',
      'The entity that was passed:',
      entity,
      'The `selectId` implementation:',
      selectKey.toString()
    );
  }

  return key;
}

export function getSort<T>(
  entity: T,
  selectKey: KeySelector<T>
): Comparer<T> | undefined {
  if (entity === undefined) {
    return undefined;
  }

  const key = getKey(entity, selectKey);

  if (key === undefined) {
    return undefined;
  }

  if (typeof key === 'string') {
    return (a: T, b: T) => {
      if (getKey(a, selectKey) === undefined) console.error(a, selectKey);
      return getKey(a, selectKey).localeCompare(getKey(b, selectKey)) ?? 1;
    };
  }
  if (typeof key === 'number') {
    return (a: T, b: T) => getKey(a, selectKey) - getKey(b, selectKey);
  }

  throw new Error('invalid');
}
