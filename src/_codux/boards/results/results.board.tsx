import { createBoard } from '@wixc3/react-board';
import { Results } from '../../../components/results/results';

export default createBoard({
    name: 'Results',
    Board: () => <Results />,
    environmentProps: {
        windowWidth: 1226,
    },
});
