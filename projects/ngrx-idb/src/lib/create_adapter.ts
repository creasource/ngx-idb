import { EntityDefinition, IDBEntityAdapter } from './models';
import { createInitialStateFactory } from './entity_state';
import { createSelectorsFactory } from './state_selectors';
import { createSortedStateAdapter } from './sorted_state_adapter';

export function createIDBEntityAdapter<T, Index extends string>(
  options: EntityDefinition<T, Index>
): IDBEntityAdapter<T, Index> {
  const { autoIncrement, keySelector, indexes }: EntityDefinition<T, Index> = {
    ...options,
  };

  const stateFactory = createInitialStateFactory<T, Index>(indexes);
  const selectorsFactory = createSelectorsFactory<T, Index>();
  const stateAdapter = createSortedStateAdapter(
    stateFactory.getInitialState,
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
