


window.addEventListener('load', async () => {
    // ... (existing code)

    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        try {
            // const response = await fetch('/Users.json');
            // const data = await response.json();
            // console.log(data);
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Connected to MetaMask');

            // Create the web3 instance only after successful connection
            // const web3 = new Web3(window.ethereum);
            const web3 = new Web3('HTTP://127.0.0.1:7545');

            // Example: Get the current accounts (assuming you have a function to handle accounts)
            await getAccountsAndHandle(web3);

            // ... other functions that use web3 (ensure they are defined after this block or check for web3 existence before usage)

        } catch (error) {
            // User denied account access
            console.error('Access to MetaMask denied:', error);
        }
    } else {
        // MetaMask is not installed
        console.warn('MetaMask is not installed!');
    }
});

async function getAccountsAndHandle(web3) {
    const currentAccounts = await web3.eth.getAccounts();
    //console.log('Current accounts:', currentAccounts);
    // Implement your logic to handle the accounts here (e.g., update UI, call other functions)
}