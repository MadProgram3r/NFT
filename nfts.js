require('dotenv').config({ path: require('find-config')('.env') })
const express = require('express')
const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')
const {ethers} = require('ethers')
 
//Tomar el archivo json que está dentro de los contratos
const contract = require('../NFT/artifacts/contracts/NFTcontract.sol/NFTClase.json')
const app = express();const PORT = 3000;
 
 
const {
    PRIVATE_KEY,
    API_URL,
    PUBLIC_KEY,
    PINATA_API_KEY,
    PINATA_SECRET_KEY,
    CONTRACT_ADDRESS
}=process.env
 
async function createImgInfo(imageRoute) {
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
        }
    })
    console.log(authResponse.data)
   
    const stream = fs.createReadStream(imageRoute)
    const data = new FormData()
    data.append("file", stream)
   
    const fileResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
            "Content-type": `multipart/form-data; boundary=${data._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
        }
    })
    const { IpfsHash } = fileResponse.data;
    const fileIPFS = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`
    console.log(fileIPFS)
    return fileIPFS
}
 
async function createJsonInfo(metaData) {
    const pinataJSONbody = {
        pinataContent: metaData
    }
    const jsonResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        pinataJSONbody,
        {
            headers: {
                "Content-Type": "application/json",
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_KEY
            }
        }
    )
    const { IpfsHash } = jsonResponse.data;
    const tokenURI = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`
    return tokenURI
}
 
async function mintNFT(tokenURI) {
    const provider = new ethers.providers.JsonRpcProvider(API_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const etherInterface = new ethers.utils.Interface(contract.abi)
    const nonce = await provider.getTransactionCount(PUBLIC_KEY, 'latest')
    const gasPrice = await provider.getGasPrice();
    const { chainId } = await provider.getNetwork();
 
    const transaction = {
        from: PUBLIC_KEY,
        to: CONTRACT_ADDRESS,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData("mintNFT", [PUBLIC_KEY, tokenURI])
    }
 
    const estimateGas = await provider.estimateGas(transaction)
    transaction.gasLimit = estimateGas;
 
    const signedTx = await wallet.signTransaction(transaction);
    const transactionReceipt = await provider.sendTransaction(signedTx);
    await transactionReceipt.wait();
 
    const hash = transactionReceipt.hash;
    console.log("Transaction HASH: ", hash)
 
    const receipt = await provider.getTransactionReceipt(hash);
    const { logs } = receipt;
    const tokenInBigNumber = ethers.BigNumber.from(logs[0].topics[3])
    const tokenId = tokenInBigNumber.toNumber();
    console.log("NFT TOKEN ID: ", tokenId)
 
    return hash
}
 
async function createNFT() {
    try {
        const imgInfo = await createImgInfo('../NFT/image/Ronaldo.jpg');
        const metadata = {
            image: imgInfo,
            name: 'Ronaldo', // Cambia esto por el nombre del NFT
            description: 'GOAT',
            attributes: [
                { 'trait_type': 'color', 'value': 'brown' },
                { "trait_type": 'background', 'value': 'white' }
            ]
        }
 
        const tokenUri = await createJsonInfo(metadata)
        const nftResult = await mintNFT(tokenUri)
        console.log(nftResult);
        return nftResult
    } catch (error) {
        console.error("Error creating NFT: ", error)
    }
}

async function getAllTokenOwners() {
    const provider = new ethers.providers.JsonRpcProvider(API_URL);
    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, provider);
 
   
    const transferEvents = await contractInstance.queryFilter(contractInstance.filters.Transfer());
    const tokenOwners = {};
    transferEvents.forEach(event => {
        const tokenId = event.args.tokenId.toNumber();
        const from = event.args.from;
        const to = event.args.to;
       
        tokenOwners[tokenId] = to;
       
        if (from !== ethers.constants.AddressZero) {
            delete tokenOwners[tokenId];
        }
    });
 
    console.log("Token IDs con sus propietarios:", tokenOwners);
    return tokenOwners;
}
 

async function getTokensByOwner(account) {
    const allTokenOwners = await getAllTokenOwners();
    const tokens = Object.entries(allTokenOwners)
        .filter(([_, owner]) => owner.toLowerCase() === account.toLowerCase())
        .map(([tokenId, _]) => parseInt(tokenId));
    console.log(`Tokens de la cuenta ${account}:`, tokens);
    return tokens;
}

app.get('/api/tokenOwners', async (req, res) => {
    try {
        const tokenOwners = await getAllTokenOwners();
        res.json(tokenOwners);
    } catch (error) {
        console.error("Error al obtener los propietarios de los tokens:", error);
        res.status(500).send("Error al obtener los propietarios de los tokens");
    }
});
 
// Ruta HTTP para obtener los tokens de un propietario específico
app.get('/api/tokensByOwner/:account', async (req, res) => {
    try {
        const account = req.params.account;
        const tokens = await getTokensByOwner(account);
        res.json(tokens);
    } catch (error) {
        console.error("Error al obtener los tokens del propietario:", error);
        res.status(500).send("Error al obtener los tokens del propietario");
    }
});
 
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});



//createNFT()