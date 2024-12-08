// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NewUsers {
    using Counters for Counters.Counter;
    Counters.Counter private _userIds;

    struct User {
        string firstName;
        string lastName;
        uint256 amountSpent;
        uint256 userId;
        address userAddress;
    }

    mapping(uint256 => User) public users;
    mapping(address => uint256) public userAddressToId;

    // Evento para notificar cuando un usuario se registre
    event UserRegistered(uint256 userId, address userAddress);

    // Función para registrar un nuevo usuario
    function registerUser(string memory firstName, string memory lastName, address userAddress) public returns (uint256) {
        // Verificar si el usuario ya existe
        require(userAddressToId[userAddress] == 0, "User already exists");

        // Incrementar el ID de usuario
        _userIds.increment();
        uint256 newUserId = _userIds.current();

        // Crear el nuevo usuario
        users[newUserId] = User({
            firstName: firstName,
            lastName: lastName,
            amountSpent: 0,
            userId: newUserId,
            userAddress: userAddress
        });

        // Asociar la dirección del usuario con su ID
        userAddressToId[userAddress] = newUserId;

        // Emitir un evento de registro
        emit UserRegistered(newUserId, userAddress);

        return newUserId;
    }

    // Función para obtener los detalles de un usuario por su dirección
    function getUserByAddress(address userAddress) public view returns (User memory) {
        uint256 userId = userAddressToId[userAddress];
        require(userId != 0, "User not found");
        return users[userId];
    }

    // Función para actualizar el monto gastado por un usuario (por ejemplo, donaciones)
    function updateAmountSpent(uint256 amount) public {
        uint256 userId = userAddressToId[msg.sender];
        require(userId != 0, "User not found");

        // Actualizar el monto gastado
        users[userId].amountSpent += amount;
    }

    // Función para obtener la lista de usuarios registrados
    function getUsers() public view returns (User[] memory) {
        User[] memory userArray = new User[](_userIds.current());
        for (uint256 i = 0; i < _userIds.current(); i++) {
            User storage user = users[i + 1];
            userArray[i] = user;
        }
        return userArray;
    }
}
