import React from 'react';
import classNames from 'classnames';
import styles from './header.module.scss';

export interface HeaderProps {
    className?: string;
}

export const Header = ({ className }: HeaderProps) => {
    return (
        <header className={classNames(styles.root, className)}>
            <div className={styles.title}>
                <h1>nameo.dev</h1>
            </div>
            <div className={styles.punchline}>
                <h5>in development</h5>
            </div>
        </header>
    );
};
