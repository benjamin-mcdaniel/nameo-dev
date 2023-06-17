import styles from './results.module.scss';
import classNames from 'classnames';

export interface ResultsProps {
    className?: string;
}

/**
 * This component was created using Codux's Default new component template.
 * To create custom component templates, see https://help.codux.com/kb/en/article/kb16522
 */
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
