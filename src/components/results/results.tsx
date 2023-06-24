import React from 'react'; // Import the React module
import styles from './results.module.scss';
import classNames from 'classnames';

export interface ResultsProps {
    className?: string;
}

export const Results = ({ className }: ResultsProps) => {
    return (
        <div className={classNames(styles.root, className)}>
            <li>
                <div />
                Item
            </li>
            Results
        </div>
    );
};
