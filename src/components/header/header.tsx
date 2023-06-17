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
                <span className={styles.headername}>
                    nameo.dev
                    <span>
                        <select>
                            <option>Apple</option>
                            <option>Banana</option>
                            <option>Watermelon</option>
                        </select>
                    </span>
                </span>
            </header>
        </div>
    );
};
