import styles from './body.module.scss';
import classNames from 'classnames';

export interface BodyProps {
    className?: string;
}

/**
 * This component was created using Codux's Default new component template.
 * To create custom component templates, see https://help.codux.com/kb/en/article/kb16522
 */
export const Body = ({ className }: BodyProps) => {
    return (
        <div className={classNames(styles.root, className, styles.body)}>
            <div className={styles.center}>
                <span className={styles.center}>
                    <input className={styles.center} />
                    <button className={styles.center}>Search</button>
                </span>
            </div>
        </div>
    );
};
