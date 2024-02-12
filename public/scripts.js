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

    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const value = generatorFunction();
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.textContent = value;
            grid.appendChild(gridItem);
        }, i * 250); // Delay each iteration by i * 250 milliseconds
    }
}

async function generateDockerStyle() {
    try {
        const prefixesContent = await readTextFile('prefixes.txt');
        const suffixesContent = await readTextFile('suffixes.txt');

        const prefixes = prefixesContent.split('\n').filter(Boolean);
        const suffixes = suffixesContent.split('\n').filter(Boolean);

        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)].trim(); // Trim spaces
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)].trim(); // Trim spaces

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

    for (let i = 0; i < 10; i++) {
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

    for (let i = 0; i < 10; i++) {
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
    motdSmallText.textContent = `Refresh in ${seconds} seconds`;
}

function refreshGrids() {
    updateMotdCountdown(5);
    createGridItems('hex-grid', generateRandomHex);
    createGridItemsDocker('docker-grid');
}

setInterval(refreshGrids, 10000); // Refresh every 10 seconds
function onPageLoad() {
    // Call the function you want to run on page load
    refreshGrids();
}

// Attach the function to the window.onload event
window.onload = onPageLoad;