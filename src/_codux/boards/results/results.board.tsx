import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Results } from '../../../components/results/results';

const Board = () => <Results />;

export default createBoard({
  name: 'Results',
  Board,
  environmentProps: {
    windowWidth: 1226,
  },
});
