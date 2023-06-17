import styles from './footer.module.scss';
import classNames from 'classnames';

export interface FooterProps {
    className?: string;
}

/**
 * This component was created using Codux's Default new component template.
 * To create custom component templates, see https://help.codux.com/kb/en/article/kb16522
 */
export const Footer = ({ className }: FooterProps) => {
    return (
        <div className={classNames(styles.root, className)}>
            <span className={styles.footer}>@iamcdben 2023</span>
        </div>
    );
};
