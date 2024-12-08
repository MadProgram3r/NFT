//SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract WalletMultiSig {
    address[] public owners;
    uint public requiredApprovals;
    mapping(address => bool) public isOwner;
    
    struct Transaction {
        address to; //destinatario
        uint amount; //en Wei
        uint approvalCount;
        bool executed; //si esta ejecutada o no
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approvals; //mapa de las direcciones de quienes lo aprobaron

    event Deposit(address indexed sender, uint amount);

    constructor(address[]memory _owners, uint _requiredApprovals) {
        require(_owners.length > 0, "Debes tener owners");
        require(_requiredApprovals > 0 &&_requiredApprovals <= _owners.length, "El numero de aprobaciones requeridas debe ser mayor a 0 y menor o igual al numero de propietarios");
        for(uint i = 0; i < _owners.length; i++) {
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        requiredApprovals = _requiredApprovals;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "No es owner");
        _;
    }

    //Propone una nueva transacción 
    function submitTransaction(address _to, uint amount) public onlyOwner {
        transactions.push(Transaction({
            to: _to,
            amount: amount,
            approvalCount: 0,
            executed: false
        }));
    }

    //Aprobar una transacción
    function approveTransaction(uint _transactionId) public onlyOwner{
        Transaction storage transaction = transactions[_transactionId];
        require(!transaction.executed, "La transaccion ya fue ejecutada");
        require(!approvals[_transactionId][msg.sender], "Ya has aprobado esta transaccion");
        approvals[_transactionId][msg.sender] = true;
        transaction.approvalCount += 1;
    }

    //Executar una transacción
    function executeTransaction(uint _transactionId) public onlyOwner {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.approvalCount >= requiredApprovals, "No se han aprobado suficientes transacciones");
        require(!transaction.executed, "La transaccion ya fue ejecutada");

        transaction.executed = true;
        payable(transaction.to).transfer(transaction.amount);
    }
    
    //Obtiene todas las transacciones
    function getTransactions() public view returns(Transaction[] memory) {
        return transactions;
    }

    //Hace un deposito al contrato
    function deposit() public payable {
        require(msg.value > 0, "El deposito debe ser mayor a 0");
        emit Deposit(msg.sender, msg.value);
    }

}