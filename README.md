# NgxIDB

An Angular wrapper to IndexedDB.

## Installation

```
npm i @creasource/ngx-idb @creasource/reactive-idb
```

```
yarn add @creasource/ngx-idb @creasource/reactive-idb
```

## Basic Usage

Module import:
```ts
import { IndexedDBModule } from "@creasource/ngx-idb";

IndexedDBModule.forRoot({
  name: 'myDatabase',
  schema: [
    {
      version: 1,
      stores: [
        {
          name: 'myStore',
          options: { autoIncrement: true },
        },
      ],
    },
  ],
})
```

Service import:

```ts
import { Inject, Injectable } from "@angular/core";
import { IndexedDBService, Database } from "@creasource/ngx-idb";

@Injectable()
export class MyService {
  constructor(@Inject(Database('myDatabase')) private database: IndexedDBService) {
    database
      .getStore<{ name: string }>('myStore')
      .add({ name: 'John' })
      .subscribe({
        next: (key) => console.log(key),
        error: (err) => console.error(err),
      });
  }
}
```

For more information see [reactive-idb](https://github.com/creasource/reactive-idb)

# Dev

```
yarn build
cd dist/ngx-idb
yarn link
```
