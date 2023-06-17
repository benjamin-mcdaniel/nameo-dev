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
        <header className={classNames(styles.root, className)}>
            <div className={styles.title}>
                <span>
                    <h1>nameo.dev</h1>
                </span>
            </div>
            <div className={styles.punchline}>
                <span>
                    <h5>in development</h5>
                </span>
            </div>
        </header>
    );
};
