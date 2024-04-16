pragma solidity ^0.5.0;
import "./Authors.sol";


contract Papers {
     struct SubmitterDetails {
        address submitterAddress;
        string submitterName;
        string submitterRole;
    }

    mapping(uint => SubmitterDetails) public submitterDetails;
    event submittedPaper(uint32 paperid,address useraccount);
    event assignedReviewerEvent(uint paperid,address useraccount);
    event PaymentMade(uint indexed paperId, address indexed payer, uint amount);
    Authors authorsContractObj;
    address authorContractAddress;
    enum PaperStatus {LATEST,REVIEWING,PASSED,RESUBMIT,REJECTED,MODIFIED,SUBMITED,PAYMENT,PUBLISHED,MODIFIED1,NONE}
    struct History {
        PaperStatus status;
        string ipfs_cid;
    }
    struct PaperFiles
    {
        uint32 paperUniqueNumber;
        address author;
        string title;
        string ipfs_cid;
        PaperStatus status;
        bytes32 [] keywords; //experiment: ["0x63616e6469646174653100000000000000000000000000000000000000000000","0x6332000000000000000000000000000000000000000000000000000000000000","0x6333000000000000000000000000000000000000000000000000000000000000"]

        address [] reviewers;
        uint    totalReviewer;
        uint version_number;

        mapping(uint=> History)  versionHistory;

        bool paperExist;
    }
    mapping(uint=> PaperFiles) private paperFiles;

    uint32 totalPapers; // represent id as well

    bytes32 testingBytes; // testing variable
    address payable owner;
    constructor(address _authorContractAddress) public {
        totalPapers = 0;
        authorContractAddress =_authorContractAddress;
        authorsContractObj = Authors(authorContractAddress);
        owner = msg.sender;
    }
    function uploadNewPaper(string memory _ipfs, string memory _title, bytes32[] memory _keywords, string memory _submitterRole, string memory _userName,address _paperOwner) public {
        require(bytes(_title).length <= 100, "Title is too long.");
        require(bytes(_ipfs).length <= 69, "IPFS CID is wrong");

        uint32 paperId = totalPapers;
        PaperFiles storage updateP = paperFiles[paperId];

        submitterDetails[paperId] = SubmitterDetails({
            submitterAddress: _paperOwner,
            submitterName: _userName,
            submitterRole: _submitterRole
        });

        //LATEST PAPER
        paperId = totalPapers; //new paper id
        updateP.status = PaperStatus.SUBMITED;
        updateP.author = msg.sender;
        updateP.title = _title;
        updateP.ipfs_cid = _ipfs;
        updateP.keywords = _keywords;
        updateP.paperUniqueNumber = paperId;
        updateP.totalReviewer = 0;
        updateP.version_number = 0;
        updateP.paperExist = true;
        totalPapers++;

        authorsContractObj.addPaperInUserFolder(paperId, msg.sender);
        emit submittedPaper(paperId, msg.sender);
    }

    function getSubmitterDetails(uint _paperId) public view returns (address, string memory, string memory) {
        SubmitterDetails memory details = submitterDetails[_paperId];
        return (details.submitterAddress, details.submitterName, details.submitterRole);
    }
    function uploadModifiedPaper(uint32 _paper_id,string memory _ipfs,string memory _title,bytes32[] memory _keywords) public returns(uint32)
    {

        require(paperFiles[_paper_id].paperExist,"Paper must be exist");

        require(bytes(_title).length <= 100, "Title is too long.");
        require(bytes(_ipfs).length <= 69, "IPFS CID is wrong");

        uint32 paperId = _paper_id;
        uint oldversion = paperFiles[paperId].version_number;
        History storage updateH =  paperFiles[paperId].versionHistory[oldversion];
        updateH.ipfs_cid = paperFiles[paperId].ipfs_cid; // save old ipfs id
        updateH.status = paperFiles[paperId].status; // save old ipfs status
        paperFiles[paperId].author = msg.sender; // again add author name
        paperFiles[paperId].title = _title; // change title name if required
        paperFiles[paperId].ipfs_cid = _ipfs; // new ipfs
        paperFiles[paperId].status = PaperStatus.MODIFIED1;
        for(uint loop = 0; loop<=paperFiles[paperId].keywords.length;loop++)
            paperFiles[paperId].keywords.pop();
        paperFiles[paperId].keywords = _keywords;
        paperFiles[paperId].version_number = paperFiles[paperId].version_number + 1 ;

        return paperId;
    }
    function getLatestId() public view returns(uint)
    {
        return totalPapers;
    }
    function getPaperValues(uint _paperId) public view returns(string memory title,string memory ipfscid,PaperStatus status,address[] memory reviewers,bytes32[] memory keywords,uint version)
    {
        return (paperFiles[_paperId].title,paperFiles[_paperId].ipfs_cid,paperFiles[_paperId].status,paperFiles[_paperId].reviewers,paperFiles[_paperId].keywords, paperFiles[_paperId].version_number);
    }
    function getVersionHistory(uint _paperId,uint version_number) public view returns(string memory,PaperStatus )
    {
        return (paperFiles[_paperId].versionHistory[version_number].ipfs_cid,paperFiles[_paperId].versionHistory[version_number].status);
    }
    function getPaperKeyword(uint _paperId,uint keywordIndex) public view returns(bytes32)
    {
        return paperFiles[_paperId].keywords[keywordIndex];
    }
    function getSetBytes32Test(bytes32 para1) public
    {
        testingBytes = para1;
    }
    function getBytes32Test() public view returns(bytes32)
    {
        return testingBytes;
    }
    function getAllLatestPapersIds() public view returns(uint[] memory ids)
    {
        uint index = 0;
        ids = new uint[](totalPapers+1);

        for(uint loop=0; loop<totalPapers;loop++)
        {
            if(paperFiles[loop].status == PaperStatus.LATEST)
            {
                ids[index] = loop;
                index++;
            }
        }

        ids[index] = 0; //end of array

        return ids;
    }
    function getAllPapersIds() public view returns(uint[] memory ids)
    {
        uint index = 0;
        ids = new uint[](totalPapers+1);

        for(uint loop=0; loop<totalPapers;loop++)
        {
            ids[index] = loop;
            index++;
        }

        // ids[index] = 0; //end of array

        return ids;
    }

    function isPaperExist(uint _paperId) public view returns (bool ret)
    {
        if(paperFiles[_paperId].paperExist)
            return true;

        return false;
    }
    function isReviewerAlreadyAssigned(uint _paperId) public view returns(bool ret)
    {
        if(paperFiles[_paperId].totalReviewer>0)
        {
            // check if this reviewer exist already inside this paper
            for(uint loop =0; loop<paperFiles[_paperId].totalReviewer; loop++)
            {
                if(paperFiles[_paperId].reviewers[loop]==tx.origin)
                {
                    return true;
                }
            }
        }

        return false;
    }
    function assignReviewerToPaper(uint _paperId) public
    {
        require(paperFiles[_paperId].paperExist,"Paper must be exist");

        require(!isReviewerAlreadyAssigned(_paperId),"Reviewer is already assigned for this paper");

        if(paperFiles[_paperId].totalReviewer==0)
        {
            paperFiles[_paperId].status = PaperStatus.REVIEWING;
        }

        paperFiles[_paperId].reviewers.push(tx.origin);

        paperFiles[_paperId].totalReviewer++;

    }
    function setPaperStatusByReviewer(uint _paperId,PaperStatus _status) public
    {
        require(paperFiles[_paperId].paperExist,"Paper must be exist");
        require(isReviewerAlreadyAssigned(_paperId),"Reviewer is not assigned for this paper, he must be assigned on this before changing any status");

        paperFiles[_paperId].status = _status;

        emit assignedReviewerEvent(_paperId,tx.origin);
    }
    function getReviewers(uint _paperId) public view returns (address[] memory) {
        return paperFiles[_paperId].reviewers;
    }
    function sendToReviewer(uint _paperId) public {
        require(paperFiles[_paperId].paperExist, "Paper must exist");
        require(paperFiles[_paperId].status == PaperStatus.SUBMITED, "Paper must be in SUBMITED status to send to reviewers");

        paperFiles[_paperId].status = PaperStatus.LATEST;
    }
    function sendModifiedToReviewer(uint _paperId) public {
        require(paperFiles[_paperId].paperExist, "Paper must exist");
        require(paperFiles[_paperId].status == PaperStatus.MODIFIED1, "Paper must be in MODIFIED1 status to send to reviewers");

        paperFiles[_paperId].status = PaperStatus.MODIFIED;
    }
    function rejectPaper(uint _paperId) public {
        require(paperFiles[_paperId].paperExist, "Paper must exist");


        paperFiles[_paperId].status = PaperStatus.REJECTED;

       
       
    }
    function sendForReSubmission(uint _paperId) public {
        require(paperFiles[_paperId].paperExist, "Paper must exist");


        paperFiles[_paperId].status = PaperStatus.RESUBMIT;

       
       
    }
    function askForPayment(uint _paperId) public {
        require(paperFiles[_paperId].paperExist, "Paper must exist");
        require(paperFiles[_paperId].status == PaperStatus.PASSED, "Paper must be in SUBBMITED status to send to reviewers");

        paperFiles[_paperId].status = PaperStatus.PAYMENT;

        
       
    }
    function makePayment(uint _paperId) public payable {
    require(paperFiles[_paperId].paperExist, "Paper must exist");
    require(paperFiles[_paperId].status == PaperStatus.PAYMENT, "Paper must be in PAYMENT status to make a payment");

    // Ensure that the sender sends exactly 0.5 ether
    require(msg.value == 0.5 ether, "Please send exactly 0.5 ether.");

    // Transfer the payment to the owner
    owner.transfer(0.5 ether); // Fixed amount of 0.5 ether

    // Update the paper status
    paperFiles[_paperId].status = PaperStatus.PUBLISHED;

    emit PaymentMade(_paperId, msg.sender, 0.5 ether);
}



}
