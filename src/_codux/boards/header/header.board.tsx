import { createBoard } from '@wixc3/react-board';
import { Header } from '../../../components/header/header';

export default createBoard({
    name: 'Header',
    Board: () => <Header />,
    environmentProps: {
        canvasWidth: 1749,
        windowBackgroundColor: '#ffffff',
        windowWidth: 1022,
    },
});
