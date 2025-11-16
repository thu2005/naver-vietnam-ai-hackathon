import express from "express";

import { getRoutine, createRoutine, getRoutineByPrice, getRoutineByBudgetRange, deleteRoutineById } from "../controllers/routine.controller.js";

const router = express.Router();

router.get('/', getRoutine);
router.post('/', createRoutine);
router.get('/budget', getRoutineByBudgetRange);
router.get('/price', getRoutineByPrice); 
router.delete('/:id', deleteRoutineById);

export default router;