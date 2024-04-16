var Author1 = artifacts.require('./Authors.sol');
var Users1 = artifacts.require('./Users.sol');

module.exports = function (deployer, network, accounts) {

    deployer.deploy(Author1, Users1.address, { from: accounts[0] });
};