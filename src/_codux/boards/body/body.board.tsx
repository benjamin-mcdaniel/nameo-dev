import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Body } from '../../../components/body/body';

export default createBoard({
  name: 'Body',
  Board: function Board() {
    return <Body />;
  },
  environmentProps: {
    canvasWidth: 1178,
    canvasMargin: {
      top: 1,
    },
  },
});
