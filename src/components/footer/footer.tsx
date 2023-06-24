import React from 'react'; // Import the React module
import classNames from 'classnames';
import styles from './footer.module.scss';

export interface FooterProps {
    className?: string;
}

export const Footer = ({ className }: FooterProps) => {
    return (
        <div className={classNames(styles.root, className)}>
            <span className={styles.footer}>@iamcdben 2023</span>
        </div>
    );
};
