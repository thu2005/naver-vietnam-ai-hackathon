import { generateRoutine } from "../services/routine.service";
import Routine from "../models/Routine";

export const createRoutine = async (req, res) => {
    try {
        const { skinType } = req.body;

        const { morning, night } = await generateRoutine(skinType);
        const morningDoc = new Routine({
            name: 'morning',
            steps: morning.steps,
            skinType: skinType.toLowerCase(),
            totalPrice: morning.totalPrice
        });
        const nightDoc = new Routine({
            name: 'night',
            steps: night.steps,
            skinType: skinType.toLowerCase(),
            totalPrice: night.totalPrice
        });
        await morningDoc.save();
        await nightDoc.save();
        res.status(200).json({ message: 'Routine generated successfully', morningDoc, nightDoc });
    } catch (error) {
        res.status(500).json({ message: 'Error generating routine', error: error.message });
    }
}

export const getRoutineByPriceRange = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;
        if (!maxPrice) {
            return res.status(400).json({ message: 'maxPrice query parameter is required' });
        }
        if (!minPrice) {
            return res.status(400).json({ message: 'minPrice query parameter is required' });
        }
        const routines = await Routine.find({ totalPrice: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } });
        res.status(200).json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routines', error: error.message });
    }
}

export const getRoutineByPrice = async (req, res) => {
    try {
        const { price } = req.query;
        if (!price) {
            return res.status(400).json({ message: 'Price query parameter is required' });
        }
        const routines = await Routine.find({ totalPrice: { $gte: parseFloat(price) } });
        res.status(200).json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routines', error: error.message });
    }
}

export const deleteRoutineById = async(req, res) => {
    try {
        const { id } = req.params;
        const deletedRoutine = await Routine.findByIdAndDelete(id);
        if (!deletedRoutine) {
            return res.status(404).json({ message: 'Routine not found' });
        }
        res.status(200).json({ message: 'Routine deleted successfully', user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting routine', error: error.message });
    }
}