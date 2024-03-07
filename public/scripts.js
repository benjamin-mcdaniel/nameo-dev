

async function getVersion() {
    try {
        // Append a cache-busting parameter to the URL
        const versionResponse = await fetch(`version.txt?t=${new Date().getTime()}`);
        const version = await versionResponse.text();
        return 'v' + version.trim();
    } catch (error) {
        console.error('Error fetching version:', error);
        return 'Error fetching version';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // Your script here
    updateVersionInHeader();
});

async function updateVersionInHeader() {
    const versionElement = document.getElementById('release-version');
    
    if (versionElement) {
        console.log('Updating version in header...');
        
        try {
            const version = await getVersion();
            console.log('Version:', version);
            versionElement.style.display = 'block';
            versionElement.style.lineHeight = '45px';
            versionElement.style.padding = '0 14px';
            versionElement.style.textDecoration = 'none';
            versionElement.style.color = '#FFFFFF';
            versionElement.style.fontSize = '16px';
            versionElement.innerText = version;
            console.log('Version updated successfully:', version);
        } catch (error) {
            console.error('Error updating version in header:', error);
            versionElement.innerText = 'Error fetching version';
        }
    } else {
        console.error('Version element not found.');
    }
}

// Call the function to update the version on page load
updateVersionInHeader();


async function readTextFile(file) {
    try {
        const response = await fetch(file);
        const content = await response.text();
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

function generateRandomHex() {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return randomHex.toUpperCase();
}
function createGridItems(gridId, generatorFunction) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = ''; // Clear existing items

    for (let i = 0; i < 16; i++) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item', 'loading'); // Add a loading class
        grid.appendChild(gridItem);

        // Add mouseover event listener to change cursor style
        gridItem.addEventListener('mouseover', () => {
            gridItem.style.cursor = 'pointer';
        });

        // Add mouseout event listener to reset cursor style
        gridItem.addEventListener('mouseout', () => {
            gridItem.style.cursor = 'default';
        });
    }

    // Simulate an asynchronous delay for loading data
    setTimeout(() => {
        for (let i = 0; i < 16; i++) {
            const value = generatorFunction();
            const gridItem = grid.children[i]; // Get the previously created grid item
            gridItem.textContent = value;
            gridItem.classList.remove('loading'); // Remove the loading class
            // ... (rest of the code remains unchanged)
        }
    }, 1000); // Adjust the delay (in milliseconds) as needed
}

let prefixesContent;
let suffixesContent;

function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to fetch and store content from a file
async function loadFileContent(file) {
    try {
        const response = await fetch(file);
        return await response.text();
    } catch (error) {
        console.error(`Error loading content from ${file}:`, error);
        throw error;
    }
}

// Load prefix and suffix content on page load
async function loadPrefixesAndSuffixes() {
    try {
        prefixesContent = await loadFileContent('prefixes.txt');
        suffixesContent = await loadFileContent('suffixes.txt');
    } catch (error) {
        // Handle the error if needed
    }
}

// Call the function to load prefix and suffix content
loadPrefixesAndSuffixes();

// Now you can use prefixesContent and suffixesContent in your functions

async function generateDockerStyle() {
    try {
        if (!prefixesContent || !suffixesContent) {
            // Reload content if not already loaded
            await loadPrefixesAndSuffixes();
        }

        const prefixes = prefixesContent.split('\n').filter(Boolean);
        const suffixes = suffixesContent.split('\n').filter(Boolean);

        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)].trim();
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)].trim();

        return `${randomPrefix}-${randomSuffix}`;
    } catch (error) {
        console.error('Error generating Docker-style name:', error);
        throw error;
    }
}




async function createGridItemsDocker(gridId) {
    const grid = document.getElementById(gridId);

    // Clear existing content of the grid
    grid.innerHTML = '';

    for (let i = 0; i < 16; i++) {
        try {
            const dockerValue = await generateDockerStyle();

            // Create grid item
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.textContent = dockerValue;

            const copiedMessage = document.createElement('div');
            copiedMessage.classList.add('copied-message');
            copiedMessage.textContent = 'Copied';
            gridItem.appendChild(copiedMessage);

            // Add click event listener to each grid item
            gridItem.addEventListener('click', () => {
                // Copy the value to the clipboard
                copyToClipboard(dockerValue);

                // Show "Copied" message
                copiedMessage.style.opacity = 1;

                // Fade out the "Copied" message after 2 seconds
                setTimeout(() => {
                    copiedMessage.style.opacity = 0;
                }, 2000);

                // Add class for blinking borders
                gridItem.classList.add('blink-border');

                // Optionally, provide visual feedback or other actions after copying
                console.log(`Copied to clipboard: ${dockerValue}`);
            });

            // Append grid item to the grid
            grid.appendChild(gridItem);
        } catch (error) {
            console.error('Error generating Docker-style name:', error);
        }
    }
}


function createGridItems(gridId, generatorFunction, gridType) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = ''; // Clear existing items

    for (let i = 0; i < 16; i++) {
        const value = generatorFunction();
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.textContent = value;

        const copiedMessage = document.createElement('div');
        copiedMessage.classList.add('copied-message');
        copiedMessage.textContent = 'Copied';
        gridItem.appendChild(copiedMessage);

        // Add click event listener to each grid item
        gridItem.addEventListener('click', (event) => {
            // Stop the event propagation to prevent it from reaching the parent container
            event.stopPropagation();

            // Copy the value to the clipboard
            copyToClipboard(value);

            // Show "Copied" message
            copiedMessage.style.opacity = 1;

            // Fade out the "Copied" message after 2 seconds
            setTimeout(() => {
                copiedMessage.style.opacity = 0;
            }, 2000);

            // Add class for blinking borders
            gridItem.classList.add('blink-border');

            // Optionally, provide visual feedback or other actions after copying
            console.log(`Copied to clipboard (${gridType}): ${value}`);
        });

        grid.appendChild(gridItem);
    }
}

async function createGridItemsWithGUID(gridId, generatorFunction) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    const promises = Array.from({ length: 16 }, async (_, i) => {
        try {
            const value = await generatorFunction();
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.textContent = value;

            const copiedMessage = document.createElement('div');
            copiedMessage.classList.add('copied-message');
            copiedMessage.textContent = 'Copied';
            gridItem.appendChild(copiedMessage);

            // Add click event listener to each grid item
            gridItem.addEventListener('click', (event) => {
                // Stop the event propagation to prevent it from reaching the parent container
                event.stopPropagation();

                // Copy the value to the clipboard
                copyToClipboard(value);

                // Show "Copied" message
                copiedMessage.style.opacity = 1;

                // Fade out the "Copied" message after 2 seconds
                setTimeout(() => {
                    copiedMessage.style.opacity = 0;
                }, 2000);

                // Add class for blinking borders
                gridItem.classList.add('blink-border');

                // Optionally, provide visual feedback or other actions after copying
                console.log(`Copied to clipboard (GUID): ${value}`);
                
            });

            grid.appendChild(gridItem);
        } catch (error) {
            console.error('Error generating grid item:', error);
        }
    });

    await Promise.all(promises);
}

document.addEventListener('DOMContentLoaded', onPageLoad);

// ... (your existing code)

function generateTimezoneName() {
    const timeZones = [
        'UTC-12', 'UTC-11', 'UTC-10', 'UTC-09', 'UTC-08', 'UTC-07',
        'UTC-06', 'UTC-05', 'UTC-04', 'UTC-03', 'UTC-02', 'UTC-01',
        'UTC+00', 'UTC+01', 'UTC+02', 'UTC+03', 'UTC+04', 'UTC+05',
        'UTC+06', 'UTC+07', 'UTC+08', 'UTC+09', 'UTC+10', 'UTC+11',
        'UTC+12'
    ];

    const currentDate = new Date();
    const randomTimeZone = getRandomItem(timeZones);

    // Custom date formatting: MMM_D_YYYY (e.g., Mar_6_2024)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${monthNames[currentDate.getMonth()]}_${currentDate.getDate()}_${currentDate.getFullYear()}`;

    return `${randomTimeZone}_${formattedDate}`;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function createGridItemsWithTimezone(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        try {
            const timezoneValue = generateTimezoneName();

            // Create grid item
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.textContent = timezoneValue;

            const copiedMessage = document.createElement('div');
            copiedMessage.classList.add('copied-message');
            copiedMessage.textContent = 'Copied';
            gridItem.appendChild(copiedMessage);

            // Add click event listener to each grid item
            gridItem.addEventListener('click', () => {
                // Copy the value to the clipboard
                copyToClipboard(timezoneValue);

                // Show "Copied" message
                copiedMessage.style.opacity = 1;

                // Fade out the "Copied" message after 2 seconds
                setTimeout(() => {
                    copiedMessage.style.opacity = 0;
                }, 2000);

                // Add class for blinking borders
                gridItem.classList.add('blink-border');

                // Optionally, provide visual feedback or other actions after copying
                console.log(`Copied to clipboard (Timezone): ${timezoneValue}`);
            });

            // Append grid item to the grid
            grid.appendChild(gridItem);
        } catch (error) {
            console.error('Error generating timezone name:', error);
        }
    }
}


function copyToClipboard(text) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);

    // Select and copy the text
    textarea.select();
    document.execCommand('copy');

    // Remove the temporary textarea
    document.body.removeChild(textarea);
}


function updateMotdCountdown(seconds) {
    const motdSmallText = document.getElementById('small-text');
    motdSmallText.textContent = `Refresh in ${seconds} seconds, click to copy`;
}

function refreshGrids() {
    updateMotdCountdown(10);
    createGridItems('hex-grid', generateRandomHex);
    createGridItemsDocker('docker-grid');
    createGridItemsWithGUID('grid', generateGUID);
    createGridItemsWithTimezone('timezone-grid');
}

setInterval(refreshGrids, 10000); // Refresh every 10 seconds
function onPageLoad() {
    // Call the function you want to run on page load
    refreshGrids();
}

// Attach the function to the window.onload event
window.onload = onPageLoad;
