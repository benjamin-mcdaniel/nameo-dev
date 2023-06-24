import React from 'react'; // Import the React module
import styles from './header.module.scss';
import classNames from 'classnames';

export interface HeaderProps {
    className?: string;
}

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
