let authorContractObj;
let userContractObj;
let paperContractObj;
let reviewerContractObj;
let userContract;
let authorContract;
let reviewerContract;
let papersContract;
let userContractAddress;
let authorContractAddress;
let reviewerContractAddress;
let paperContractAddress;
let addedPaperIds = new Set();

const providerUrl = "http://127.0.0.1:7545";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

async function fetchContracts() {
    try {
        const userResponse = await fetch('/Users.json');
        const authorResponse = await fetch('/Authors.json');
        const papersResponse = await fetch('/Papers.json');
        const reviewerResponse = await fetch('/Reviewers.json');
        userContract = await userResponse.json();
        authorContract = await authorResponse.json();
        papersContract = await papersResponse.json();
        reviewerContract = await reviewerResponse.json();
        userContractAddress = userContract.networks['5777'].address;
        authorContractAddress = authorContract.networks['5777'].address;
        console.log("contract addresses", userContractAddress, authorContractAddress)
        paperContractAddress = papersContract.networks['5777'].address;
        reviewerContractAddress = reviewerContract.networks['5777'].address;
        console.log("Contracts fetched successfully.");
    } catch (error) {
        console.error("Error fetching contracts:", error);
    }
}

window.addEventListener('load', fetchContracts);
window.addEventListener('load', loadContractForThisPage);

function changeWalletAddress(accounts) {
    $("#wallet").text(accounts);
}

async function loadContractForThisPage() {
    try {
        await fetchContracts();
        if (window.web3 && userContract && papersContract && reviewerContract && authorContract) {
            changeWalletAddress(web3.eth.defaultAccount);
            userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
            paperContractObj = new web3.eth.Contract(papersContract.abi, paperContractAddress);
            reviewerContractObj = new web3.eth.Contract(reviewerContract.abi, reviewerContractAddress);
            authorContractObj = new web3.eth.Contract(authorContract.abi, authorContractAddress);

            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(accounts => {
                    changeWalletAddress(accounts[0]);
                })
                .catch(error => console.error("Error fetching accounts:", error));

            console.log("Latest block: ");
            web3.eth.getBlockNumber(console.log);
            getCurrentUserInformation_contract();
        } else {
            console.log("ERROR: WEB3 is not initialized or contract data is missing.");
        }
    } catch (error) {
        console.log("Error loading contracts for this page:", error);
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
            const account = accounts[0];
            console.log("Connected account:", account);

            userContractObj.methods.getCurrentUserInformation().call({ from: account }, function (err, result) {
                if (err) {
                    console.log("Error: " + JSON.stringify(err));
                    console.log("Unable to call getCurrentUserInformation");
                } else {
                    console.log("Current user information: " + JSON.stringify(result));
                    if (result[1].length > 2) {
                        if (parseInt(result[0]) === 0) $("#role").text("Author");
                        else if (parseInt(result[0]) === 1) $("#role").text("Reviewer");
                        else $("#role").text("Researcher");
                        $("#fullname").text(result[1]);
                        listAllPapers();
                    } else {
                        $("#fullname").text(result[1]);
                        $('#total_papers').text("0");
                        $("#role").text("None Registered User");
                        clearBlocks();
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

function listAllPapers() {
    console.log("Fetching all papers...");
    if (paperContractObj && web3) {
        paperContractObj.methods.getAllPapersIds().call({}, function (err, result) {
            if (result) {
                console.log("All paper IDs:", result);
                var papersIdsArray = result;
                addPaperListBlocks(papersIdsArray);
            }
            if (err) {
                console.log("ERROR: Unable to call getAllPaperIds" + JSON.stringify(result));
            }
        });
    } else {
        console.log("ERROR: Paper Contract is not Loaded");
    }
}

function clearBlocks() {
    $("#list-paperblock").empty();
}

function addPaperListBlocks(papersIdsArray) {
    console.log("Adding paper list blocks...");
    clearBlocks();
    for (let id of papersIdsArray) {
        if (!addedPaperIds.has(id)) {
            addedPaperIds.add(id);
            console.log("Processing paper ID:", id);
            getPaperInfo(id);
        }
    }
    $("#total_papers").text(addedPaperIds.size);
}

function getPaperInfo(paperId) {
    var userWallet = $("#wallet").text();
    if (paperContractObj && web3) {
        paperContractObj.methods.getPaperValues(paperId).call({ from: userWallet }, (err, result) => {
            if (result) {
                console.log("paper info result", result)
                addListHtmlDivs(result, paperId);
            }
            if (err) {
                console.log("ERROR: Unable to call getPaperValues" + JSON.stringify(result));
            }
        });
    } else {
        console.log("ERROR: paper Contract is not Loaded");
    }
}

function addListHtmlDivs(result, _paperId) {
    window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
            if (accounts.length === 0) {
                console.error("No accounts found.");
                return;
            }
            const userWallet = accounts[0];

            if (paperContractObj && web3) {
                paperContractObj.methods.getSubmitterDetails(_paperId).call({ from: userWallet }, function (err, submitterResult) {
                    if (err) {
                        console.log("Error getting submitter details:", err);
                        return;
                    }
                    var paperOwner = submitterResult[0];
                    console.log("Paper Owner:", paperOwner);

                    console.log("User Wallet:", userWallet);

                    if (userWallet.toLowerCase() === paperOwner.toLowerCase()) {
                        console.log("User is the owner of the paper.");
                        var status = result[2];
                        var classtype = "label-info";
                        var fullname = $("#fullname").text();
                        var wallet = $("#wallet").text();
                        var cid = result[1];
                        var reviewersArray = result[3];
                        var reviewers = "NONE";
                        var reviewerForm = "";
                        var _paperVersion = result[5];
                        if (status == 0) {
                            status = "LATEST";
                            classtype = "label-info";
                        } else if (status == 1) {
                            status = "REVIEWING";
                            classtype = "label-warning";
                        } else if (status == 2) {
                            status = "PASSED";
                            classtype = "label-success";
                        } else if (status == 3) {
                            status = "RESUBMIT";
                            classtype = "label-primary";
                        } else if (status == 4) {
                            status = "REJECTED";
                            classtype = "label-danger";
                        } else if (status == 5) {
                            status = "MODIFIED";
                            classtype = "label-primary";
                        }
                        else if (status == 6) { status = "SUBMITTED"; classtype = "label-info"; } // Newly added condition
                        else if (status == 7) { status = "PAYMENT"; classtype = "label-info"; }
                        else if (status == 8) { status = "PUBLISHED"; classtype = "label-success"; }
                        else if (status == 9) { status = "MODIFIED1"; classtype = "label-primary"; }
                        else {
                            status = "NONE";
                            classtype = "label-info";
                        }
                        var keywords = "";
                        result[4].forEach((keyword) => keywords = keywords + " " + web3.utils.toUtf8(keyword));
                        if (reviewersArray.length > 0) {
                            reviewers = "";
                            index = 1;
                            for (let id of reviewersArray) {
                                if (wallet == id) {
                                    reviewers += "<br>" + index + ") " + fullname + " ";
                                } else {
                                    reviewers += "<br>" + index + ") " + id;
                                }
                                index++;
                            }
                        }
                        generatePaperHtmlCode(_paperId, result, _paperVersion, status, keywords, fullname, wallet, reviewers, classtype, cid, reviewersArray, _paperVersion);
                    } else {
                        console.log("User is not the owner or reviewer of the paper.");
                    }
                });
            } else {
                console.log("ERROR: Paper Contract is not Loaded");
            }
        })
        .catch(error => console.error("Error fetching accounts:", error));
}

// Function to display paper review after clicking "Review Paper" button
function displayPaperReview(paperId, version) {
    // Clear previous paper reviews if any
    $("#paper-review-" + paperId).empty();

    // Call the getPaperReview function to fetch and display paper reviews
    getPaperReview(paperId, version);
}

async function makePayment(paperId) {
    const paymentAmount = web3.utils.toWei('0.5', 'ether');
    try {
        // Request permission from MetaMask to connect to the user's account
        console.log("amount", paymentAmount)
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userWallet = accounts[0]; // Get the first account (connected account) from MetaMask

        // Prepare the transaction object
        paperContractObj.methods.makePayment(paperId).send({ from: userWallet, value: paymentAmount }, function (err, result) {
            if (result) {
                console.log("Payment made successfully. Transaction hash:", result);
                alert("Payment made successfully. Transaction hash:", result);

            }
            if (err) {
                console.log("Transaction Faild", err);
                alert("Payment Failed");
            }
        });


    } catch (error) {
        console.error("Error making payment:", error);
    }
}
function getPaperReview(paperId, version) {
    var userWallet = $("#wallet").text();
    if (reviewerContractObj && web3) {
        reviewerContractObj.methods.getPaperReview(paperId, version).call({ from: userWallet }, (err, result) => {
            if (result) {
                console.log("paper review result", result);
                // Extract returned values
                var reviewerComments = result[0];
                var reviewerCid = result[1];
                var reviewerAddress = result[2];
                var status = result[3];
                console.log(status)

                // Update the UI to display the reviewer comments and CID
                var reviewHtml =
                    "<div>" +
                    "<h5>Reviewer Comments: " + reviewerComments + "</h5>" +
                    "<h5>Reviewer CID: <a href='" + reviewerCid + "'>" + reviewerCid + "</a></h5>" +
                    "<h5>Reviewer Address: " + reviewerAddress + "</h5>" +
                    "<h5>Status: " + getStatusText(status) + "</h5>" +
                    "</div>";

                $("#paper-review-" + paperId).append(reviewHtml);
            }
            if (err) {
                console.log("ERROR: Unable to call getPaperReview", err);
            }
        });
    } else {
        console.log("ERROR: Paper Contract is not Loaded");
    }
}

function getStatusText(status) {
    switch (status) {
        case 0:
            return "LATEST";
        case 1:
            return "REVIEWING";
        case 2:
            return "PASSED";
        case 3:
            return "RESUBMIT";
        case 4:
            return "REJECTED";
        case 5:
            return "MODIFIED";
        case 6:
            return "SUBMITTED";
        case 7:
            return "PAYMENT";
        case 8:
            return "PUBLISHED";
        case 9:
            return "MODIFIED1";
        default:
            return "NONE";
    }
}




function generatePaperHtmlCode(_paperId, result, _paperVersion, status, keywords, fullname, wallet, reviewers, classtype, cid, reviewersArray) {
    var Payment_link = "";
    var Modify_button = "";
    var Review_button = "";
    if (status === "PAYMENT") {
        Payment_link = "<button class=\"label label-primary\" onclick=\"makePayment('" + _paperId + "')\">Make Payment</button>";
    }
    if (status === "RESUBMIT") {
        Modify_button = "<a class=\"label label-info\"  href=\"modify?modify=" + _paperId + "\">Modify Paper</a></h5>";
        Review_button = "<button class=\"label label-info\" onclick=\"displayPaperReview('" + _paperId + "', '" + _paperVersion + "')\">Paper Review</button>";
    }
    var downloadLink = `<a href="${cid}""><span class="label label-primary">Download Paper</span></a>`;

    var reviewersDisplay = status === "PUBLISHED" ? reviewers : "None"; // Display reviewers only if status is "PUBLISHED"

    var paperHtml =
        "<div class='paper-block'>" +
        "<h2>Paper Name: " + result[0] + "</h2>" +
        "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
        "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
        "<h5>Download Link " + downloadLink + "</h5>" +
        Payment_link + Modify_button + Review_button +
        "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
        "<h5>Author Name : " + fullname + "</span></h5>" +
        "<h5>Author AccountId : " + wallet + "</span></h5>" +
        "<h5>Reviewers: " + reviewersDisplay + "</h5>" + // Display reviewers based on status
        "<div id='paper-review-" + _paperId + "'></div>" +
        "</div>";

    $("#list-paperblock").append(paperHtml);

    // Display paper review only when the status is "RESUBMIT"
    if (status === "RESUBMIT") {
        getPaperReview(_paperId, _paperVersion);
    }
}
