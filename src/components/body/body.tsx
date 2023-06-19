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
        <div style={{ height: '85vh' }} className={classNames(styles.root, className, styles.body)}>
            <div className={styles.sidebar} />
            <div className={styles.center}>
                <div className={styles.input}>
                    <span className={styles.input}>
                        <input />
                    </span>
                </div>
                <div>
                    <span className={styles.input}>
                        <button>Search</button>
                    </span>
                </div>
            </div>
        </div>
    );
};
