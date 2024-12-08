// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';  // Importa Ownable de OpenZeppelin

contract CauseFund is Ownable {
    // Estructura para almacenar los datos de cada causa
    struct Cause {
        string name;
        string description;
        string imageURL;
        uint256 totalDonations;
    }

    // Mapeo para almacenar las causas por ID
    mapping(uint256 => Cause) public causes;
    
    // Contador para asignar IDs únicos a cada causa
    uint256 public causeCount;

    // Evento para emitir cuando se agregue una nueva causa
    event CauseAdded(uint256 causeId, string name, string description, string imageURL);

    // Función para agregar una nueva causa (solo puede ser ejecutada por el propietario)
    function addCause(string memory _name, string memory _description, string memory _imageURL) public onlyOwner {
        causeCount++; // Incrementa el contador de causas para asignar un nuevo ID

        // Crear la nueva causa y almacenarla en el mapeo
        causes[causeCount] = Cause({
            name: _name,
            description: _description,
            imageURL: _imageURL,
            totalDonations: 0  // Inicialmente no hay donaciones
        });

        // Emitir un evento para indicar que se agregó una nueva causa
        emit CauseAdded(causeCount, _name, _description, _imageURL);
    }

    // Función para obtener los detalles de una causa por su ID
    function getCause(uint256 _causeId) public view returns (Cause memory) {
        require(_causeId > 0 && _causeId <= causeCount, "Causa no encontrada");
        return causes[_causeId];
    }

    // Función para obtener el número total de causas registradas
    function getCauseCount() public view returns (uint256) {
        return causeCount;
    }
}
