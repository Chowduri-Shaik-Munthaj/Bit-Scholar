
let userContractObj;
let _gCurrentWallet = "";
let userContract;
let userContractAddress;
// let userContractAddress = "0x59E7d5dC19a8b9C511F24B317E6808762f98b794";
async function fetchContracts() {
    try {
        const userResponse = await fetch('/Users.json');

        userContract = await userResponse.json();
        userContractAddress = userContract.networks['5777'].address;

        console.log("Contracts fetched successfully.");

    } catch (error) {
        console.error("Error fetching contracts:", error);
    }
}




const providerUrl = "http://127.0.0.1:7545";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));


window.addEventListener('load', fetchContracts);

window.addEventListener('load', loadContractForThisPage);
function changeWalletAddress(accounts) {
    $("#wallet").val(accounts);
    _gCurrentWallet = accounts;
}

async function loadContractForThisPage() {
    $("#progress-div").hide();

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


                userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
                console.log("userContractObj", userContractObj)


                // Example: check if user needs to register after contract is loaded
                if ($("#fullname").val().length > 1) {
                    await submitNewUser(userContractObj, $("#role").val(), $("#fullname").val(), defaultAccount);
                }
            } else {
                console.error("No accounts found.");
                alert("No accounts found. Please make sure MetaMask is unlocked and an account is connected.");
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


async function submitNewUser(userRole, username) {
    const userWallet = $("#wallet").val();
    $("#progress-div").show();
    $("#form_buttons").hide();

    try {
        userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
        console.log("functions", userContractObj.methods)

        let result = await userContractObj.methods.registerUser(userRole, username)
            .send({ from: userWallet, gas: 5000000 }) // Increased gas limit
        if (result) {
            alert("Account is successfully registered");
            console.log("Account is successfully registered");
            $("#progress-div").hide();
            $("#form_buttons").show();

            console.log("CALL-SUCCESS: " + JSON.stringify(result));
            console.log("CALL-ACHIEVE: User registered successfully");




            showFullNameInputField(username, userRole, false);
        }
        else {
            console.log("no result")
        }

    } catch (error) {
        $("#progress-div").hide();
        $("#form_buttons").show();
        alert("Unable to register this account: " + error.message);
    }
}


async function onSubmitForm() {


    if ($("#fullname").val().length > 1) {
        //await loadContractForThisPage(); 

        if (userContractObj) {
            submitNewUser($("#role").val(), $("#fullname").val());
        } else {
            alert("Contract is still loading. Please try again later.");
        }
    } else {
        alert("Make sure to enter full user name");
    }
}

async function isUserExist_contract() {
    var userWallet = $("#wallet").val();
    await userContractObj.isUserExist({ from: userWallet }, function (err, result) {
        if (err) {
            return false;
        } else {
            if (result) {
                console.log("Current user :" + _gCurrentWallet + " is already registered: " + JSON.stringify(result));
            } else {
                console.log("Current user :" + _gCurrentWallet + " is not registered: " + JSON.stringify(result));
            }
            return result;
        }
    });
    userContractObj.getMessageSender(function (err, result) {
        if (err) {
            console.log("message sender error" + JSON.stringify(err));
        } else {
            console.log("message sender error" + JSON.stringify(err));
        }
    });
}

function getCurrentUserInformation_contract() {
    if (window.web3 && userContractObj) {
        const account = $("#wallet").val();
        userContractObj.methods.getCurrentUserInformation.call(function (err, result) {
            if (err) {
                console.log("Error  " + JSON.stringify(err));
                console.log("Unable to call getCurrentUserInformation");
            } else {
                if (result[1].length > 2)
                    showFullNameInputField(result[1], result[0], false);
                else
                    showFullNameInputField(result[1], result[0], true);
            }
        });
    } else {
        console.log("ERROR: Unable to Load User Contract and unable to call getCurrentUserInformation function");
    }
}

function getNumberofUsers_contract() {
    userContractObj.methods.getNumberofUsers(function (err, result) {
        if (err) {
            console.log(" Error " + JSON.stringify(err));
            console.log("Unable to call getNumberofUsers");
        } else {
            console.log("Total number of users retrieve from Contract : " + JSON.stringify(result));
        }
    });
}

function getTestingText_contract() {
    userContractObj.getTestTxt(function (err, result) {
        if (err) {
            console.log(" Error " + JSON.stringify(err));
            console.log("Unable to call getTestTxt");
        } else {
            console.log("result getTestTxt : " + JSON.stringify(result));
        }
    });
    userContractObj.getandSetTestTxt("This is new test text", function (err, result) {
        if (err) {
            console.log(" Error " + JSON.stringify(err));
            console.log("Unable to call getandSetTestTxt");
        } else {
            console.log("result getandSetTestTxt : " + JSON.stringify(result));
        }
    });
}

async function loadUserProfile() {
    getTestingText_contract();
    await isUserExist_contract();
    getCurrentUserInformation_contract();
    getNumberofUsers_contract();
}

function onRefresh() {
    getCurrentUserInformation_contract();
}

function showFullNameInputField(name, role, reset) {
    if (!reset) {
        $("#fullname").val(name);
        $("#fullname").prop("readonly", true);
        $("#role option:selected").select(role);
        $("#role option[value='" + role + "']").prop('selected', true);
        $("#register").prop("disabled", true);
    } else {
        $("#fullname").prop("readonly", false);
        $("#fullname").val("");
        $("#register").prop("disabled", false);
    }
}
