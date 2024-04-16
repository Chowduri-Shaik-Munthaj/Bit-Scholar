pragma solidity ^0.5.0;
import "./Users.sol";

contract Authors{
    Users userContract;
    address userContractAddress;
    event addPaper(uint32 paperId,address authorId, address paperContractId);
    struct Folder {
        uint32 [] paperIds;
        uint32 totalPapers;
    }
    mapping (address => Folder) private paperReferences;

    constructor(address _userContractaddress) public {

        userContractAddress =_userContractaddress;
        userContract = Users(userContractAddress);
    }

    function addPaperInUserFolder(uint32 _paperid,address _authorAddress) public //returns(uint32)// onlyAuthorRole public
    {
        Folder storage folder = paperReferences[_authorAddress];

        uint32[] storage paperId = folder.paperIds;

        paperId.push(_paperid); //by default it will store value from 0 portion and then it will move on automatically you do not need specifically to mention element idenx like paperId[index]

        folder.totalPapers++;

        emit addPaper(folder.totalPapers,tx.origin,msg.sender);
    }

    function getAllPaperIds() public view returns (uint32[] memory _paperIds)
    {
        uint32 [] memory paperIds = paperReferences[msg.sender].paperIds;

        return paperIds;
    }

    function getNumUsers() public view returns(uint )
    {
        return userContract.getNumberofUsers();
    }

    function verifyUser() public view returns(bool ret)
    {
        return userContract.isUserExist_SmartCall();
    }

}
