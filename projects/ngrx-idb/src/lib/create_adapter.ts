import { EntityDefinition, IDBEntityAdapter } from './models';
import { createInitialStateFactory } from './entity_state';
import { createSelectorsFactory } from './state_selectors';
import { createSortedStateAdapter } from './sorted_state_adapter';

export function createIDBEntityAdapter<T>(
  options: EntityDefinition<T>
): IDBEntityAdapter<T> {
  const { autoIncrement, keySelector, indexes }: EntityDefinition<T> = {
    ...options,
  };

  const stateFactory = createInitialStateFactory<T>(indexes);
  const selectorsFactory = createSelectorsFactory<T>();
  const stateAdapter = createSortedStateAdapter(
    autoIncrement ?? false,
    keySelector,
    indexes
  );

  return {
    keySelector,
    ...stateFactory,
    ...selectorsFactory,
    ...stateAdapter,
  };
}
