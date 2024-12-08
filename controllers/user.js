require('dotenv').config({ path: require('find-config')('.env') })
const { ethers } = require('ethers')
const contract = require('../artifacts/contracts/User.sol/Users.json')

const {

    API_URL,
    PRIVATE_KEY,
    PUBLIC_KEY,
    USER_CONTRACT
} = process.env

async function createTransaction(provider,method,params){
    const etherInterface = new ether.utils.Interface(contract.abi);
    const nonce = await provider.getTransactionCount(PUBLIC_KEY,'latest')
    const gasPrice = await provider.getGasPrice();
    const network = await provider.getNetwork();
    const { chainId } = network;
    const transaction = {
        from: PUBLIC_KEY,
        to: SALES_CONTRACT,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData(method, params)
    }
    return transaction;
}

async function createUser(userId,items,prices) {
   const provider = new ethers.providers.JsonRpcProvider(API_URL)
   const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
   const transaction = await createTransaction(provider,"insertUser",[firstName,lastNAme])
   estimateGas = await provider.estimateGas(transaction)
   transaction["gasLimit"] = estimateGas
   const signedTx = await wallet.signTransaction(transaction)
   const transactionReceipt = await provider.sendTransaction(signedTx)
   await transactionReceipt.wait()
   const hash = transactionReceipt.hash
   const receipt = await provider.getTransactionReceipt(hash)
   return receipt

}

async function getUsers(){
    const userContract = getContract();
    const res = await userContract.getUser()
    var users=[]
    res.forEach(user => {
        users.push(formatUser(user))
    });
    return users
}

async function getUser(userId){
    const userContract = getContract()
    const result=await userContract.getUserByid(userId)
}


async function updateAmount(userId,amount){
    const provider = new ethers.providers.JsonRpcProvider(API_URL)
    const wallet = new ethers.Wallet(API_URL,provider)
    const transaction = await createTransaction(provider,"registerSale",[userId,amount])
    const estimateGas = await provider.estimateGas(transaction)
    transaction["gasLimit"] = estimateGas
    const signedTx = await wallet.signTransaction(transaction)
    const transactionReceipt = await provider.sendTransaction(signedTx)
    await transactionReceipt.wait()
    const hash = transactionReceipt.hash
    const receipt = await provider.getTransactionReceipt(hash)
    return receipt
}


    function getContract(){
        const provider = new ethers.providers.JsonRpcProvider(API_URL)
        const useContract = new ethers.Contract(
            USER_CONTRACT,
            contract.abi,
            provider
        )
        return useContract
    }

    function formatUser(data){
        return{
            firstName:info[0],
            lastName:info[1],
            amount:ethers.BigNumber.from(info[2]).toNumber(),
            id:ethers.BigNumber.from(info[3]).toNumber()
        }
    }

    module.exports = {
        getUser:getUser
    }