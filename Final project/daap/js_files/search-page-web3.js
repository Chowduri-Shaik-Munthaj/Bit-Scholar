let userContractAbi = JSON.parse(fs.readFileSync('../contracts_json/Users.json', 'utf8'));
let paperContractAbi = JSON.parse(fs.readFileSync('../contracts_json/PaperContract.json', 'utf8'));
let reviewContractAbi = JSON.parse(fs.readFileSync('../contracts_json/Reviewers.json', 'utf8'));
let userContractObj;
let paperContractObj;
let reviewerContractObj;
let userRole = -1;

function changeWalletAddress(accounts) {
    $("#wallet").text(accounts);
}

function loadContractForThisPage() {
    if (window.web3) {
        changeWalletAddress(web3.eth.defaultAccount);
        userContractObj = web3.eth.contract(userContractAbi).at(userContractAddress);
        paperContractObj = web3.eth.contract(paperContractAbi).at(paperContractAddress);
        reviewerContractObj = web3.eth.contract(reviewerContractAbi).at(reviewerContractAddress);
        getCurrentUserInformation_contract();
    }
    else {
        console.log("ERROR: WEB3 is not initialized : loadContractForThisPage");
    }
}

function getCurrentUserInformation_contract() {
    if (window.web3 && userContractObj) {
        const account = $("#wallet").text();
        userContractObj.getCurrentUserInformation({}, { from: account }, function (err, result) {
            if (err) {
                console.log("Error  " + JSON.stringify(err));
                console.log("Unable to call getCurrentUserInformation");
            }
            else {
                htmlBasedAlertsAndText(result);
                generateListHtmlBlocks(result);
            }
        });
    }
    else {
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
        }
        else if (parseInt(result[0]) === 0) $("#role").text("Author");
        else $("#role").text("Researcher");
        $("#fullname").text(result[1]);
    }
    else {
        userRole = -1;
        $("#fullname").text(result[1]);
        $('total_papers').text("0");
        $("#role").text("None Registered User");
        clearBlocks();
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
        paperContractObj.getAllLatestPapersIds({}, { from: account }, function (err, result) {
            if (err) {
                console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                console.log("REASON: Unable to retrieve latest Ids");
            }
            else {
                if (result.length > 1) {
                    for (loop = 0; loop < result.length - 1; loop++) {
                        paperContractObj.getPaperValues(result[loop], { from: account }, function (err, result2) {
                            if (err) {
                                console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                                console.log("REASON: Unable to retrieve Paper values by Ids");
                            }
                            else {
                                addListHtmlDivs(result2, result[loop]);
                            }
                        });
                    }
                }
            }
        });
    }
    else {
        console.log("ERROR: Unable to Load Contract and unable to call getCurrentUserInformation function");
    }
}

function addListHtmlDivs(result, _paperId) {
    var status = result[3];
    var classtype = "label-info";
    var fullname = $("#fullname").text();
    var wallet = $("#wallet").text();
    var cid = result[1];
    var paperId = _paperId;
    var reviewersArray = result[4];
    var reviewers = "NONE";
    var reviewerForm = "";
    var _paperVersion = result[6];

    if (status == 0) { status = "LATEST"; classtype = "label-info"; }
    else if (status == 1) { status = "REVIEWING"; classtype = "label-warning"; }
    else if (status == 2) { status = "PASSED"; classtype = "label-success"; }
    else if (status == 3) { status = "RESUBMIT"; classtype = "label-primary"; }
    else if (status == 4) { status = "REJECTED"; classtype = "label-danger"; }
    else { status = "NONE"; classtype = "label-info"; }

    var keywords = "";
    result[5].forEach((keyword) => keywords = keywords + " " + web3.toUtf8(keyword));

    if (reviewersArray.length > 0) {
        reviewers = "";
        index = 1;
        for (let id of reviewersArray) {
            if (wallet == id) { reviewers += "<br>" + index + ") " + fullname + " "; }
            else {
                reviewers += "<br>" + index + ") " + id;
            }
            index++;
        }
    }

    $("<div><h2>Paper Name: " + result[0] + "</h2>" +
        "<h5><span class=\"glyphicon glyphicon-book\"></span> Tags / Keywords:" + keywords + "</span> </h5>" +
        "<h5>Review Status <span class=\"label " + classtype + "\">" + status + "</span></h5>" +
        "<h5>Download Link <a href='#' onclick='getFileFromIPFS(\"" + cid + "\")'><span class=\"label label-primary\">Download Paper</span></a> " +
        "<h5>Revision Version: " + _paperVersion + "</span></h5>" +
        "<h5>Reviewers: " + reviewers + "</h5>" +
        "<h5>Author AccountId : " + wallet + "</span></h5>" +
        "</div><hr>").appendTo("#list-paperblock");
}

function assignedReviewerOfPaper(_paperId) {
    if (userRole != 1) {
        alert(userRole + "You are not allowed to act like a reviewer, you have to registered as a reviewer to review any paper");
        return 0;
    }
    var confirmedRet = confirm("Are you sure you want to assign yourself as a reviewer?");
    if (confirmedRet) {
        if (window.web3 && userContractObj && paperContractObj) {
            const account = $("#wallet").text();
            paperContractObj.assignReviewerToPaper(_paperId, { from: account }, function (err, result) {
                if (err) {
                    console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                    console.log("REASON: Unable to assign reviewer on this paper");
                } else {
                    alert("You have assigned yourself to be a reviewer of this paper");
                    getCurrentUserInformation_contract();
                }
            });
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
        "          <input  id='file_" + _paperId + "' style='width: min-content' onchange=\"uploadRemakrsFileOnIPFS(event);\" type=\"file\" accept=\".doc,.docx,.pdf\" class=\"form-control\"  placeholder=\"docfile\" required=\"required\" data-validation-required-message=\"Please select your document.\">\n" +
        "   <b>Comments</b><br>\n" +
        "          <textarea id='remarks_" + _paperId + "'></textarea><br>" +
        "   <b>Change Status</b><br>\n" +
        "          <select id='status_" + _paperId + "'> <option value='1'>Reviewing</option><option value='2'>Passed </option><option value='3'>Resubmit </option> <option value='4'>Rejected </option>  </select>" +
        "   <br><br><button type='button' class='btn btn-default' onclick='submitReviewedContent(" + _paperId + ");'>Submit My Review</button>\n" +
        " <input type='hidden' value='" + _paperVersion + "' id='version_" + _paperId + "'>" +
        "</div>";

    return htmlcodeFile;
}

function uploadRemakrsFileOnIPFS(event) {
    if (userRole != 1) {
        alert("You are not allowed to act like a reviewer, you have to registered as a reviewer to use reviewer operation");
        return 0;
    }
    addIPFSDocFile(event);
}

function submitReviewedContent(_paperId) {
    if (userRole != 1) {
        alert("You are not allowed to act like a reviewer, you have to registered as a reviewer to use reviewer operation");
        return 0;
    }

    var wallet = $("#wallet").text();
    var cid = ipfsId;
    var comments = $("#remarks_" + _paperId).val();
    var version = $("#version_" + _paperId).val();
    var status = $("#status_" + _paperId).val();
    var paperId = _paperId;

    if (window.web3 && userContractObj && paperContractObj) {
        const account = $("#wallet").text();
        reviewerContractObj.addPaperReview(_paperId, version, comments, cid, status, { from: account }, function (err, result) {
            if (err) {
                console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                console.log("REASON: Unable to upload reviewers remarks about the paper");
            } else {
                reviewerContractObj.setPaperStatus(_paperId, status, { from: account }, function (err, result) {
                    if (err) {
                        console.log("CALL-ERROR-REASON: " + JSON.stringify(err));
                        console.log("REASON: Unable setPaperStatus about the paper");
                    } else {
                        getCurrentUserInformation_contract();
                    }
                });
            }
        });
    } else {
        console.log("ERROR: Unable to Load Contract and unable to call addPaperReview function");
    }
}
