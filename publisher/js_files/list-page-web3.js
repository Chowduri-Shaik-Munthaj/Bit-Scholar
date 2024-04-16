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
let submittedPapers = [];
let modifiedPapers = [];

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
                //console.log("paper info result", result)
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
    var status = result[2];
    console.log("Paper status:", status); // Log the status of each paper
    var classtype = "label-info";
    var fullname = $("#fullname").text();
    var wallet = $("#wallet").text();
    var cid = result[1];
    var reviewersArray = result[3];
    var reviewers = "NONE";
    var reviewerForm = "";
    var _paperVersion = result[5];

    // Check if the status is SUBMITTED or MODIFIED1
    if (status == 6 || status == 9) {
        if (status == 6) {
            status = "SUBMITTED";
            submittedPapers.push({ id: _paperId, result: result, version: _paperVersion, keywords: keywords, fullname: fullname, wallet: wallet, reviewers: reviewers, classtype: classtype, cid: cid, reviewersArray: reviewersArray });
        } else if (status == 9) {
            status = "MODIFIED1";
            modifiedPapers.push({ id: _paperId, result: result, version: _paperVersion, keywords: keywords, fullname: fullname, wallet: wallet, reviewers: reviewers, classtype: classtype, cid: cid, reviewersArray: reviewersArray });
        }
        classtype = "label-primary";

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

        // Retrieve the file from IPFS and display paper information
        getFileFromIPFS(cid)
            .then(fileURL => {
                // Display submitted papers
                displaySubmittedPapers();
                // Display modified papers
                displayModifiedPapers();
            })
            .catch(error => {
                console.error("Error retrieving file from IPFS:", error);
            });
    } else {
        console.log("Paper status is not SUBMITTED or MODIFIED1, skipping...");
    }
}
async function getSubmitterDetails(paperId) {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const userWallet = accounts[0];

        // Call the getSubmitterDetails function from the paper contract
        const submitterDetails = await paperContractObj.methods.getSubmitterDetails(paperId).call({ from: userWallet });

        // Assuming the return value is an array where the first element is the author's name and the second element is the account ID
        const authorName = submitterDetails[1];
        const authorAccountId = submitterDetails[0];

        console.log("Author Name:", authorName);
        console.log("Author Account ID:", authorAccountId);

        return { authorName, authorAccountId };
    } catch (error) {
        console.error("Error getting submitter details:", error);
        return null;
    }
}


// Function to retrieve file from IPFS
function getFileFromIPFS(cid) {
    return new Promise((resolve, reject) => {
        // Your implementation to retrieve the file from IPFS goes here
        // For demonstration purposes, let's assume this is an asynchronous operation
        // Here, you would use the CID to fetch the file from IPFS and resolve the promise with the file URL
        // Replace this with your actual implementation
        const fileURL = `https://ipfs.io/ipfs/${cid}`; // Example URL
        resolve(fileURL);
        // If an error occurs during file retrieval, reject the promise with the error
        // reject(new Error("Failed to retrieve file from IPFS"));
    });
}

// Function to display submitted papers
function displaySubmittedPapers() {
    clearBlocks(); // Clear existing paper blocks
    submittedPapers.forEach(paper => {
        generatePaperHtmlCode(paper.id, paper.result, paper.version, "SUBMITTED", paper.keywords, paper.fullname, paper.wallet, paper.reviewers, paper.classtype, paper.cid, paper.reviewersArray);
    });
}

// Function to display modified papers
function displayModifiedPapers() {
    modifiedPapers.forEach(paper => {
        generatePaperHtmlCode(paper.id, paper.result, paper.version, "MODIFIED1", paper.keywords, paper.fullname, paper.wallet, paper.reviewers, paper.classtype, paper.cid, paper.reviewersArray);
    });
}

async function sendToReviewer(paperId) {
    try {
        // Retrieve the currently connected wallet address
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const userWallet = accounts[0];

        // Call the sendToReviewer function with the retrieved wallet address
        const result = await paperContractObj.methods.sendToReviewer(paperId).send({ from: userWallet });
        console.log("Paper sent to reviewers successfully:", result);
    } catch (error) {
        console.error("Error sending paper to reviewers:", error);
    }
}
async function sendModifiedToReviewer(paperId) {
    try {
        // Retrieve the currently connected wallet address
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const userWallet = accounts[0];

        // Call the sendToReviewer function with the retrieved wallet address
        const result = await paperContractObj.methods.sendModifiedToReviewer(paperId).send({ from: userWallet });
        console.log("Paper sent to reviewers successfully:", result);
    } catch (error) {
        console.error("Error sending paper to reviewers:", error);
    }
}
async function rejectPaper(paperId) {
    try {
        // Retrieve the currently connected wallet address
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const userWallet = accounts[0];

        // Call the rejectPaper function with the retrieved wallet address
        const result = await paperContractObj.methods.rejectPaper(paperId).send({ from: userWallet });
        console.log("Paper rejected successfully:", result);
    } catch (error) {
        console.error("Error rejecting paper:", error);
    }
}

async function generatePaperHtmlCode(_paperId, result, _paperVersion, status, keywords, fullname, wallet, reviewers, classtype, cid, reviewersArray) {
    var sendToReviewerBtn = "";
    var rejectPaperBtn = "";
    const { authorName, authorAccountId } = await getSubmitterDetails(_paperId);


    // Check if the status is "SUBMITTED" or "MODIFIED1"
    if (status === "SUBMITTED" || status === "MODIFIED1") {
        sendToReviewerBtn = "<button class=\"label label-primary\" onclick=\"sendToReviewer('" + _paperId + "')\">Send to Reviewer</button>";
        rejectPaperBtn = "<button class=\"label label-primary\" onclick=\"rejectPaper('" + _paperId + "')\">Reject Paper</button>";
    }

    var downloadLink = `<a href="${cid}" target="_blank"><span class="label label-primary">Download Paper</span></a>`;

    var paperHtml =
        "<div class='paper-block'>" +
        "<h2>Paper Name: " + result[0] + "</h2>" +
        "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
        "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
        "<h5>Download Link " + downloadLink + "</h5>" +
        sendToReviewerBtn + // Include the "Send to Reviewer" button here
        rejectPaperBtn + // Include the "Reject Paper" button here
        "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
        "<h5>Author Name : " + authorName + "</span></h5>" +
        "<h5>Author AccountId : " + authorAccountId + "</span></h5>" +
        "<h5>Reviewers: " + reviewers + "</h5>" +
        "<div id='paper-review-" + _paperId + "'></div>" +
        "</div>";

    $("#list-paperblock").append(paperHtml);

    if (reviewersArray.length > 0) {
        for (loop = _paperVersion; loop >= 0; loop--) {
            getPaperReview(_paperId, loop);
        }
    }
}
async function generatePaperHtmlCode(_paperId, result, _paperVersion, status, keywords, fullname, wallet, reviewers, classtype, cid, reviewersArray) {
    var sendToReviewerBtn = "";
    var rejectPaperBtn = "";
    const { authorName, authorAccountId } = await getSubmitterDetails(_paperId);

    // Check if the status is "SUBMITTED"
    if (status === "SUBMITTED") {
        sendToReviewerBtn = "<button class=\"label label-primary\" onclick=\"sendToReviewer('" + _paperId + "')\">Send to Reviewer</button>";
        rejectPaperBtn = "<button class=\"label label-primary\" onclick=\"rejectPaper('" + _paperId + "')\">Reject Paper</button>";
    }

    // Check if the status is "MODIFIED1"
    if (status === "MODIFIED1") {
        sendToReviewerBtn = "<button class=\"label label-primary\" onclick=\"sendModifiedToReviewer('" + _paperId + "')\">Send to Reviewer</button>";
        rejectPaperBtn = "<button class=\"label label-primary\" onclick=\"rejectPaper('" + _paperId + "')\">Reject Paper</button>";
    }

    var downloadLink = `<a href="${cid}" target="_blank"><span class="label label-primary">Download Paper</span></a>`;

    var paperHtml =
        "<div class='paper-block'>" +
        "<h2>Paper Name: " + result[0] + "</h2>" +
        "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
        "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
        "<h5>Download Link " + downloadLink + "</h5>" +
        sendToReviewerBtn + // Include the "Send to Reviewer" button here
        rejectPaperBtn + // Include the "Reject Paper" button here
        "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
        "<h5>Author Name : " + authorName + "</span></h5>" +
        "<h5>Author AccountId : " + authorAccountId + "</span></h5>" +
        "<h5>Reviewers: " + reviewers + "</h5>" +
        "<div id='paper-review-" + _paperId + "'></div>" +
        "</div>";

    $("#list-paperblock").append(paperHtml);

    if (reviewersArray.length > 0) {
        for (loop = _paperVersion; loop >= 0; loop--) {
            getPaperReview(_paperId, loop);
        }
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


$(document).ready(function () {
    loadContractForThisPage();
});
