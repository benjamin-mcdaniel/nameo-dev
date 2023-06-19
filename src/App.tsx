import styles from './App.module.scss';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Body } from './components/body/body';
import Header_module from './components/header/header.module.scss';
import Classnames from 'classnames';

function App() {
    return (
        <div className={Classnames(styles.App, Header_module.center)}>
            <Header />
            <Body />
            <Footer />
        </div>
    );
}

export default App;
