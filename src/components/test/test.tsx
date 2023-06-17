import styles from './test.module.scss';
import classNames from 'classnames';

export interface TestProps {
    className?: string;
}

/**
 * This component was created using Codux's Default new component template.
 * To create custom component templates, see https://help.codux.com/kb/en/article/kb16522
 */
export const Test = ({ className }: TestProps) => {
    return (
        <header className={classNames(styles.root, className)}>
            <div>
                <h2>nameo.dev</h2>
            </div>
            <div>
                <h3>Heading 3</h3>
            </div>
            <div>
                <h3>Heading 3</h3>
            </div>
        </header>
    );
};
