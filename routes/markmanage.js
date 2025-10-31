const express = require('express');
const route = express.Router();
const calculation = require('../models/calculation');
const academic = require('../models/academic');

// ------------------------------------------------------------------------------------------------------- //

route.post('/calc', async (req, res) => 
{
    try 
    {
        const { cia1, cia2, ass1, ass2, maxCia, maxEse, academicSem, inputValue, level0, level1, level2, level3 } = req.body;

        if (!cia1 || !cia2 || !ass1 || !ass2 || !maxCia || !maxEse) {
            return res.status(400).json({ error: 'All fields are Required.' });
        }

        const calculationData = 
        {
            c1_lot: cia1.lot, c1_mot: cia1.mot, c1_hot: cia1.hot,
            c2_lot: cia2.lot, c2_mot: cia2.mot, c2_hot: cia2.hot,
            a1_lot: ass1.lot, a1_mot: ass1.mot, a1_hot: ass1.hot,
            a2_lot: ass2.lot, a2_mot: ass2.mot, a2_hot: ass2.hot,
            c_lot: maxCia.lot,
            c_mot: maxCia.mot,
            c_hot: maxCia.hot,
            e_lot: maxEse.lot,
            e_mot: maxEse.mot,
            e_hot: maxEse.hot,
            ese_weightage: maxEse.weightage,
            cia_weightage: cia1.weightage,
            academic_sem: academicSem,
            co_thresh_value: inputValue,
            so_l0_ug: level0.ugEndRange,
            so_l1_ug: level1.ugEndRange,
            so_l2_ug: level2.ugEndRange,
            so_l3_ug: level3.ugEndRange,
            so_l0_pg: level0.pgEndRange,
            so_l1_pg: level1.pgEndRange,
            so_l2_pg: level2.pgEndRange,
            so_l3_pg: level3.pgEndRange,
        }

        const decition = await calculation.findAll({
            where: { academic_sem: academicSem }
        })

        if (decition.length > 0) 
        {
            await calculation.update(calculationData, {
                where: { academic_sem: academicSem }
            })
        }
        else {
            await calculation.create(calculationData);
        }
        res.status(201).json({ message: 'Data Saved Successfully!' });
    } 
    catch (error) {
        console.error("Error Saving Data:", error);
        res.status(500).json({ error: 'Failed to Save Data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.get('/fetchCalDatas', async (req, res) => 
{
    const markData = await calculation.findOne({ order: [['s_no', 'DESC']] })
    res.json(markData);
})
    
module.exports = route;