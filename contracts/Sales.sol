pragma solidity >=0.8.0 < 0.9.0;
 
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
 
contract Sales is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _salesIds;
 
    struct SaleStruct {
        uint256 saleId;
        uint256 userId;
        string[] items;
        uint256[] prices;
    }
 
    mapping (uint256 => SaleStruct) public sales;
 
    function getSales() public view returns (SaleStruct[] memory) {
        SaleStruct[] memory salesArray = new SaleStruct[](_salesIds.current());
        for (uint256 i = 0; i < _salesIds.current(); i++) {
            SaleStruct storage sale = sales[i + 1];
            salesArray[i] = sale;
        }
        return salesArray;
    }
 
    function insertSale(uint256 userId, string[] memory items, uint256[] memory prices) public onlyOwner returns (uint256) {
        _salesIds.increment();
        uint256 newSaleId = _salesIds.current();
        SaleStruct memory newSale = SaleStruct(newSaleId, userId, items, prices);
        sales[newSaleId] = newSale;
        return newSaleId;
    }
 
    function getSaleById(uint256 saleId) public view returns (SaleStruct memory) {
        return sales[saleId];
    }
 
    function getSalesByUserId(uint256 userId) public view returns (SaleStruct[] memory) {
        SaleStruct[] memory salesArray = new SaleStruct[](_salesIds.current());
        uint256 count = 0;
        for (uint256 i = 0; i < _salesIds.current(); i++) {
            SaleStruct storage sale = sales[i + 1];
            if (sale.userId == userId) {
                salesArray[count] = sale;
                count++;
            }
        }
        SaleStruct[] memory result = new SaleStruct[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = salesArray[j];
        }
        return result;
    }
}