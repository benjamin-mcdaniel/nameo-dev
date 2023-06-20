import styles from './body.module.scss';
import classNames from 'classnames';
import React, { useState } from 'react';
import Header_module from '../header/header.module.scss';

interface ToggleUIProps {
    apiType: string;
    onApiTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchClick: () => void;
}

const ToggleUI: React.FC<ToggleUIProps> = ({ apiType, onApiTypeChange, onSearchClick }) => {
    return (
        <div>
            <label>
                <input
                    type="radio"
                    name="apiType"
                    value="fuzz"
                    checked={apiType === 'fuzz'}
                    onChange={onApiTypeChange}
                />
                Fuzz
            </label>
            <label>
                <input
                    type="radio"
                    name="apiType"
                    value="raw"
                    checked={apiType === 'raw'}
                    onChange={onApiTypeChange}
                />
                Raw
            </label>
        </div>
    );
};

export interface BodyProps {
    className?: string;
}

export const Body: React.FC<BodyProps> = ({ className }) => {
    const [apiType, setApiType] = useState<string>('fuzz');

    const handleApiTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiType(event.target.value);
    };

    const handleSearchClick = () => {
        // Perform the search with the selected api_type
        console.log('Search clicked. API type:', apiType);
    };

    return (
        <div
            style={{ height: '85vh', justifyContent: 'start', padding: '0px' }}
            className={classNames(styles.root, className, styles.body)}
        >
            <div className={styles.sidebar}>
                <div className={styles.fiftyl}>
                    Options
                    <ToggleUI
                        apiType={apiType}
                        onApiTypeChange={handleApiTypeChange}
                        onSearchClick={handleSearchClick}
                    />
                </div>
            </div>
            <div className={styles['top-pad']}>
                <div className={styles.center}>
                    <div>
                        <span>
                            <input className={styles.input} />
                        </span>
                    </div>
                    <div className={styles.search}>
                        <span className={styles.search}>
                            <button onClick={handleSearchClick}>Search</button>
                        </span>
                    </div>
                    <div>
                        <span className={classNames(styles.center, styles.search)}></span>
                    </div>
                </div>
                <div className={styles.center}>
                    <h6>api results go here</h6>
                </div>
                <div className={styles.center}>Text</div>
            </div>
        </div>
    );
};
