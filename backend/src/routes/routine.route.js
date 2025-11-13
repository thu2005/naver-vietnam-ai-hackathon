import express from "express";

import { getRoutine, createRoutine, getRoutineByPrice, getRoutineByPriceRange, deleteRoutineById } from "../controllers/routine.controller.js";

const router = express.Router();

router.get('/', getRoutine);
router.post('/', createRoutine);
router.get('/range', getRoutineByPriceRange);
router.get('/price', getRoutineByPrice);
router.delete('/:id', deleteRoutineById);

export default router;