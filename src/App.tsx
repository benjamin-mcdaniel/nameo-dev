import styles from './App.module.scss';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Body } from './components/body/body';
import headerModule from './components/header/header.module.scss';
import classNames from 'classnames';

function App() {
  return (
    <div className={classNames(styles.App, headerModule.center)}>
      <Header />
      <Body />
      <Footer />
    </div>
  );
}

export default App;
