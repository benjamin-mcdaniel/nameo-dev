import React from 'react';
import styles from './banner.module.scss';
import classNames from 'classnames';

export interface BannerProps {
    className?: string;
}

export const Banner = ({ className }: BannerProps) => {
    return <div className={classNames(styles.root, className)}>Banner</div>;
};
