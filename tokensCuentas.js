const { ethers } = require('ethers');
 
// URL de Alchemy en Sepolia
const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/7LPlPcfYliSjD4LwxBNmRrSFnYoWnxno");
 
// Dirección del contrato ERC-721 y ABI para consultar tokens
const contractAddress = "0xe33Bc168Fc219350A5ccCc996857b3377F42d194";
const abi = [
    {
        "constant": true,
        "inputs": [{ "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "index", "type": "uint256" }
        ],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{ "name": "tokenId", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
 
// Conectar al contrato ERC-721
const contract = require('../NFT/artifacts/contracts/NFTcontract.sol/NFTClase.json')

async function getTokensFromBlock(blockNumber) {
    try {
        // Obtener el bloque según el número especificado
        const block = await provider.getBlockWithTransactions(blockNumber);
        const uniqueAccounts = new Set();
 
        // Extraer las direcciones de las cuentas de cada transacción
        block.transactions.forEach(tx => {
            uniqueAccounts.add(tx.from);
            uniqueAccounts.add(tx.to);
        });
 
        // Consultar los tokens de cada cuenta única
        for (const account of uniqueAccounts) {
            console.log(`Tokens de la cuenta ${account}:`);
            const balance = await contract.balanceOf(account);
            const tokenIds = [];
            for (let i = 0; i < balance; i++) {
                const tokenId = await contract.tokenOfOwnerByIndex(account, i);
                tokenIds.push(tokenId.toString());
            }
 
            console.log(`Tokens asociados: ${tokenIds.length > 0 ? tokenIds : 'No tiene tokens ERC-721'}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
async function getTokenIdsByAccount(account) {
    try {
        // Obtener el balance de tokens de la cuenta
        const balance = await contract.balanceOf(account);
       
        // Verificar si el balance es mayor que 0
        if (balance.toNumber() === 0) {
            console.log(`La cuenta ${account} no posee tokens.`);
            return [];
        }
 
        const tokenIds = [];
       
        // Iterar sobre cada token propiedad de la cuenta
        for (let i = 0; i < balance; i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(account, i);
            tokenIds.push(tokenId.toString());
        }
 
        return tokenIds;
    } catch (error) {
        console.error("Error al obtener los IDs de tokens:", error);
        return [];
    }
}

 
// Llama a la función con el número de bloque deseado
const blockNumber = 6970282;  // Reemplaza con el número de bloque que quieras consultar
getTokensFromBlock(blockNumber);
//getTokenIdsByAccount('0x754E28F976976b652921b337CBDef7b6F3f62887').then(id => console.log('Tokens', id));