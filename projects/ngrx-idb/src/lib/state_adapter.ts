import { IDBEntityState } from './models';

export enum DidMutate {
  EntitiesOnly,
  Both,
  None,
}

export function createStateOperator<V, R>(
  mutator: (arg: R, state: IDBEntityState<V>) => DidMutate
): IDBEntityState<V>;
export function createStateOperator<V, R>(
  mutator: (arg: any, state: any) => DidMutate
): any {
  return function operation<S extends IDBEntityState<V>>(
    arg: R,
    state: any
  ): S {
    const clonedEntityState: IDBEntityState<V> = {
      keys: [...state.keys],
      entities: { ...state.entities },
      indexes: { ...state.indexes },
    };

    const didMutate = mutator(arg, clonedEntityState);

    if (didMutate === DidMutate.Both) {
      //return Object.assign({}, state, clonedEntityState);
      return {
        ...state,
        keys: clonedEntityState.keys,
        entities: clonedEntityState.entities,
        indexes: clonedEntityState.indexes,
      };
    }

    if (didMutate === DidMutate.EntitiesOnly) {
      return {
        ...state,
        entities: clonedEntityState.entities,
        indexes: clonedEntityState.indexes,
      };
    }

    return state;
  };
}
