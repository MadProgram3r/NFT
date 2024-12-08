const express = require("express");
const router = express.Router();
const salesController = require("../controllers/sales");

router.get("/sales", async (req, res) => {
  try {
    let sales = await salesController.getSales();
    res.json(sales);
  } catch (err) {
    res.status(500).sjon({ message: error.message });
  }
});

router.post("/sales", async (req, res) => {
  try {
    let sale = await salesController.createSale(
      req.body.userId,
      req.body.items,
      req.body.price
    );
    res.json(sale);
  } catch (err) {
    res.status(500).sjon({ message: err.message });
  }
});

router.get('/sale/:id',async(req,res)=>{
    try {
        let sale = await salesController.getSale(req.params.id)
        res.json(sale)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
})

router.get('/usersales/:id',async (req,res)=>{
    try {
        let sales = await salesController.getSalesByUserId(req.params.id)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
})

module.exports = router;
