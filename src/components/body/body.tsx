import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import classNames from 'classnames';
import styles from './body.module.scss';

interface ToggleUIProps {
  apiType: string;
  onApiTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClick: () => void;
}

const ToggleUI: React.FC<ToggleUIProps> = ({ apiType, onApiTypeChange, onSearchClick }) => {
  return (
    <div className={styles.fiftytop}>
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
  const [apiData, setApiData] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load stored API data from localStorage on component mount
    const storedApiData = localStorage.getItem('apiData');
    if (storedApiData) {
      setApiData(JSON.parse(storedApiData));
    }
  }, []);

  useEffect(() => {
    // Update localStorage when apiData changes
    localStorage.setItem('apiData', JSON.stringify(apiData));
  }, [apiData]);

  const handleApiTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiType(event.target.value);
  };

  const handleSearchClick = () => {
    // Perform the search with the selected api_type
    console.log('Search clicked. API type:', apiType);

    // Make the API call
    fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then(json => {
        // Update the API data state
        const newApiData = [`API response for ${apiType}: ${JSON.stringify(json)}`, ...apiData];
        setApiData(newApiData);

        // Clear the input field
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      });
  };

  const handleDeleteLine = (index: number) => {
    const updatedApiData = [...apiData];
    updatedApiData.splice(index, 1);
    setApiData(updatedApiData);
  };

  const handleExportClick = () => {
    // Create a text string from the API data
    const txtContent = apiData.join('\n');

    // Create a Blob object for the text data
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });

    // Save the TXT file
    saveAs(blob, 'api_data.txt');
  };

  const handleClearAll = () => {
    setApiData([]);
  };

  return (
    <div
      style={{ height: '85vh', justifyContent: 'start', padding: '0px' }}
      className={classNames(styles.root, className, styles.body)}
    >
      <div className={styles.sidebar}>
        <div className={styles.fiftyl}>
          Options
          <ToggleUI apiType={apiType} onApiTypeChange={handleApiTypeChange} onSearchClick={handleSearchClick} />
        </div>
        <div className={classNames(styles.exportButtonContainer, styles.export)}>
          <button className={styles.exportButton} onClick={handleExportClick}>
            Export TXT
          </button>
        </div>
        <div className={classNames(styles.exportButtonContainer, styles.export)}>
          <button className={styles.exportButton} onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </div>
      <div className={classNames(styles['top-pad'], styles.contentvert)}>
        <div className={styles.center}>
          <div>
            <input className={styles.input} ref={inputRef} />
          </div>
          <div>
            <span className={classNames(styles.center, styles.search)}>
              <button onClick={handleSearchClick}>Search</button>
            </span>
          </div>
        </div>

        <div className={classNames(styles.center, styles.fiftytop)}>
          {apiData.length > 0 ? (
            apiData.map((line, index) => (
              <div key={index} className={styles.lineContainer}>
                <div className={styles.deleteButtonContainer}>
                  <button className={styles.deleteButton} onClick={() => handleDeleteLine(index)}>
                    X
                  </button>
                </div>
                <div className={styles.lineContent}>{line}</div>
              </div>
            ))
          ) : (
            <div>No API data available</div>
          )}
        </div>
      </div>
    </div>
  );
};
