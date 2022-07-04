document.addEventListener('DOMContentLoaded', (e) => {
    debugger
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
        const key = e.target[0].value
        debugger;
        e.preventDefault();
        chrome.storage.sync.set({ GEO_API_KEY: key }, () => {
            form.innerHTML = `
                All set. You can now use the extenstion. Glory to Ukraine!
            `
        });
    })
})
