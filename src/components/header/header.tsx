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
                <span className={classNames(styles.headername, styles.header)}>nameo.dev</span>
                <span className={classNames(styles.center, styles.center)}>text</span>
            </header>
        </div>
    );
};
