import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Footer } from '../../../components/footer/footer';

const Board = () => <Footer />;

export default createBoard({
  name: 'Footer',
  Board: Board,
  environmentProps: {
    canvasWidth: 2114,
  },
});
