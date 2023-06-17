import styles from './App.module.scss';
import { Header } from './components/header/header';

function App() {
    return (
        <div className={styles.App}>
            <Header />
        </div>
    );
}

export default App;
