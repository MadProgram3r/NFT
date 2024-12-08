require('dotenv').config({ path: require('find-config')('.env') })
const { ethers } = require('ethers')
const contract = require('../artifacts/contracts/Sales.sol/Sales.json')

const {

    API_URL,
    PRIVATE_KEY,
    PUBLIC_KEY,
    SALES_CONTRACT
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
async function createSale(userId,items,prices) {
    const provider = new ethers.providers.JsonRpcBatchProvider(API_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const transaction = await createTransaction(provider, 'insertSale', [userId, items, prices]);
    const estimateGas = await provider.estimateGas(transaction);
    transaction["gasLimit"] = estimateGas;
    const signedTx = await wallet.signTransaction(transaction);
    const transactionReceipt = await provider.sendTransaction(signedTx);
    await transactionReceipt.wait();
    const hash= transactionReceipt.hash;
    const receipt = await provider.getTransactionReceipt(hash);
return receipt;

}
async function getSales() {

    const result = await salescontract.getSales()
    var sales = []
    result.forEach(sale => {
        sales.push(formatSale(sale))

    });
    return sales;
}
async function getSale(salesId) {
const salescontract= getContract()
const result = await salescontract.getSaleById(salesId)
return formatSale(result)
}
async function getSalesByUserId(userId) {
const result= await salescontract.getSalesByUserId(userId)
var sales = []
result.forEach((element=>{
    sales.push(formatSale(element))
}))
return sales;
}

function getContract(){
    const provider = new ethers.providers.JsonRpcBatchProvider(API_URL);
    const salesContract= new ethers.Contract(
        SALES_CONTRACT,
        contract.abi,
        provider
    )
    return salesContract;
}

async function formatSale(info) {
    let sale ={
    salesId:ethers.BigNumber.from(info[0]).toNumber(),
    userId:ethers.BigNumber.from(info[1]).toNumber(),
}
let items=[]
info[2].forEach((element,index)=>{
    let item = {name:element,price:ethers.BigNumber.from(info[3][index]).toNumber()}
    items.push(item)

})
sale.items.items
return sale
}
module.exports = {   
     getSale: getSale,  
       getSales: getSales,  
         getSalesByUserId: getSalesByUserId,  
           createSale: createSale}