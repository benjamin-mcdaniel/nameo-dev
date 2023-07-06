import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { Header } from '../../../components/header/header';

export default createBoard({
  name: 'Header',
  Board: () => <Header />,
  environmentProps: {
    canvasWidth: 1086,
    windowBackgroundColor: '#ffffff',
    windowWidth: 1920,
    windowHeight: 1080,
    canvasMargin: {
      top: 1,
    },
  },
});
