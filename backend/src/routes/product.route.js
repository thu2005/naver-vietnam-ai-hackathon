import express from "express";
import { addProduct, addProductThumbnail, listProducts, addProductUrl, getProductById, deleteProductById, getProductsByUVIndex, getProductsByUserSkinType, getProductPriceRanges } from "../controllers/product.controller.js";

const router = express.Router();

router.post('/', addProduct);
router.get('/price-ranges', getProductPriceRanges);
router.get('/skin-type', getProductsByUserSkinType);
router.get('/uv', getProductsByUVIndex);
router.put('/:id', addProductThumbnail);
router.put('/:id', addProductUrl);
router.get('/:id', getProductById);
router.delete('/:id', deleteProductById);
router.get('/', listProducts);

export default router;