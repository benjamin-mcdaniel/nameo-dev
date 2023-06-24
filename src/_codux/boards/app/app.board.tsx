import React from 'react';
import { createBoard } from '@wixc3/react-board';
import App from '../../../App';

export default createBoard({
  name: 'App',
  Board: () => <App />,
  environmentProps: {
    windowWidth: 1024,
    windowHeight: 1024,
    // other environment properties
  },
  // other configuration options
});
