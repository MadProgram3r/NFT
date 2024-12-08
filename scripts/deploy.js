/*const { ethers } = require("hardhat");
async function main() {
    const User= await ethers.getContractFactory("NewUsers");
    const user = await User.deploy();
    const txHash= user.deployTransaction.hash;
    const txReceipt = await ethers.provider.waitForTransaction(txHash);
    console.log("Contract deployed to address: ", txReceipt.contractAddress);
}
main().then (() => {process.exit (0);})
.catch ((error) =>{
   console.log(error);
process.exit (1);
})*/


/*const { ethers } = require("hardhat");
//codigo deploy wallet
async function multiDeploy() {
    const owners = ["0xDF5D490d4eb7708c238efEa58dC504891001129B","0x370576b2ED3F6064707633C1575278196d30e269"];
    const requiredApprovals = 2;
    const WalletMultiSig = await ethers.getContractFactory("WalletMultiSig");
    const wallet = await WalletMultiSig.deploy(owners, requiredApprovals);
    console.log("WalletMultiSig deployed to: ", wallet.address);
}

multiDeploy().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
})*/

/*const { ethers } = require("hardhat");

async function main() {
    // Obtén la fábrica del contrato CauseFund
    const CauseFund = await ethers.getContractFactory("CauseFund");
    
    // Desplegar el contrato
    const causeFund = await CauseFund.deploy();
    
    // Obtener el hash de la transacción de despliegue
    const txHash = causeFund.deployTransaction.hash;
    
    // Esperar a que la transacción de despliegue sea confirmada
    const txReceipt = await ethers.provider.waitForTransaction(txHash);
    
    // Imprimir la dirección del contrato desplegado
    console.log("Contract deployed to address:", txReceipt.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
*/
const { ethers } = require("hardhat");

async function main() {
    // Obtener la fábrica del contrato NFTClase
    const NFTClase = await ethers.getContractFactory("NFTClase");

    // Desplegar el contrato
    const nftClase = await NFTClase.deploy();

    // Obtener el hash de la transacción de despliegue
    const txHash = nftClase.deployTransaction.hash;

    // Esperar a que la transacción de despliegue sea confirmada
    const txReceipt = await ethers.provider.waitForTransaction(txHash);

    // Imprimir la dirección del contrato desplegado
    console.log("Contract deployed to address:", txReceipt.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });