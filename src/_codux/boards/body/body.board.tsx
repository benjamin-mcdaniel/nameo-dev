import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Body } from '../../../components/body/body';

const Board = () => <Body />;

export default createBoard({
  name: 'Body',
  Board,
  environmentProps: {
    canvasWidth: 1178,
    canvasMargin: {
      top: 1,
    },
  },
});
