let userContractObj;
let paperContractObj;
let modify_paper_id = -1;
let userContract;
let papersContract;
let pCid;
let userContractAddress;
let paperContractAddress;
const providerUrl = "http://127.0.0.1:7545";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
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
window.addEventListener('load', fetchContracts);


function changeWalletAddress(accounts) {
    $("#wallet").text(accounts);
}


async function loadContractForThisPage() {
    modify_paper_id = GetParameterValues("modify");
    if (modify_paper_id <= -1) {
        alert("Incorrect Request!!!");
        return;
    }
    if (window.web3) {
        // Set the default account if it's not already set
        if (!web3.eth.defaultAccount) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                console.error("No accounts found.");
                return;
            }
            web3.eth.defaultAccount = accounts[0];
        }
        changeWalletAddress(web3.eth.defaultAccount);
        userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
        paperContractObj = new web3.eth.Contract(papersContract.abi, paperContractAddress);
        web3.eth.getAccounts(console.log);
        web3.eth.getBlockNumber(console.log);
        getCurrentUserInformation_contract();
        getPaperInfo(modify_paper_id);
    } else {
        console.log("ERROR: WEB3 is not initialized : loadContractForThisPage");
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
    var userWallet = $("#wallet").text();
    var userRole = $("#role").text();
    var username = $("#fullname").text();
    var keywords = $("#keywords").val();
    var title = $("#papertitle").val();
    //console.log("cid of ipfs is", cid)
    if (title.length < 5) {
        alert("Title must be minimum five characters long");
        return;
    }
    if (keywords.length < 3) {
        alert("There is no keyword added with this paper , add atleast one keyword");
        return;
    }
    if (pCid.length < 20) {
        alert("There is no file attached make sure to attach a IPFS file system");
        return;
    }
    var bytes32array = splitTextForKeywords(keywords);
    console.log(bytes32array);
    console.log("FUNCTION-C-CALL: uploadModifiedPaper ");

    console.log("PARAMETERS :" + modify_paper_id + " - " + pCid + " - " + title + " - " + bytes32array);
    console.log("WALLET ACCOUNT:" + userWallet);
    if (paperContractObj && web3) {
        paperContractObj.methods.uploadModifiedPaper(modify_paper_id, pCid, title, bytes32array).send({ from: userWallet, gasPrice: web3.utils.toWei('4.1', 'Gwei'), gas: 3000000 })
            .on('transactionHash', function (hash) {
                console.log('Transaction Hash:', hash);
            })
            .on('receipt', function (receipt) {
                console.log('Receipt:', receipt);
                console.log("CALL SUCCESS: Modified existing paper on the network successfully, cid =", cid);
                onSuccessfulUpload(receipt.transactionHash, cid);
            })
            .on('error', function (error) {
                console.error("ERROR : Unable to call uploadModifiedPaper", error);
            });
    } else {
        console.error("ERROR: Paper Contract is not Loaded");
    }
}
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
    $("#congratsMsg").text("Your paper is uploaded successfully on the existing paper, the transaction id is " + tx + " <br> your document id is : " + cid);
    $("#congratsCid").text("Your paper Unique id is " + cid);
    alert("Paper Uploaded Successfully");

}

function GetParameterValues(param) {
    var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < url.length; i++) {
        var urlparam = url[i].split('=');
        if (urlparam[0] == param) {
            return urlparam[1];
        }
    }
}


async function getPaperInfo(paperId) {
    var userWallet = $("#wallet").text();
    var userRole = $("#role").text();
    console.log("FUNCTION-C-CALL: getPaperValues ");
    console.log("PARAMETERS : paperId");
    console.log("WALLET ACCOUNT:" + userWallet);
    if (paperContractObj && web3) {
        paperContractObj.methods.getPaperValues(paperId).call({ from: userWallet }, function (err, result) {
            if (result) {
                console.log("CALL SUCCESS: paper data found");
                console.log("CALL ACHIEVE:" + JSON.stringify(result));
                console.log(result);
                var keywords = "";
                result[4].forEach((keyword) => keywords = web3.utils.toUtf8(keyword) + " " + keywords);
                $("#keywords").val(keywords);
                $("#papertitle").val(result[0]);

                // Get cid from the result
                pCid = result[1];
                console.log("cid is ", pCid)
                // Assuming the cid is stored at index 1 in the result array
                // Call submitPaper with the obtained cid
                // Call submitPaper with the obtained cid
            }
            if (err) {
                console.error("ERROR : Unable to call getPaperValues", err);
            }
        });
    } else {
        console.error("ERROR: paper Contract is not Loaded");
    }
}

