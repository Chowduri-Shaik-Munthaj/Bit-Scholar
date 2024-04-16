let userContractObj;
let paperContractObj;
let reviewerContractObj;
let userContractAddress;
let reviewerContractAddress;
let paperContractAddress;
let reviewIpfdId;
async function fetchContracts() {
    try {
        const userResponse = await fetch('/Users.json');
        const papersResponse = await fetch('/Papers.json');
        const reviewerResponse = await fetch('/Reviewers.json')
        userContract = await userResponse.json();
        papersContract = await papersResponse.json();
        reviewerContract = await reviewerResponse.json();
        userContractAddress = userContract.networks['5777'].address;

        paperContractAddress = papersContract.networks['5777'].address;
        reviewerContractAddress = reviewerContract.networks['5777'].address;
        console.log("Contracts fetched successfully.");
        loadContractForThisPage();
    } catch (error) {
        console.error("Error fetching contracts:", error);
    }
}
let userRole = -1;
window.addEventListener('load', fetchContracts);
const providerUrl = "http://127.0.0.1:7545";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

function changeWalletAddress(accounts) {
    $("#wallet").text(accounts);
}
// async function addIPFSDocFile(event) {
//     const file = event.target.files[0];

//     try {
//         const cid = await uploadToIPFS(file);

//         if (cid) {
//             // Log the CID of the uploaded file
//             console.log("File uploaded to IPFS with CID:", cid);

//             // Now you can use the CID for further processing, such as storing it in a smart contract
//             // For example:
//             // storeCIDInSmartContract(cid);
//         } else {
//             console.error("Error uploading file to IPFS: CID not received");
//         }
//     } catch (error) {
//         console.error("Error uploading file to IPFS:", error);
//     }
// }





function loadContractForThisPage() {
    if (window.web3) {
        changeWalletAddress(web3.eth.defaultAccount);
        userContractObj = new web3.eth.Contract(userContract.abi, userContractAddress);
        paperContractObj = new web3.eth.Contract(papersContract.abi, paperContractAddress);
        reviewerContractObj = new web3.eth.Contract(reviewerContract.abi, reviewerContractAddress);
        // console.log("LOADED 1: Users Contract Address: --- " + '0xCd4891ee86e9Bf7b3a03e63BD752C3b5a56080c1');
        // console.log("LOADED 2: Papers Contract Address: --- " + '0x022f5A235645F19D629e8edbf9FD95057aE642f0');
        // console.log("LOADED 3: Reviewer Contract Address: --- " + '0x13F1A0C2EE7d7E886bEF9e4DC00Fc1E31EaCdf9A');
        // console.log("user contract object", userContractObj)
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                // console.log(accounts);
                changeWalletAddress(accounts[0]); // Assuming the first account is the user's account
            })
            .catch(error => console.error("Error fetching accounts:", error));
        console.log("Latest block: ");
        web3.eth.getBlockNumber(console.log);
        getCurrentUserInformation_contract();
    }
    else {
        console.log("ERROR: WEB3 is not initialized : loadContractForThisPage");
    }
}

// function getCurrentUserInformation_contract() {
//     if (window.web3 && userContractObj) {
//         const account = $("#wallet").text();
//         userContractObj.methods.getCurrentUserInformation().call({ from: account }, function (err, result) {
//             if (err) {
//                 console.log("Error  " + JSON.stringify(err));
//                 console.log("Unable to call getCurrentUserInformation");
//             }
//             else {
//                 console.log("Current user information: " + JSON.stringify(result));
//                 htmlBasedAlertsAndText(result);
//                 console.log(result)
//                 generateListHtmlBlocks(result);
//             }
//         });
//     }
//     else {
//         console.log("ERROR: Unable to Load Contract and unable to call getCurrentUserInformation function");
//     }
// }
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
                    console.log("Error  " + JSON.stringify(err));
                    console.log("Unable to call getCurrentUserInformation");
                } else {
                    console.log("Current user information: " + JSON.stringify(result));
                    htmlBasedAlertsAndText(result);
                    console.log(result)
                    generateListHtmlBlocks(result);
                }
            });
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    } else {
        console.log("ERROR: Unable to Load Contract and unable to call getCurrentUserInformation function");
    }
}

function htmlBasedAlertsAndText(result) {
    if (result[1].length > 2) {
        $("#roleAlert").show();
        userRole = result[0];
        if (parseInt(result[0]) === 1) {
            $("#role").text("Reviewer");
            $("#roleAlert").hide();
        } else if (parseInt(result[0]) === 0) {
            $("#role").text("Author");
        } else {
            $("#role").text("Researcher");
        }
        $("#fullname").text(result[1]);
        // Update total papers
        //$('#total_papers').text(result[2]); // Assuming result[2] contains total papers count
    } else {
        userRole = -1;
        $("#fullname").text(result[1]);
        $('#total_papers').text("0"); // Setting total papers to 0
        $("#role").text("None Registered User");
        clearBlocks(); // Assuming clearBlocks is defined elsewhere
    }
}


function generateListHtmlBlocks(result) {
    if (result[1].length > 2) {
        clearBlocks();
        listAllLatestPapers();
    }
    else {
        clearBlocks();
    }
}

function clearBlocks() {
    $("#list-paperblock").text("");
}

function listAllLatestPapers() {
    if (window.web3 && userContractObj && paperContractObj) {
        const account = $("#wallet").text();
        console.log("FUNCTION-C-CALL: getAllPapersIds ");
        console.log("WALLET ACCOUNT:" + account);

        userContractObj.methods.getCurrentUserInformation().call({ from: account }, function (err, result) {
            if (err) {
                console.log("Error fetching current user information:", err);
                return;
            }

            const userRole = parseInt(result[0]);
            if (userRole !== 1) {
                console.log("User is not a reviewer. Access denied.");
                return;
            }

            paperContractObj.methods.getAllPapersIds().call({ from: account }, function (err, result) {
                if (err) {
                    console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                    console.log("REASON: Unable to retrieve latest Ids");
                } else {
                    console.log("CALL-SUCCESS: " + JSON.stringify(result));
                    console.log("CALL-ACHIEVE: Received current papers ids successfully");
                    if (result.length > 1) {
                        console.log("FUNCTION-C-CALL: getPaperValues ");
                        for (let loop = 0; loop < result.length - 1; loop++) {
                            const index = result[loop];
                            console.log("loop: " + index);
                            console.log("FUNCTION-C-CALL: getPaperValues ");
                            console.log("PARAMETERS:" + result[loop]);

                            paperContractObj.methods.getPaperValues(index).call({ from: account }, function (err, result) {
                                console.log("loop: -" + index);
                                if (err) {
                                    console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                                    console.log("REASON: Unable to retrieve Paper values by Ids");
                                } else {
                                    console.log("CALL-SUCCESS: " + JSON.stringify(result));
                                    console.log("CALL-ACHIEVE: Received current papers values via ids successfully" + result[loop]);
                                    addListHtmlDivs(result, index);
                                }
                            });
                        }
                    }
                }
            });
        });
    } else {
        console.log("ERROR: Unable to Load Contract and unable to call listAllLatestPapers function");
    }
}

// function addListHtmlDivs(result, _paperId) {
//     var status = result[3];
//     var classtype = "label-info";
//     var fullname = $("#fullname").text();
//     var wallet = $("#wallet").text();
//     var cid = result[1];
//     var paperId = _paperId;
//     var reviewersArray = result[4];
//     var reviewers = "NONE";
//     var reviewerForm = "";
//     var _paperVersion = result[6];
//     var assignme_reviewer_button = "";
//     if (status == 0) { status = "LATEST"; classtype = "label-info"; }
//     else if (status == 1) { status = "REVIEWING"; classtype = "label-warning"; }
//     else if (status == 2) { status = "PASSED"; classtype = "label-success"; }
//     else if (status == 3) { status = "RESUBMIT"; classtype = "label-primary"; }
//     else if (status == 4) { status = "REJECTED"; classtype = "label-danger"; }
//     else if (status == 5) { status = "MODIFIED"; classtype = "label-primary"; }
//     else { status = "NONE"; classtype = "label-info"; }
//     var keywords = "";
//     result[5].forEach((keyword) => keywords = keywords + " " + web3.utils.hexToUtf8(keyword));
//     if (reviewersArray.length > 0) {
//         reviewers = "";
//         index = 1;
//         for (let id of reviewersArray) {
//             console.log("Reviewers assigned: " + id);
//             if (wallet == id) { reviewers += "<br>" + index + ") " + fullname + " "; }
//             else {
//                 reviewers += "<br>" + index + ") " + id;
//             }
//             index++;
//         }
//         if (status !== "PASSED") {
//             reviewerForm = generateReviewerForm(_paperId, _paperVersion);
//         }
//     }
//     if (status !== "PASSED") {
//         assignme_reviewer_button = "<button type='button' class='btn btn-default' onclick='assignedReviewerOfPaper(" + _paperId + ");'>Assign me as Reviewer</button>\n";
//     }
//     $("<div><h2>Paper Name: " + result[0] + "</h2>" +
//         "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
//         "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
//         "<h5>Paper Id : <span class=\"label " + classtype + "\">" + _paperId + "</span></h5>" +
//         "<h5>Download Link <a href='#' onclick='getFileFromIPFS(\"" + cid + "\")'><span class=\"label label-primary\">Download Paper</span></a> " +
//         "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
//         "<h5>Reviewers: " + reviewers + "</h5>" +
//         assignme_reviewer_button +
//         "<div id='remarks-'></div>" +
//         "<p></p>" +
//         reviewerForm +
//         "</div><hr>").appendTo("#list-paperblock");
// }
// Existing code...

function addListHtmlDivs(result, _paperId) {
    var status = result[2];
    var classtype = "label-info";
    var fullname = $("#fullname").text();
    var wallet = $("#wallet").text();
    var cid = result[1];
    var paperId = _paperId;
    var reviewersArray = result[3];
    var reviewers = "NONE";
    var reviewerForm = "";
    var _paperVersion = result[5];
    var assignme_reviewer_button = "";

    if (status == 0) { status = "LATEST"; classtype = "label-info"; }
    else if (status == 1) { status = "REVIEWING"; classtype = "label-warning"; }
    else if (status == 2) { status = "PASSED"; classtype = "label-success"; }
    else if (status == 3) { status = "RESUBMIT"; classtype = "label-primary"; }
    else if (status == 4) { status = "REJECTED"; classtype = "label-danger"; }
    else if (status == 5) { status = "MODIFIED"; classtype = "label-primary"; }
    else if (status == 6) { status = "SUBMITTED"; classtype = "label-info"; } // Newly added condition
    else if (status == 7) { status = "PAYMENT"; classtype = "label-info"; }
    else if (status == 8) { status = "PUBLISHED"; classtype = "label-success"; }
    else if (status == 9) { status = "MODIFIED1"; classtype = "label-primary"; } // Newly added condition
    else { status = "NONE"; classtype = "label-info"; }

    // Skip displaying if paper status is "SUBMITTED"
    if (status === "SUBMITTED" || status === "PASSED" || status === "REJECTED" || status === "PUBLISHED" || status === "RESUBMIT" || status === "RESUBMIT" || status === "MODIFIED1" || status === "PAYMENT") {
        console.log("Paper with status not permitted.");
        return;
    }

    var keywords = "";
    result[4].forEach((keyword) => keywords = keywords + " " + web3.utils.hexToUtf8(keyword));
    if (reviewersArray.length > 0) {
        reviewers = "";
        index = 1;
        for (let id of reviewersArray) {
            console.log("Reviewers assigned: " + id);
            if (wallet == id) { reviewers += "<br>" + index + ") " + fullname + " "; }
            else {
                reviewers += "<br>" + index + ") " + id;
            }
            index++;
        }
        if (status !== "PASSED") {
            reviewerForm = generateReviewerForm(_paperId, _paperVersion);
        }
    }
    if (status !== "PASSED") {
        assignme_reviewer_button = "<button type='button' class='btn btn-default' onclick='assignedReviewerOfPaper(" + _paperId + ");'>Assign me as Reviewer</button>\n";
    }
    var downloadLink = `<a href="${cid}""><span class="label label-primary">Download Paper</span></a>`;

    $("<div><h2>Paper Name: " + result[0] + "</h2>" +
        "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
        "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
        "<h5>Paper Id : <span class=\"label " + classtype + "\">" + _paperId + "</span></h5>" +
        "<h5>Download Link " + downloadLink + "</h5>" +
        "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
        "<h5>Reviewers: " + reviewers + "</h5>" +
        assignme_reviewer_button +
        "<div id='remarks-'></div>" +
        "<p></p>" +
        reviewerForm +
        "</div><hr>").appendTo("#list-paperblock");
}
// Remaining code...

async function assignedReviewerOfPaper(_paperId) {
    const userWallet = $("#wallet").text();

    // Check if the current user is authorized to assign papers
    const userResult = await userContractObj.methods.getCurrentUserInformation().call({ from: userWallet });

    const userRole = parseInt(userResult[0]);

    // Check if the current user is a reviewer
    if (userRole !== 1) {
        alert(userRole + " You are not allowed to act like a reviewer. You have to be registered as a reviewer to review any paper.");
        return;
    }

    // Check if the submitter's address and the user's address are different
    const authorOfPaper = await paperContractObj.methods.getSubmitterDetails(_paperId).call({ from: userWallet });
    if (userWallet.toLowerCase() === authorOfPaper[0].toLowerCase()) {
        alert("You cannot assign yourself as a reviewer for your own paper.");
        return;
    }

    var confirmedRet = confirm("Are you sure you want to assign yourself as a reviewer?");
    if (confirmedRet) {
        if (window.web3 && userContractObj && paperContractObj) {
            console.log("FUNCTION-C-CALL: assignReviewerToPaper ");
            console.log("PARAMETER:_paperId - " + _paperId);
            console.log("WALLET ACCOUNT:" + userWallet);
            //console.log(paperContractObj)
            try {
                const gasEstimate = await paperContractObj.methods.assignReviewerToPaper(_paperId).estimateGas({ from: userWallet });
                const result = await paperContractObj.methods.assignReviewerToPaper(_paperId).send({ from: userWallet, gas: gasEstimate + 100000 });
                console.log("CALL-SUCCESS: " + JSON.stringify(result));
                console.log("CALL-ACHIEVE: Store a new reviewer on this paper");
                alert("You have assigned yourself to be a reviewer of this paper");
                getCurrentUserInformation_contract();
                $("#assign_reviewer_button_" + _paperId).hide();
            } catch (error) {
                console.error("Error assigning reviewer to the paper:", error);
                alert("Error assigning reviewer to the paper: " + error.message); // Display more informative error message
            }
        } else {
            console.log("ERROR: Unable to Load Contract and unable to call assignReviewToPaper function");
        }
    }
}

function generateReviewerForm(_paperId, _paperVersion) {
    var htmlcodeFile =
        "<button data-toggle=\"collapse\" data-target=\"#operation_" + _paperId + "\">Operations</button>\n" +
        "<div id=\"operation_" + _paperId + "\" class=\"collapse\" style='background-color: #d4eaff;margin-left: 30px;'>" +
        "   <b>Upload remarks on the paper</b>\n" +
        "          <input  id='ipfs_id" + _paperId + "' style='width: min-content' \" type=\"text\" class=\"form-control\"  placeholder=\"Revied_id\" required=\"required\" data-validation-required-message=\"Please enter remarks ipfa id.\">\n" +
        "   <b>Comments</b><br>\n" +
        "          <textarea id='remarks_" + _paperId + "'></textarea><br>" +
        "   <b>Change Status</b><br>\n" +
        "          <select id='status_" + _paperId + "'>" +
        "               <option value='2'>Passed </option>" + // Only include the "Passed" option
        "          </select>" +
        "   <br><br><button type='button' class='btn btn-default' onclick='submitReviewedContent(" + _paperId + ", document.getElementById(\"ipfs_id" + _paperId + "\").value);'>Submit My Review</button>\n" +
        " <input type='hidden' value='" + _paperVersion + "' id='version_" + _paperId + "'>" +
        "</div>";
    return htmlcodeFile;
}





async function submitReviewedContent(_paperId, ipfsId) {
    const userWallet = $("#wallet").text();

    // Check if the current user is authorized to submit reviews
    const userResult = await userContractObj.methods.getCurrentUserInformation().call({ from: userWallet });
    const userRole = parseInt(userResult[0]);

    var cid = ipfsId;
    var comments = $("#remarks_" + _paperId).val();
    var version = $("#version_" + _paperId).val();
    var status = $("#status_" + _paperId).val();

    // Check if necessary data is available
    if (!cid || !comments || !version || !status) {
        alert("Please fill in all required fields.");
        return;
    }

    try {
        // Check if the current user is a reviewer
        if (userRole !== 1) {
            alert("You are not authorized to submit reviews. You must be registered as a reviewer.");
            return;
        }

        // Check if the reviewer exists for the specified paper ID
        // const reviewers = await paperContractObj.methods.getReviewers(_paperId).call({ from: userWallet });
        // console.log("reviewers", reviewers)
        // console.log("userWallet", userWallet)
        const reviewers = await paperContractObj.methods.getReviewers(_paperId).call({ from: userWallet });
        const lowercaseReviewers = reviewers.map(address => address.toLowerCase());
        console.log("Lowercase reviewers", lowercaseReviewers);

        if (!lowercaseReviewers.includes(userWallet.toLowerCase())) {
            alert("You are not assigned as a reviewer for this paper.");
            return;
        }

        // Submit the review to the smart contract
        const gasEstimate = await reviewerContractObj.methods.addPaperReview(_paperId, version, comments, cid, status).estimateGas({ from: userWallet });
        const result = await reviewerContractObj.methods.addPaperReview(_paperId, version, comments, cid, status).send({ from: userWallet, gas: gasEstimate + 100000 });

        console.log("CALL-SUCCESS: " + JSON.stringify(result));
        console.log("CALL-ACHIEVE: Reviewer's comments and remarks are recorded on the blockchain");

        // Set the paper status
        const setStatusResult = await reviewerContractObj.methods.setPaperStatus(_paperId, status).send({ from: userWallet, gas: gasEstimate + 100000 });

        console.log("CALL-SUCCESS: " + JSON.stringify(setStatusResult));
        console.log("CALL-ACHIEVE: Reviewer's setPaperStatus recorded on the blockchain");

        // Update UI and hide the review form
        getCurrentUserInformation_contract();
        $("#operation_" + _paperId).hide();
    } catch (error) {
        console.error("Error submitting review:", error);
        alert("Error submitting review: " + error.message); // Display more informative error message
    }
}

// async function getFileFromIPFS(cid) {
//     try {
//         // Replace 'localhost' with the hostname of your local IPFS gateway
//         const response = await fetch(`http://localhost:5001/api/v0/get?arg=${cid}`);
//         if (response.ok) {
//             // Convert the response to text
//             const data = await response.text();
//             return data;
//         } else {
//             console.error("Failed to fetch file from IPFS:", response.statusText);
//             return null;
//         }
//     } catch (error) {
//         console.error("Error fetching file from IPFS:", error);
//         return null;
//     }
// }
// async function fetchFromIPFS(cid) {
//     const response = await fetch(`https://ipfs.infura.io/ipfs/${cid}`);
//     const data = await response.text();
//     return data;
// }


