async function getApiKey () {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(["GEO_API_KEY"], async (result) => {
            if (result.GEO_API_KEY) {
                resolve(result.GEO_API_KEY);
            } else {
                await chrome.runtime.openOptionsPage();
                reject();
            }
         });
    })
}

chrome.action.onClicked.addListener(async (tab) => {
    try {
        const GEO_API_KEY = await getApiKey();
        debugger
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getFavourites(),
            args: [GEO_API_KEY],
        }, (injectionResults) => {
            const favs = injectionResults[0].result;
            let csvContent = `data:text/csv;charset=utf-8,Latitude,Longtitute,Price,Address,Title,Url\n`;
            csvContent += favs.map(favToString).join('');
            console.log(csvContent);
            chrome.tabs.create({ url: csvContent });
        });
    } catch {

    }
    
});

function favToString({ locations, address, title, price, url }) {
    const { lat, lon } = locations[0];
    return `${lat},${lon},${price},${address},${title},${url}\n`;
}

function getFavourites() {
    return async (GEO_API_KEY) => {
        const GEO_BATCH_URL = 'https://api.geoapify.com/v1/batch/geocode/search';
        const cards = document.querySelectorAll('.observedad');
        const pins = [...cards].map(node => {
            const address = select(node, ['.date-location > li', '.bottom-cell .breadcrumb']).innerText;
            const title = select(node, ['.offerLink']).title;
            const url = select(node, ['.offerLink']).href;
            const image = select(node, ['.tcenter img', '.offerLink > img']).src;
            const price = select(node, ['.price']).innerText;
            debugger
        
            return { address, title, url, image, price, node };
            
            
        });
        const places = await geoCode(pins);
        pins.forEach(pin => {
            pin.locations =  places.filter(({ query }) => query.text === pin.address);
        })

        async function geoCode(pins) {
            const addresses = pins.map(({ address }) => address);
            const params = new URLSearchParams();
            params.append('apiKey', GEO_API_KEY);
            params.append('filter', 'countrycode:pl');
            const { url } = await fetch(`${GEO_BATCH_URL}?${params}`, {
                body: JSON.stringify(addresses),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                method: 'POST'
            }).then(r => r.json());
            const places = await waitForBatch(url);
    
            return places;
        }

        async function waitForBatch(url) {
            let attemp = 0;
            return new Promise(resolve => {
                const wait = async () => {
                    setTimeout(async () => {
                        const response = await fetch(`${url}&format=json`).then(r => r.json());
                        if (Array.isArray(response)) {
                            resolve(response);
                        } else {
                            if (attemp < 3) {
                                attemp++
                                wait();
                            } else {
                                throw new Error('Failed to load places in a given time');
                            }
                        }
                    }, 500);   
                }
                wait();
            })
        }
    
        function select(node, selectors) {
            return selectors.length ? node.querySelector(selectors.shift()) || select(node, selectors) : {};
        }

        return pins;
    }
}
  