import deepFreeze from 'deep-freeze';

export interface BookModel {
  id: string;
  title: string;
  description?: string;
  year?: number;
  editor?: string;
}

export const AClockworkOrange: BookModel = deepFreeze({
  id: 'aco',
  title: 'A Clockwork Orange',
  year: 1970,
  editor: 'A editor',
});

export const AnimalFarm: BookModel = deepFreeze({
  id: 'af',
  title: 'Animal Farm',
  year: 1960,
  editor: 'A editor',
});

export const TheGreatGatsby: BookModel = deepFreeze({
  id: 'tgg',
  title: 'The Great Gatsby',
  description: 'A 1925 novel written by American author F. Scott Fitzgerald',
  editor: 'B editor',
});
