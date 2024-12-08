require('dotenv').config({ path: require('find-config')('.env') });
const { ethers } = require('ethers');
const contract = require('../artifacts/contracts/Wallet.sol/WalletMultiSig.json');
 
const {
    API_URL,
    WALLET
} = process.env;
 
const PUBLIC_KEYS = process.env.PUBLIC_KEY.split(',');
const PRIVATE_KEYS = process.env.PRIVATE_KEY.split(',');
 
const provider = new ethers.providers.JsonRpcProvider(API_URL);
 
async function createTransaction(method, params, account) {
    const etherInterface = new ethers.utils.Interface(contract.abi);
    const wallet = new ethers.Wallet(PRIVATE_KEYS[account], provider);
    const nonce = await provider.getTransactionCount(PUBLIC_KEYS[account], 'latest');
    const gasPrice = await provider.getGasPrice();
    const { chainId } = await provider.getNetwork();
 
    const transaction = {
        from: PUBLIC_KEYS[account],
        to: WALLET,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData(method, params)
    };
 
    const estimateGas = await provider.estimateGas(transaction);
    transaction.gasLimit = estimateGas;
 
    const signedTx = await wallet.signTransaction(transaction);
    const transactionReceipt = await provider.sendTransaction(signedTx);
    await transactionReceipt.wait();
    const hash = transactionReceipt.hash;
 
    console.log("Transaction hash:", hash);
    return await provider.getTransactionReceipt(hash);
}
 
async function SubmitTransaction(to, amount, account) {
    return await createTransaction("submitTransaction", [to, amount], account);
}
 
async function SubmitApproval(idTransaction, account) {
    return await createTransaction("approveTransaction", [idTransaction], account);
}
 
async function executeTransaction(idTransaction, account) {
    return await createTransaction("executeTransaction", [idTransaction], account);
}
 
async function Deposit(amount, account) {
    const wallet = new ethers.Wallet(PRIVATE_KEYS[account], provider);
    const walletContract = new ethers.Contract(WALLET, contract.abi, wallet);
    const tx = await walletContract.deposit({ value: ethers.utils.parseEther(amount) });
    await tx.wait();
    console.log("Deposit done:", tx.hash);
}
 
async function getTransactions() {
    const walletContract = new ethers.Contract(WALLET, contract.abi, provider);
    const result = await walletContract.getTransactions();
    const transactions = result.map(formatTransaction);
    console.log(transactions);
    return transactions;
}
 
function formatTransaction(info) {
    return {
        to: info[0],
        amount: ethers.BigNumber.from(info[1]).toString(),
        approvalCount: ethers.BigNumber.from(info[2]).toNumber(),
        executed: info[3]
    };
}
 
async function testProcess(etherAmount, toAccount, deposit, submit, approve, execute, account) {
    if (deposit) {
        await Deposit(deposit, account);
    }
    if (submit) {
        await SubmitTransaction(toAccount, ethers.utils.parseEther(etherAmount), account);
    }
 
    let transactions = await getTransactions();
    for (const [index, transaction] of transactions.entries()) {
        if (!transaction.executed && approve) {
            await SubmitApproval(index, account);
        }
    }
 
    transactions = await getTransactions();
    for (const [index, transaction] of transactions.entries()) {
        if (!transaction.executed && transaction.approvalCount === 2 && execute) {
            await executeTransaction(index, account);
        }
    }
}

async function checkBalance() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
    const balance = await provider.getBalance("0x754E28F976976b652921b337CBDef7b6F3f62887");
    console.log("Saldo disponible:", ethers.utils.formatEther(balance), "ETH");
}

//checkBalance();
    //DEPOSI
 
testProcess("0.01", "0x6e3dE260d476B5F2C791cCf8aeCE2555840ae268", "0.01" ,true, false,false,1)
 
//SUBMIT
 
// TestProcess("0.01", "0x6e3dE260d476B5F2C791cCf8aeCE2555840ae268", undefined ,true, false,false,1)
// //APPROVE  
// TestProcess("0.01", "0x6e3dE260d476B5F2C791cCf8aeCE2555840ae268", undefined ,false,true,false,0)
// TestProcess("0.01", "0x6e3dE260d476B5F2C791cCf8aeCE2555840ae268", undefined ,false,true,false,1)
 
// //EXECUTE
// TestProcess("0.01", "0x6e3dE260d476B5F2C791cCf8aeCE2555840ae268", undefined ,false,false,true,1)