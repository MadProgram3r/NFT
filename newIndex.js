require('dotenv').config({ path: require('find-config')('.env') });
const FormData = require('form-data');
const axios = require('axios');
const { ethers } = require('ethers');
const express = require('express');
const cors = require('cors');  // Importa el middleware CORS
const app = express();

app.use(cors());
app.use(express.json());

// ABI de los contratos
const nftContractAbi = require('./artifacts/contracts/NFTcontract.sol/NFTClase.json');
const usersContractAbi = require('./artifacts/contracts/User.sol/NewUsers.json');
const walletContractAbi = require('./artifacts/contracts/Wallet.sol/WalletMultiSig.json');
const causeFundContractAbi = require('./artifacts/contracts/Cause.sol/CauseFund.json'); // ABI de CauseFund

// Variables de entorno
const {
    PRIVATE_KEY,
    API_URL,
    PUBLIC_KEY,
    PINATA_API_KEY,
    PINATA_SECRET_KEY,
    CONTRACT_ADDRESS,
    USER_CONTRACT,
    WALLET_CONTRACT,
    CAUSE_CONTRACT // Dirección del contrato CauseFund
} = process.env;

// Configuración del proveedor y contratos
const provider = new ethers.providers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);    

const nftContract = new ethers.Contract(CONTRACT_ADDRESS, nftContractAbi.abi, wallet);
const usersContract = new ethers.Contract(USER_CONTRACT, usersContractAbi.abi, wallet);
const walletMultiSigContract = new ethers.Contract(WALLET_CONTRACT, walletContractAbi.abi, wallet);
const causeFundContract = new ethers.Contract(CAUSE_CONTRACT, causeFundContractAbi.abi, wallet); // Instanciar CauseFund

// Función para registrar usuarios (sin firma del backend)
app.post('/register', async (req, res) => {
    const { userAddress, firstName, lastName } = req.body;

    try {
        // Verificar si el usuario ya está registrado
        const userId = await usersContract.userAddressToId(userAddress);
        if (userId.toNumber() !== 0) {
            return res.status(400).json({ message: 'User already registered' });
        }

        // Registrar al nuevo usuario en la blockchain
        const transaction = await usersContract.registerUser(firstName, lastName, userAddress);
        await transaction.wait();  // Espera a que la transacción sea confirmada

        res.status(200).json({ message: 'User registered successfully', transaction });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Función para obtener un usuario por dirección
app.post('/login', async (req, res) => {
    const { userAddress } = req.body;

    try {
        const user = await usersContract.getUserByAddress(userAddress);
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Función para actualizar la cantidad gastada por un usuario (como donaciones)
app.post('/users/updateAmountSpent', async (req, res) => {
    const { userAddress, amount } = req.body;

    try {
        // Verificar que el usuario está registrado
        const userId = await usersContract.userAddressToId(userAddress);
        if (userId.toNumber() === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Llamar al contrato para actualizar la cantidad gastada por el usuario
        const transaction = await usersContract.updateAmountSpent(ethers.utils.parseEther(amount));
        await transaction.wait();  // Espera a que la transacción sea confirmada

        res.status(200).json({ message: 'Amount spent updated successfully', transaction });
    } catch (error) {
        console.error('Error updating amount spent:', error);
        res.status(500).json({ message: 'Error updating amount spent', error: error.message });
    }
});

// Ruta para agregar una causa (solo propietario)
app.post('/cause/add', async (req, res) => {
    const { name, description, imageURL } = req.body;

    try {
        // Agregar una nueva causa en el contrato CauseFund
        const transaction = await causeFundContract.addCause(name, description, imageURL);
        await transaction.wait();  // Espera a que la transacción sea confirmada

        res.status(200).json({ message: 'Cause added successfully', transaction });
    } catch (error) {
        console.error('Error adding cause:', error);
        res.status(500).json({ message: 'Error adding cause', error: error.message });
    }
});

// Ruta para obtener una causa por ID
app.get('/cause/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const cause = await causeFundContract.getCause(id);
        res.status(200).json({ cause });
    } catch (error) {
        console.error('Error fetching cause:', error);
        res.status(500).json({ message: 'Error fetching cause', error: error.message });
    }
});

// Ruta para obtener todas las causas
app.get('/causes/all', async (req, res) => {
    try {
        const causeCount = await causeFundContract.getCauseCount();
        const causes = [];

        // Obtener todas las causas
        for (let i = 1; i <= causeCount; i++) {
            const cause = await causeFundContract.getCause(i);
            causes.push(cause);
        }

        res.status(200).json({ causes });
    } catch (error) {
        console.error('Error fetching all causes:', error);
        res.status(500).json({ message: 'Error fetching causes', error: error.message });
    }
});


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

async function mintNFT(tokenURI, address) {
    const etherInterface = new ethers.utils.Interface(nftContractAbi.abi);
    const nonce = await provider.getTransactionCount(PUBLIC_KEY, 'latest');
    const gasPrice = await provider.getGasPrice();
    const { chainId } = await provider.getNetwork();

    const transaction = {
        from: PUBLIC_KEY,
        to: CONTRACT_ADDRESS,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData("mintNFT", [address, tokenURI])
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
    const { name, description, imageURL, toAddress } = req.body;
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
        const nftResult = await mintNFT(tokenUri, toAddress);

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

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
