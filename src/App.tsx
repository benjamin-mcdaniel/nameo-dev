import styles from './App.module.scss';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Body } from './components/body/body';

function App() {
    return (
        <div className={styles.App}>
            <Header />
            <Body />
            <Footer />
        </div>
    );
}

export default App;
