// let ipfs;
// let ipfsId;
// const IPFS_Gateway = "localhost";
// const IPFS_Port = "5001";
// const testing_cid = "QmT3e6myckdVqinVLKRhmXkXZi2LR49kSEeUJqvXryMV2z";

// loadIPFSImage();

// function loadIPFSImage(validCID) {
//     ipfs = window.IpfsHttpClient(IPFS_Gateway, IPFS_Port);
//     if (typeof validCID === "undefined")
//         validCID = testing_cid
//     ipfs.get(validCID, function (err, files) {
//         if (err) {
//             console.log("Error " + err);
//             if (err === "Failed to fetch");
//             alert("Check if IPFS daemon is running because it is " + err);
//             return;
//         }
//         files.forEach((file) => {
//             var arrayBufferView = new Uint8Array(file.content);
//             var blob = new Blob([arrayBufferView], { type: "image/png" });
//             var urlCreator = window.URL || window.webkitURL;
//             var imageUrl = urlCreator.createObjectURL(blob);
//             var img = document.querySelector("#ipfsTestImage");
//             img.src = imageUrl;
//         })
//     })
// }

// function addIPFSDocFile(event) {
//     ret = confirm("Are you sure you want to upload this file?");
//     if (ret === false) return;
//     event.stopPropagation();
//     event.preventDefault();
//     if (event.target.files)
//         saveToIpfsWithFilename(event.target.files);
// }

// function saveToIpfsWithFilename(files) {
//     const file = [...files][0]
//     const fileDetails = {
//         path: file.name,
//         content: file
//     };
//     const options = {
//         wrapWithDirectory: true,
//         progress: (prog) => console.log(`received: ${prog}`)
//     };
//     ipfs.add(fileDetails, options)
//         .then((response) => {
//             ipfsId = response[response.length - 1].hash;
//             displayIPFSCIDOnForm(ipfsId);
//         }).catch((err) => {
//             console.error(err)
//         })
// }

// function saveToIpfs(files) {
//     ipfs.add([...files], { progress: (prog) => console.log("received:" + prog) })
//         .then((response) => {
//             ipfsId = response[0].hash;
//             displayIPFSCIDOnForm(ipfsId);
//         }).catch((err) => {
//             console.error(err);
//         })
// }

// function getFileFromIPFS(validCID) {
//     ipfs = window.IpfsHttpClient('localhost', '4001');
//     if (typeof validCID === "undefined") {
//         alert("Non-validated CID found");
//         console.log("CID for IPFS is incorrect");
//         return;
//     }
//     ipfs.get(validCID, function (err, files) {
//         if (err) {
//             console.log("Error " + err);
//             if (err === "Failed to fetch");
//             alert("Check if IPFS daemon is running because it is " + err);
//             return;
//         }
//         files.forEach((file) => {
//             if (typeof file.content === "undefined") {
//                 console.log("Its a folder \\" + file.path + "\\");
//             } else {
//                 var n = file.path.lastIndexOf("/");
//                 var filename = file.path.substring(n + 1);
//                 var arrayBufferView = new Uint8Array(file.content);
//                 var blob = new Blob([arrayBufferView], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
//                 var urlCreator = window.URL || window.webkitURL;
//                 var Url = urlCreator.createObjectURL(blob);
//                 autoDownloadFile(filename, Url)
//             }
//         })
//     })
// }

// function displayIPFSCIDOnForm(cid) {
//     if (cid.length > 10) {
//         $("#docfile").prop("disabled", true);
//         $("#docfilemsg").text(cid);
//     }
// }

// function refreshFileForm() {
//     $("#docfile").prop("disabled", false);
//     $("#docfilemsg").text("");
// }

// function autoDownloadFile(filename, text) {
//     var element = document.createElement('a');
//     element.setAttribute('href', text);
//     element.setAttribute('download', filename);
//     element.style.display = 'none';
//     document.body.appendChild(element);
//     element.click();
//     document.body.removeChild(element);
// }

// function createDownloadFileLink(filename, url) {
//     alert(url);
//     if (typeof url !== "undefiend") {
//         var urlLink = document.querySelector("#ipfurllink");
//         urlLink.src = url;
//         urlLink.download = filename;
//     }
// }
