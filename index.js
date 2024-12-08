require('dotenv').config({ path: require('find-config')('.env') });
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const { ethers } = require('ethers');
const express = require('express');
const app = express();
app.use(express.json());

const contract = require('../NFT/artifacts/contracts/NFTcontract.sol/NFTClase.json');

const {
    PRIVATE_KEY,
    API_URL,
    PUBLIC_KEY,
    PINATA_API_KEY,
    PINATA_SECRET_KEY,
    CONTRACT_ADDRESS
} = process.env;

// Configuración del proveedor y contrato
const provider = new ethers.providers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, wallet);

async function createImgInfo(imageURL) {
    const response = await axios.get(imageURL, { responseType: 'stream' });
    const data = new FormData();
    data.append("file", response.data);

    const fileResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
            "Content-type": `multipart/form-data; boundary=${data._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
        }
    });

    const { IpfsHash } = fileResponse.data;
    return `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
}

async function createJsonInfo(metaData) {
    const pinataJSONbody = { pinataContent: metaData };
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
    );
    const { IpfsHash } = jsonResponse.data;
    return `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
}

async function mintNFT(tokenURI) {
    const etherInterface = new ethers.utils.Interface(contract.abi);
    const nonce = await provider.getTransactionCount(PUBLIC_KEY, 'latest');
    const gasPrice = await provider.getGasPrice();
    const { chainId } = await provider.getNetwork();

    const transaction = {
        from: PUBLIC_KEY,
        to: CONTRACT_ADDRESS,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData("mintNFT", [PUBLIC_KEY, tokenURI])
    };

    const estimateGas = await provider.estimateGas(transaction);
    transaction.gasLimit = estimateGas;

    const signedTx = await wallet.signTransaction(transaction);
    const transactionReceipt = await provider.sendTransaction(signedTx);
    await transactionReceipt.wait();

    const hash = transactionReceipt.hash;
    const receipt = await provider.getTransactionReceipt(hash);
    const { logs } = receipt;

    const tokenInBigNumber = ethers.BigNumber.from(logs[0].topics[3]);
    const tokenId = tokenInBigNumber.toNumber();

    console.log("Transaction HASH: ", hash);
    console.log("NFT TOKEN ID: ", tokenId);

    return { hash, tokenId, contractAddress: CONTRACT_ADDRESS };
}

// Ruta para crear un NFT
app.post('/createNFT', async (req, res) => {
    const { name, description, imageURL } = req.body;
    try {
        const imgInfo = await createImgInfo(imageURL);
        const metadata = {
            image: imgInfo,
            name: name || 'NFT',
            description: description || 'No description provided',
            attributes: [
                { 'trait_type': 'color', 'value': 'brown' },
                { 'trait_type': 'background', 'value': 'white' }
            ]
        };
        const tokenUri = await createJsonInfo(metadata);
        const nftResult = await mintNFT(tokenUri);

        res.status(200).json({
            message: 'NFT created successfully',
            transactionHash: nftResult.hash,
            tokenId: nftResult.tokenId,
            contractAddress: nftResult.contractAddress
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating NFT', error: error.message });
    }
});

// Nueva ruta para obtener todos los token IDs de una cuenta
app.get('/getTokens/:account', async (req, res) => {
    const { account } = req.params;
    try {
        const balance = await nftContract.balanceOf(account);
        const tokenIds = [];

        for (let i = 0; i < balance; i++) {
            const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
            tokenIds.push(tokenId.toString());
        }

        res.status(200).json({
            message: `Tokens owned by ${account}`,
            tokens: tokenIds
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tokens', error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
