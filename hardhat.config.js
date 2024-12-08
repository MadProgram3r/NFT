require('dotenv').config();
require('@nomiclabs/hardhat-ethers');

PRIVATE_KEY='748cc5478aa6cb9e40399d8996dd0d9bc01a04ec0ea302e896f5f35d77d58745'
API_URL='https://eth-sepolia.g.alchemy.com/v2/TrbDQLb6eigI_0Oye2rULiE_ZPeA0Ond'

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  defaultNetwork:'sepolia',
  networks:{
    sepolia:{
      url:API_URL,
      accounts:[`0x${PRIVATE_KEY}`]
    }
  }
};
