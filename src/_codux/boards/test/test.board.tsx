import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Test } from '../../../components/test/test';

const Board = () => <Test />;

export default createBoard({
  name: 'Test',
  Board,
});
