let userContract;
let papersContract;
let userContractAddress;
let paperContractAddress;
async function fetchContracts() {
    try {
        const userResponse = await fetch('/Users.json');
        const papersResponse = await fetch('/Papers.json');
        userContract = await userResponse.json();
        papersContract = await papersResponse.json();
        userContractAddress = userContract.networks['5777'].address;

        paperContractAddress = papersContract.networks['5777'].address;

        console.log("Contracts fetched successfully.");
        loadContractForThisPage();
    } catch (error) {
        console.error("Error fetching contracts:", error);
    }
}

const providerUrl = "http://127.0.0.1:7545";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
window.addEventListener('load', fetchContracts);

//window.addEventListener('load', getCurrentUserInformation_contract)
//let paperContractAbi = JSON.parse(fs.readFileSync('../contracts_json/PaperContract.json', 'utf8'));
let userContractObj;
let paperContractObj;

function changeWalletAddress(accounts) {
    $("#wallet").val(accounts);
}

// function loadContractForThisPage() {
//     if (window.web3) {
//         changeWalletAddress(web3.eth.defaultAccount);
//         console.log("userContract", userContract.abi)
//         userContractObj = new web3.eth.Contract(userContract.abi, '0xCd4891ee86e9Bf7b3a03e63BD752C3b5a56080c1');
//         paperContractObj = new web3.eth.Contract(papersContract.abi, '0x022f5A235645F19D629e8edbf9FD95057aE642f0');
//         getCurrentUserInformation_contract();
//     }
//     else {
//         console.log("ERROR: WEB3 is not initialized : loadContractForThisPage");
//     }
// }
async function loadContractForThisPage() {


    // Check if Ethereum provider is available
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            // Use the first account returned by MetaMask
            const defaultAccount = accounts[0];
            if (defaultAccount) {
                changeWalletAddress(defaultAccount);

                console.log("userContract", userContract.abi)
                userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
                paperContractObj = new web3.eth.Contract(papersContract.abi, paperContractAddress);
                getCurrentUserInformation_contract();
            } else {
                console.log("ERROR: WEB3 is not initialized : loadContractForThisPage");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please check the console for details.");
        }
    } else {
        console.error("Ethereum provider not detected.");
        alert("Ethereum provider not detected. Please make sure you have MetaMask installed.");
    }
}

async function getCurrentUserInformation_contract() {
    if (userContractObj) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                console.error("No accounts found.");
                return;
            }
            const account = accounts[0]; // Using the first account
            console.log("Connected account:", account);

            userContractObj.methods.getCurrentUserInformation().call({ from: account }, function (err, result) {
                if (err) {
                    console.error("Error calling getCurrentUserInformation:", err);
                    console.log("Unable to call getCurrentUserInformation");
                } else {
                    console.log(result)
                    if (result[1].length > 2) {
                        if (parseInt(result[0]) === 0) $("#role").text("Author");
                        else if (parseInt(result[0]) === 1) $("#role").text("Reviewer");
                        else $("#role").text("Researcher");
                        $("#fullname").text(result[1]);
                        console.log("#fullname");
                        $("#paperSubmitMessage").text("You are a registered user, you can submit the paper").removeClass("alert-danger").addClass("alert-success");
                        $('form *').prop('disabled', false);
                    } else {
                        $("#paperSubmitMessage").text("Your wallet is not registered, you cannot upload your file.").removeClass("alert-success").addClass("alert-danger");
                        $("#fullname").text(result[1]);
                        $('form *').prop('disabled', true);
                        $("#role").text("None");
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    } else {
        console.log("ERROR: Unable to Load Contract and unable to call getCurrentUserInformation function");
    }
}




async function submitPaper() {
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });

        // Use the first account returned by MetaMask
        const userWallet = accounts[0];
        if (!userWallet) {
            console.error("No accounts found.");
            return;
        }

        var userRole = $("#role").text();
        var username = $("#fullname").text();
        var keywords = $("#keywords").val();
        var title = $("#papertitle").val();
        var ipfsCID = $("#ipfsCID").val(); // Get the IPFS CID directly from the input field

        if (title.length < 5) {
            alert("Title must be minimum five characters long");
            return;
        }

        if (keywords.length < 3) {
            alert("There is no keyword added with this paper, add at least one keyword");
            return;
        }

        if (!ipfsCID) {
            alert("No IPFS CID provided.");
            return;
        }

        $("#progress-bar").show();
        $("#addPaper").hide();

        var bytes32array = splitTextForKeywords(keywords);

        if (paperContractObj && web3) {
            paperContractObj.methods.uploadNewPaper(ipfsCID, title, bytes32array, userRole, username, userWallet)
                .send({ from: userWallet, gasPrice: web3.utils.toWei('4.1', 'Gwei'), gas: 3000000 })
                .on('transactionHash', function (hash) {
                    console.log("Transaction hash:", hash);
                    // Additional actions if needed
                })
                .on('confirmation', function (confirmationNumber, receipt) {
                    console.log("Confirmation number:", confirmationNumber);
                    console.log("Receipt:", receipt);
                    // Additional actions if needed
                })
                .on('receipt', function (receipt) {
                    console.log("Receipt:", receipt);
                    // Additional actions if needed
                    $("#progress-bar").hide();
                    $("#addPaper").show();
                    onSuccessfulUpload(receipt.transactionHash, ipfsCID);
                })
                .on('error', function (error) {
                    console.error("Error uploading paper:", error);
                    $("#progress-bar").hide();
                    $("#addPaper").show();
                });
        } else {
            console.log("ERROR: Paper Contract is not Loaded");
        }
    } catch (error) {
        console.error("Error submitting paper:", error);
        $("#progress-bar").hide();
        $("#addPaper").show();
    }
}

// async function uploadToIPFS(file) {
//     const formData = new FormData();
//     formData.append('file', file);

//     const response = await fetch('http://localhost:5001/api/v0/add', {
//         method: 'POST',
//         body: formData,
//     });

//     const data = await response.json();
//     return data.Hash;
// }

function splitTextForKeywords(str) {
    var userWallet = $("#wallet").text();

    var words = str.split(" ");
    console.log(words);

    let byt32array = new Array();

    words.map((arg) => {
        console.log(web3.utils.asciiToHex(arg));
        byt32array.push(web3.utils.asciiToHex(arg));
    });

    console.log(byt32array);

    return byt32array;
}

function onSuccessfulUpload(tx, cid) {
    $("#filesubmitForm").hide();

    $("#congratsMsg").text("Your paper is uploaded successfully, the transaction id is " + tx + " <br> your document id is : " + cid);
    $("#congratsCid").text("Your paper Unique id is " + cid);

}
