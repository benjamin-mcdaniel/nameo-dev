import styles from './header.module.scss';
import classNames from 'classnames';

export interface HeaderProps {
    className?: string;
}

/**
 * This component was created using Codux's Default new component template.
 * To create custom component templates, see https://help.codux.com/kb/en/article/kb16522
 */
export const Header = ({ className }: HeaderProps) => {
    return (
        <div className={classNames(styles.root, className)}>
            <header className={styles.header}>
                <nav className={styles.leftContent}>
                    <a
                        href="https://nameo.dev"
                        className={classNames(styles.homeLink, styles.title)}
                    >
                        nameo.dev
                    </a>
                    <div className={styles.headDescr}></div>
                </nav>
                <div className={styles.rightContent}>
                    <span className={styles.inDev}>in dev</span>
                </div>
            </header>
        </div>
    );
};
