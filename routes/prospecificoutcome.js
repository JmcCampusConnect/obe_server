const express = require('express');
const route = express.Router();
const markentry = require('../models/markentry');
const coursemapping = require('../models/coursemapping');
const coursemaster = require('../models/coursemaster');
const calculation = require('../models/calculation');
const academic = require('../models/academic');
const rsmatrix = require('../models/rsmatrix');

// ------------------------------------------------------------------------------------------------------- //

route.get('/proDeptName', async (req, res) => 
{
    try 
    {
        const academicdata = await academic.findOne({
            where: { active_sem: 1 }
        })

        const dept = await coursemapping.findAll({
            attributes: ['dept_name'],
            raw: true
        })
        const uniqueDept = [...new Set(dept.map(dept => dept.dept_name))];
        res.json({ academic_year: academicdata.academic_year, dept_name: uniqueDept });
    }
    catch (err) {
        console.error("Error Fetching Dept Details in Program Specific Outcome :", err);
        res.status(500).json({ error: "Error Fetching Dept Details in Program Specific Outcome" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.post('/proDeptIdChange', async (req, res) => 
{
    const { changeDept } = req.body;

    try {
        const deptId = await coursemapping.findAll({
            where: { dept_name: changeDept },
            attributes: ['dept_id'],
            raw: true
        })
        const uniqueDeptId = [...new Set(deptId.map(dept => dept.dept_id))];
        res.json(uniqueDeptId);
    }
    catch (err) {
        console.error("Error Fetching Dept Id Details in Program Specific Outcome :", err);
        res.status(500).json({ error: "Error Fetching Dept Id Details in Program Specific Outcome" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.post('/proSpecOutcome', async (req, res) => 
{
    const { academicYear, selectedDept, selectedDeptId } = req.body;

    // console.log( academicYear, selectedDept, selectedDeptId)

    try {
        const course_codes = await markentry.findAll({
            where: {
                academic_year: academicYear,
                dept_id: selectedDeptId
            },
            attributes: ['course_code'], raw: true
        })

        // console.log(course_codes)

        const uniqueCourseCode = [...new Set(course_codes.map(code => code.course_code))];

        // console.log(uniqueCourseCode)

        const academicdata = await academic.findOne({ where: { active_sem: 1 } })

        const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } })

        const marks = await markentry.findAll({ where: { course_code: uniqueCourseCode, academic_year: academicdata.academic_year } })

        let countAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {},  emot: {}, ehot: {} }

        const studentCountsByCourse = {};

        await Promise.all(marks.map(async entry => {
            const
                {
                    course_code,
                    c1_lot = 0, c2_lot = 0, a1_lot = 0, a2_lot = 0,
                    c1_mot = 0, c2_mot = 0,
                    c1_hot = 0, c2_hot = 0,
                    ese_lot = 0, ese_mot = 0, ese_hot = 0
                } = entry.dataValues;

            const lot_percentage = ((c1_lot || 0) + (c2_lot || 0) + (a1_lot || 0) + (a2_lot || 0)) / (cal.c_lot || 1) * 100;
            const mot_percentage = ((c1_mot || 0) + (c2_mot || 0)) / (cal.c_mot || 1) * 100;
            const hot_percentage = ((c1_hot || 0) + (c2_hot || 0)) / (cal.c_hot || 1) * 100;
            const elot_percentage = (ese_lot || 0) / (cal.ese_lot || 1) * 100;
            const emot_percentage = (ese_mot || 0) / (cal.ese_mot || 1) * 100;
            const ehot_percentage = (ese_hot || 0) / (cal.ese_hot || 1) * 100;

            ['lot', 'mot', 'hot', 'elot', 'emot', 'ehot'].forEach(type => {
                if (!countAboveThreshold[type][course_code]) countAboveThreshold[type][course_code] = 0;
            })

            if (!studentCountsByCourse[course_code]) studentCountsByCourse[course_code] = 0;
            studentCountsByCourse[course_code]++;
            if (lot_percentage >= cal.co_thresh_value) countAboveThreshold.lot[course_code]++;
            if (mot_percentage >= cal.co_thresh_value) countAboveThreshold.mot[course_code]++;
            if (hot_percentage >= cal.co_thresh_value) countAboveThreshold.hot[course_code]++;
            if (elot_percentage >= cal.co_thresh_value) countAboveThreshold.elot[course_code]++;
            if (emot_percentage >= cal.co_thresh_value) countAboveThreshold.emot[course_code]++;
            if (ehot_percentage >= cal.co_thresh_value) countAboveThreshold.ehot[course_code]++;
        }))

        let percentageAboveThreshold = {lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} }

        for (const course_code of uniqueCourseCode) 
        {
            const totalStudents = studentCountsByCourse[course_code] || 1;
            percentageAboveThreshold.lot[course_code] = (countAboveThreshold.lot[course_code] / totalStudents) * 100;
            percentageAboveThreshold.mot[course_code] = (countAboveThreshold.mot[course_code] / totalStudents) * 100;
            percentageAboveThreshold.hot[course_code] = (countAboveThreshold.hot[course_code] / totalStudents) * 100;
            percentageAboveThreshold.elot[course_code] = (countAboveThreshold.elot[course_code] / totalStudents) * 100;
            percentageAboveThreshold.emot[course_code] = (countAboveThreshold.emot[course_code] / totalStudents) * 100;
            percentageAboveThreshold.ehot[course_code] = (countAboveThreshold.ehot[course_code] / totalStudents) * 100;
        }

        let attainedScores = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {}, overall: {} }

        for (const course_code of uniqueCourseCode) 
        {
            attainedScores.lot[course_code] = await calculateCategory(percentageAboveThreshold.lot[course_code]);
            attainedScores.mot[course_code] = await calculateCategory(percentageAboveThreshold.mot[course_code]);
            attainedScores.hot[course_code] = await calculateCategory(percentageAboveThreshold.hot[course_code]);
            attainedScores.elot[course_code] = await calculateCategory(percentageAboveThreshold.elot[course_code]);
            attainedScores.emot[course_code] = await calculateCategory(percentageAboveThreshold.emot[course_code]);
            attainedScores.ehot[course_code] = await calculateCategory(percentageAboveThreshold.ehot[course_code]);

            attainedScores.overall[course_code] =
            {
                lot: (attainedScores.lot[course_code] * (cal.cia_weightage / 100)) +
                    (attainedScores.elot[course_code] * (cal.ese_weightage / 100)),
                mot: (attainedScores.mot[course_code] * (cal.cia_weightage / 100)) +
                    (attainedScores.emot[course_code] * (cal.ese_weightage / 100)),
                hot: (attainedScores.hot[course_code] * (cal.cia_weightage / 100)) +
                    (attainedScores.ehot[course_code] * (cal.ese_weightage / 100))
            }

            const avgOverallScore = (
                attainedScores.overall[course_code].lot +
                attainedScores.overall[course_code].mot +
                attainedScores.overall[course_code].hot
            ) / 3;

            attainedScores.grade = attainedScores.grade || {};
            attainedScores.grade[course_code] = calculateGrade(avgOverallScore);

            attainedScores.avgOverallScore = attainedScores.avgOverallScore || {};
            attainedScores.avgOverallScore[course_code] = avgOverallScore;
        }

        // Capso and PSO Calculation

        let totalCapso1 = 0; let totalCapso2 = 0; let totalCapso3 = 0; let totalCapso4 = 0; let totalCapso5 = 0;

        for (const course_code of uniqueCourseCode) 
        {
            if (!attainedScores.capso) { attainedScores.capso = {} }

            const cop = await rsmatrix.findAll({ where: { course_code: course_code } })

            const lot = attainedScores.overall[course_code]?.lot;
            const mot = attainedScores.overall[course_code]?.mot;
            const hot = attainedScores.overall[course_code]?.hot;

            for (const entry of cop) 
            {
                const capso1 = ((lot * entry.co1_pso1) + (lot * entry.co2_pso1) +
                    (mot * entry.co3_pso1) + (mot * entry.co4_pso1) +
                    (hot * entry.co5_pso1)) /
                    (entry.co1_pso1 + entry.co2_pso1 + entry.co3_pso1 + entry.co4_pso1 + entry.co5_pso1)
                const capso2 = ((lot * entry.co1_pso2) + (lot * entry.co2_pso2) +
                    (mot * entry.co3_pso2) + (mot * entry.co4_pso2) +
                    (hot * entry.co5_pso2)) /
                    (entry.co1_pso2 + entry.co2_pso2 + entry.co3_pso2 + entry.co4_pso2 + entry.co5_pso2)
                const capso3 = ((lot * entry.co1_pso3) + (lot * entry.co2_pso3) +
                    (mot * entry.co3_pso3) + (mot * entry.co4_pso3) +
                    (hot * entry.co5_pso3)) /
                    (entry.co1_pso3 + entry.co2_pso3 + entry.co3_pso3 + entry.co4_pso3 + entry.co5_pso3)
                const capso4 = ((lot * entry.co1_pso4) + (lot * entry.co2_pso4) +
                    (mot * entry.co3_pso4) + (mot * entry.co4_pso4) +
                    (hot * entry.co5_pso4)) /
                    (entry.co1_pso4 + entry.co2_pso4 + entry.co3_pso4 + entry.co4_pso4 + entry.co5_pso4)
                const capso5 = ((lot * entry.co1_pso5) + (lot * entry.co2_pso5) +
                    (mot * entry.co3_pso5) + (mot * entry.co4_pso5) +
                    (hot * entry.co5_pso5)) /
                    (entry.co1_pso5 + entry.co2_pso5 + entry.co3_pso5 + entry.co4_pso5 + entry.co5_pso5)

                totalCapso1 += capso1; totalCapso2 += capso2; totalCapso3 += capso3; totalCapso4 += capso4; totalCapso5 += capso5;

                attainedScores.capso[course_code] =
                {
                    capso1, capso2, capso3, capso4, capso5,
                    capso: (capso1 + capso2 + capso3 + capso4 + capso5) / 5,
                }
            }

            const totalCourses = uniqueCourseCode.length;
            const pso1 = totalCapso1 / totalCourses;
            const pso2 = totalCapso2 / totalCourses;
            const pso3 = totalCapso3 / totalCourses;
            const pso4 = totalCapso4 / totalCourses;
            const pso5 = totalCapso5 / totalCourses;

            attainedScores.meanScores = {
                pso1, pso2,  pso3, pso4, pso5,
                pso: (pso1 + pso2 + pso3 + pso4 + pso5) / 5,
            }
        }
        res.json(attainedScores)
    }
    catch (err) {
        console.error("Error Fetching Dept Details in Program Specific Outcome :", err);
        res.status(500).json({ error: "Error Fetching Dept Details in Program Specific Outcome" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.post('/proOutcome', async (req, res) => 
{
    const { academicYear, programType } = req.body;

    try 
    {
        const deptNames = await coursemaster.findAll({
            where: { academic_year: academicYear, graduate: programType },
            attributes: ['dept_name'],
            raw: true
        });

        const uniqueDept = [...new Set(deptNames.map(dept => dept.dept_name))];

        const academicdata = await academic.findOne({ where: { active_sem: 1 } });
        const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });

        let departmentResults = {};

        for (const dept of uniqueDept) 
        {
            const courseCodes = await coursemaster.findAll({
                where: { academic_year: academicYear, dept_name: dept, graduate: programType },
                attributes: ['course_code'],
                raw: true
            });

            const uniqueCourseCode = [...new Set(courseCodes.map(code => code.course_code))];

            let countAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };
            const studentCountsByCourse = {};
            const attainedScores = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {}, overall: {}, dept_name: dept };

            const marks = await markentry.findAll({
                where: { course_code: uniqueCourseCode, academic_year: academicdata.academic_year }
            });

            await Promise.all(marks.map(async entry => {
                const { course_code, c1_lot = 0, c2_lot = 0, a1_lot = 0, a2_lot = 0, c1_mot = 0,
                    c2_mot = 0, c1_hot = 0, c2_hot = 0, ese_lot = 0, ese_mot = 0, ese_hot = 0 } = entry.dataValues;
                const lot_percentage = ((c1_lot || 0) + (c2_lot || 0) + (a1_lot || 0) + (a2_lot || 0)) / (cal.c_lot || 1) * 100;
                const mot_percentage = ((c1_mot || 0) + (c2_mot || 0)) / (cal.c_mot || 1) * 100;
                const hot_percentage = ((c1_hot || 0) + (c2_hot || 0)) / (cal.c_hot || 1) * 100;
                const elot_percentage = (ese_lot || 0) / (cal.ese_lot || 1) * 100;
                const emot_percentage = (ese_mot || 0) / (cal.ese_mot || 1) * 100;
                const ehot_percentage = (ese_hot || 0) / (cal.ese_hot || 1) * 100;

                ['lot', 'mot', 'hot', 'elot', 'emot', 'ehot'].forEach(type => {
                    if (!countAboveThreshold[type][course_code]) countAboveThreshold[type][course_code] = 0;
                });

                if (!studentCountsByCourse[course_code]) studentCountsByCourse[course_code] = 0;
                studentCountsByCourse[course_code]++;
                if (lot_percentage >= cal.co_thresh_value) countAboveThreshold.lot[course_code]++;
                if (mot_percentage >= cal.co_thresh_value) countAboveThreshold.mot[course_code]++;
                if (hot_percentage >= cal.co_thresh_value) countAboveThreshold.hot[course_code]++;
                if (elot_percentage >= cal.co_thresh_value) countAboveThreshold.elot[course_code]++;
                if (emot_percentage >= cal.co_thresh_value) countAboveThreshold.emot[course_code]++;
                if (ehot_percentage >= cal.co_thresh_value) countAboveThreshold.ehot[course_code]++;
            }))

            let percentageAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };

            for (const course_code of uniqueCourseCode) 
            {
                const totalStudents = studentCountsByCourse[course_code] || 1;
                percentageAboveThreshold.lot[course_code] = (countAboveThreshold.lot[course_code] / totalStudents) * 100;
                percentageAboveThreshold.mot[course_code] = (countAboveThreshold.mot[course_code] / totalStudents) * 100;
                percentageAboveThreshold.hot[course_code] = (countAboveThreshold.hot[course_code] / totalStudents) * 100;
                percentageAboveThreshold.elot[course_code] = (countAboveThreshold.elot[course_code] / totalStudents) * 100;
                percentageAboveThreshold.emot[course_code] = (countAboveThreshold.emot[course_code] / totalStudents) * 100;
                percentageAboveThreshold.ehot[course_code] = (countAboveThreshold.ehot[course_code] / totalStudents) * 100;
            }

            for (const course_code of uniqueCourseCode) 
            {
                attainedScores.lot[course_code] = await calculateCategory(percentageAboveThreshold.lot[course_code]);
                attainedScores.mot[course_code] = await calculateCategory(percentageAboveThreshold.mot[course_code]);
                attainedScores.hot[course_code] = await calculateCategory(percentageAboveThreshold.hot[course_code]);
                attainedScores.elot[course_code] = await calculateCategory(percentageAboveThreshold.elot[course_code]);
                attainedScores.emot[course_code] = await calculateCategory(percentageAboveThreshold.emot[course_code]);
                attainedScores.ehot[course_code] = await calculateCategory(percentageAboveThreshold.ehot[course_code]);

                attainedScores.overall[course_code] = {
                    lot: (attainedScores.lot[course_code] * (cal.cia_weightage / 100)) +
                        (attainedScores.elot[course_code] * (cal.ese_weightage / 100)),
                    mot: (attainedScores.mot[course_code] * (cal.cia_weightage / 100)) +
                        (attainedScores.emot[course_code] * (cal.ese_weightage / 100)),
                    hot: (attainedScores.hot[course_code] * (cal.cia_weightage / 100)) +
                        (attainedScores.ehot[course_code] * (cal.ese_weightage / 100))
                }

                const avgOverallScore = (
                    attainedScores.overall[course_code].lot +
                    attainedScores.overall[course_code].mot +
                    attainedScores.overall[course_code].hot) / 3;

                attainedScores.grade = attainedScores.grade || {};
                attainedScores.grade[course_code] = calculateGrade(avgOverallScore);

                attainedScores.avgOverallScore = attainedScores.avgOverallScore || {};
                attainedScores.avgOverallScore[course_code] = avgOverallScore;
                let totalCapso1 = 0; let totalCapso2 = 0; let totalCapso3 = 0; let totalCapso4 = 0; let totalCapso5 = 0;

                for (const course_code of uniqueCourseCode) 
                {
                    if (!attainedScores.capso) { attainedScores.capso = {} }

                    const cop = await rsmatrix.findAll({ where: { course_code: course_code } })
                    const lot = attainedScores.overall[course_code]?.lot;
                    const mot = attainedScores.overall[course_code]?.mot;
                    const hot = attainedScores.overall[course_code]?.hot;

                    for (const entry of cop) 
                    {
                        const capso1 = ((lot * entry.co1_pso1) + (lot * entry.co2_pso1) +
                            (mot * entry.co3_pso1) + (mot * entry.co4_pso1) +
                            (hot * entry.co5_pso1)) /
                            (entry.co1_pso1 + entry.co2_pso1 + entry.co3_pso1 + entry.co4_pso1 + entry.co5_pso1);

                        const capso2 = ((lot * entry.co1_pso2) + (lot * entry.co2_pso2) +
                            (mot * entry.co3_pso2) + (mot * entry.co4_pso2) +
                            (hot * entry.co5_pso2)) /
                            (entry.co1_pso2 + entry.co2_pso2 + entry.co3_pso2 + entry.co4_pso2 + entry.co5_pso2);

                        const capso3 = ((lot * entry.co1_pso3) + (lot * entry.co2_pso3) +
                            (mot * entry.co3_pso3) + (mot * entry.co4_pso3) +
                            (hot * entry.co5_pso3)) /
                            (entry.co1_pso3 + entry.co2_pso3 + entry.co3_pso3 + entry.co4_pso3 + entry.co5_pso3);

                        const capso4 = ((lot * entry.co1_pso4) + (lot * entry.co2_pso4) +
                            (mot * entry.co3_pso4) + (mot * entry.co4_pso4) +
                            (hot * entry.co5_pso4)) /
                            (entry.co1_pso4 + entry.co2_pso4 + entry.co3_pso4 + entry.co4_pso4 + entry.co5_pso4);

                        const capso5 = ((lot * entry.co1_pso5) + (lot * entry.co2_pso5) +
                            (mot * entry.co3_pso5) + (mot * entry.co4_pso5) +
                            (hot * entry.co5_pso5)) /
                            (entry.co1_pso5 + entry.co2_pso5 + entry.co3_pso5 + entry.co4_pso5 + entry.co5_pso5);

                        totalCapso1 += capso1; totalCapso2 += capso2; totalCapso3 += capso3; totalCapso4 += capso4; totalCapso5 += capso5;

                        attainedScores.capso[course_code] = {
                            capso1, capso2, capso3, capso4, capso5,
                            capso: (capso1 + capso2 + capso3 + capso4 + capso5) / 5,
                        }
                    }

                    const totalCourses = uniqueCourseCode.length;
                    const pso1 = totalCapso1 / totalCourses;
                    const pso2 = totalCapso2 / totalCourses;
                    const pso3 = totalCapso3 / totalCourses;
                    const pso4 = totalCapso4 / totalCourses;
                    const pso5 = totalCapso5 / totalCourses;

                    attainedScores.meanScores = {
                        pso1, pso2, pso3, pso4, pso5,
                        pso: (pso1 + pso2 + pso3 + pso4 + pso5) / 5,
                    }
                }

            }
            const overallAverage = attainedScores.meanScores.pso;
            const grade = calculateGrade(overallAverage);
            attainedScores.grade = grade;
            departmentResults[dept] = attainedScores;
        }
        res.json({ success: true, departmentResults });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the request' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

async function calculateCategory(percentage) 
{
    try 
    {
        const academicdata = await academic.findOne({ where: { active_sem: 1 } });

        if (!academicdata) { console.error("Academic data not found"); return null; }

        const data = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });

        if (!data) { console.error("Calculation data not found for the specified academic year"); return null }

        if (percentage >= data.so_l3_ug) { return 3 }
        else if (percentage >= data.so_l2_ug) { return 2 }
        else if (percentage >= data.so_l1_ug) { return 1 }
        else if (percentage > data.so_l0_ug) { return 0 }
        return 0;
    }
    catch (error) {
        console.error('Error fetching academic or calculation data:', error);
    }
}

// ------------------------------------------------------------------------------------------------------- //

function calculateGrade(overallAverage) 
{
    if (overallAverage >= 2.5) { return 'High' }
    else if (overallAverage >= 1.5 && overallAverage < 2.5) { return 'Medium' }
    else if (overallAverage >= 0) { return 'Low' }
    else { return 'N/A' }
}

module.exports = route;