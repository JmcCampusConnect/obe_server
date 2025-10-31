const express = require('express');
const route = express.Router();
const rsmatrix = require('../models/rsmatrix');
const academic = require('../models/academic');
const coursemapping = require('../models/coursemapping');

// ------------------------------------------------------------------------------------------------------- //

// RS Matrix Course Code Finding Coding

route.post('/rsmcoursecode', async (req, res) => {

    const { academic_sem, staff_id } = req.body;

    try {
        const courseMappings = await coursemapping.findAll({
            where: {
                academic_sem: academic_sem,
                staff_id: staff_id
            },
            attributes: ['course_code', 'academic_sem']
        })

        if (courseMappings.length === 0) {
            return res.status(404).json(
                { error: 'No Course Codes found for the giveN Staff ID.' }
            )
        }

        const seenCourseCodes = new Set();

        const courseStatusPromises = courseMappings.map(async (item) => {
            if (seenCourseCodes.has(item.course_code)) return null;
            seenCourseCodes.add(item.course_code);
            const courseExists = await rsmatrix.findOne({ where: { course_code: item.course_code } })
            return {
                course_code: item.course_code,
                // academic_sem: item.active_sem,
                completed: !!courseExists,
            }
        })
        const uniqueCourseDetails = (await Promise.all(courseStatusPromises)).filter(Boolean);
        res.json(uniqueCourseDetails);
    }
    catch (err) { res.status(500).json({ error: 'An error occurred while fetching course codes with status.' }) }
})

// ------------------------------------------------------------------------------------------------------- //

// RS Matrix Create and Update Coding

route.post('/rsmatrixSave', async (req, res) => {

    const { course_code, scores, meanOverallScore, correlation } = req.body;
    const cm = await coursemapping.findOne({ where: { course_code: course_code } })
    const ac = await academic.findOne({ where: { active_sem: 1 } })
    const rsm = await rsmatrix.findOne({ where: { course_code: course_code } })

    if (rsm) {
        const data = await rsmatrix.update({
            dept_id: cm.dept_id,
            co1_po1: scores.CO1_0,
            co1_po2: scores.CO1_1,
            co1_po3: scores.CO1_2,
            co1_po4: scores.CO1_3,
            co1_po5: scores.CO1_4,
            co1_pso1: scores.CO1_5,
            co1_pso2: scores.CO1_6,
            co1_pso3: scores.CO1_7,
            co1_pso4: scores.CO1_8,
            co1_pso5: scores.CO1_9,
            co1_mean: scores.CO1_meanScore,
            co2_po1: scores.CO2_0,
            co2_po2: scores.CO2_1,
            co2_po3: scores.CO2_2,
            co2_po4: scores.CO2_3,
            co2_po5: scores.CO2_4,
            co2_pso1: scores.CO2_5,
            co2_pso2: scores.CO2_6,
            co2_pso3: scores.CO2_7,
            co2_pso4: scores.CO2_8,
            co2_pso5: scores.CO2_9,
            co2_mean: scores.CO2_meanScore,
            co3_po1: scores.CO3_0,
            co3_po2: scores.CO3_1,
            co3_po3: scores.CO3_2,
            co3_po4: scores.CO3_3,
            co3_po5: scores.CO3_4,
            co3_pso1: scores.CO3_5,
            co3_pso2: scores.CO3_6,
            co3_pso3: scores.CO3_7,
            co3_pso4: scores.CO3_8,
            co3_pso5: scores.CO3_9,
            co3_mean: scores.CO3_meanScore,
            co4_po1: scores.CO4_0,
            co4_po2: scores.CO4_1,
            co4_po3: scores.CO4_2,
            co4_po4: scores.CO4_3,
            co4_po5: scores.CO4_4,
            co4_pso1: scores.CO4_5,
            co4_pso2: scores.CO4_6,
            co4_pso3: scores.CO4_7,
            co4_pso4: scores.CO4_8,
            co4_pso5: scores.CO4_9,
            co4_mean: scores.CO4_meanScore,
            co5_po1: scores.CO5_0,
            co5_po2: scores.CO5_1,
            co5_po3: scores.CO5_2,
            co5_po4: scores.CO5_3,
            co5_po5: scores.CO5_4,
            co5_pso1: scores.CO5_5,
            co5_pso2: scores.CO5_6,
            co5_pso3: scores.CO5_7,
            co5_pso4: scores.CO5_8,
            co5_pso5: scores.CO5_9,
            co5_mean: scores.CO5_meanScore,
            mean: meanOverallScore,
            olrel: correlation
        }, {
            where: { course_code: course_code }
        })
        if (data) { res.status(200).json({ message: 'Update Successful' }) }
        else { res.status(500).json({ message: 'Error during update.' }) }
    }
    else {
        const data = await rsmatrix.create({
            course_code: course_code,
            dept_id: cm.dept_id,
            co1_po1: scores.CO1_0,
            co1_po2: scores.CO1_1,
            co1_po3: scores.CO1_2,
            co1_po4: scores.CO1_3,
            co1_po5: scores.CO1_4,
            co1_pso1: scores.CO1_5,
            co1_pso2: scores.CO1_6,
            co1_pso3: scores.CO1_7,
            co1_pso4: scores.CO1_8,
            co1_pso5: scores.CO1_9,
            co1_mean: scores.CO1_meanScore,
            co2_po1: scores.CO2_0,
            co2_po2: scores.CO2_1,
            co2_po3: scores.CO2_2,
            co2_po4: scores.CO2_3,
            co2_po5: scores.CO2_4,
            co2_pso1: scores.CO2_5,
            co2_pso2: scores.CO2_6,
            co2_pso3: scores.CO2_7,
            co2_pso4: scores.CO2_8,
            co2_pso5: scores.CO2_9,
            co2_mean: scores.CO2_meanScore,
            co3_po1: scores.CO3_0,
            co3_po2: scores.CO3_1,
            co3_po3: scores.CO3_2,
            co3_po4: scores.CO3_3,
            co3_po5: scores.CO3_4,
            co3_pso1: scores.CO3_5,
            co3_pso2: scores.CO3_6,
            co3_pso3: scores.CO3_7,
            co3_pso4: scores.CO3_8,
            co3_pso5: scores.CO3_9,
            co3_mean: scores.CO3_meanScore,
            co4_po1: scores.CO4_0,
            co4_po2: scores.CO4_1,
            co4_po3: scores.CO4_2,
            co4_po4: scores.CO4_3,
            co4_po5: scores.CO4_4,
            co4_pso1: scores.CO4_5,
            co4_pso2: scores.CO4_6,
            co4_pso3: scores.CO4_7,
            co4_pso4: scores.CO4_8,
            co4_pso5: scores.CO4_9,
            co4_mean: scores.CO4_meanScore,
            co5_po1: scores.CO5_0,
            co5_po2: scores.CO5_1,
            co5_po3: scores.CO5_2,
            co5_po4: scores.CO5_3,
            co5_po5: scores.CO5_4,
            co5_pso1: scores.CO5_5,
            co5_pso2: scores.CO5_6,
            co5_pso3: scores.CO5_7,
            co5_pso4: scores.CO5_8,
            co5_pso5: scores.CO5_9,
            co5_mean: scores.CO5_meanScore,
            mean: meanOverallScore,
            olrel: correlation
        })
        if (data) { res.status(201).json({ message: 'Saved Successful' }) }
        else { res.status(500).json({ message: 'Error during Save.' }) }
    }
})

// ------------------------------------------------------------------------------------------------------- //

// RS Matrix 

route.get('/rsmatrix/:course_code', async (req, res) => {

    try {
        const { course_code } = req.params;
        const ac = await academic.findOne({ where: { active_sem: 1 } })
        const matrixData = await rsmatrix.findOne({ where: { course_code } })
        res.status(200).json(matrixData);
    }
    catch (error) {
        console.error('Error Fetching Matrix Data:', error);
        res.status(500).json({ message: 'Error Fetching Matrix Data' });
    }
})

module.exports = route;