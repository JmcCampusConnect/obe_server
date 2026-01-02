const express = require("express");
const route = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");

// MODELS (ALL YOUR TABLES)
const academic = require("../models/academic");
const coursemapping = require("../models/coursemapping");
const report = require("../models/report");
const markentry = require("../models/markentry");
const scope = require("../models/scope");
const mentor = require("../models/mentor");
const hod = require("../models/hod");
const studentmaster = require("../models/studentmaster");
const staffmaster = require("../models/staffmaster");
const calculation = require("../models/calculation");
const rsmatrix = require("../models/rsmatrix");
const coursemaster = require("../models/coursemaster");

// ------------------------------------------------------------------------------------------------------- //
// MULTER
// ------------------------------------------------------------------------------------------------------- //

const upload = multer({ dest: "uploads/" });

// ------------------------------------------------------------------------------------------------------- //
// GLOBAL PROGRESS STORE
// ------------------------------------------------------------------------------------------------------- //

const uploadProgress = {};

// ------------------------------------------------------------------------------------------------------- //
// READ EXCEL
// ------------------------------------------------------------------------------------------------------- //

function readExcel(file) {
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    fs.unlinkSync(file.path);
    return rows;
}

// ------------------------------------------------------------------------------------------------------- //
// BACKGROUND PROCESSOR
// ------------------------------------------------------------------------------------------------------- //

async function processExcel(type, rows, handler) {
    uploadProgress[type] = { total: rows.length, processed: 0 };
    for (const row of rows) {
        await handler(row);
        uploadProgress[type].processed++;
    }
}

// ------------------------------------------------------------------------------------------------------- //
// STAFF MASTER
// ------------------------------------------------------------------------------------------------------- //

route.post("/staffmaster", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("staffmaster", rows, async (row) => {
        await staffmaster.upsert({
            staff_id: row.staff_id,
            staff_category: row.staff_category,
            staff_name: row.staff_name,
            staff_pass: row.staff_pass,
            staff_dept: row.staff_dept,
            dept_category: row.dept_category,
        });
    });
    res.send("Staff Master upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// STUDENT MASTER
// ------------------------------------------------------------------------------------------------------- //

route.post("/studentmaster", upload.single("file"), (req, res) => {

    const rows = readExcel(req.file);

    processExcel("studentmaster", rows, async (row) => {
        await studentmaster.upsert({
            reg_no: row.reg_no,
            stu_name: row.stu_name,
            dept_id: row.dept_id,
            category: row.category,
            semester: row.semester,
            section: row.section,
            batch: row.batch,
        });
    });
    res.send("Student Master upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// COURSE MAPPING
// ------------------------------------------------------------------------------------------------------- //

route.post("/coursemapping", upload.single("file"), async (req, res) => {

    const rows = readExcel(req.file);

    const activeAcademic = await academic.findOne({
        where: { active_sem: 1 },
    });

    processExcel("coursemapping", rows, async (row) => {
        await coursemapping.upsert({
            ...row,
            academic_sem: activeAcademic.academic_sem,
        });

        await report.upsert({
            staff_id: row.staff_id,
            course_code: row.course_code,
            category: row.category,
            section: row.section,
            dept_name: row.dept_name,
            academic_sem: activeAcademic.academic_sem,
        });
    });

    res.send("Course Mapping upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// MARK ENTRY
// ------------------------------------------------------------------------------------------------------- //

route.post("/markentry", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("markentry", rows, async (row) => {
        await markentry.upsert(row);
    });
    res.send("Mark Entry upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// ESE UPDATE
// ------------------------------------------------------------------------------------------------------- //

route.post("/ese", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("ese", rows, async (row) => {
        await markentry.update(
            {
                ese_lot: Number(row.ese_lot) || -1,
                ese_mot: Number(row.ese_mot) || -1,
                ese_hot: Number(row.ese_hot) || -1,
                ese_total: Number(row.ese_total) || -1,
            },
            { where: { reg_no: row.reg_no, course_code: row.course_code } }
        );
    });
    res.send("ESE upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// HOD
// ------------------------------------------------------------------------------------------------------- //

route.post("/hod", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("hod", rows, async (row) => {
        await hod.upsert(row);
    });
    res.send("HOD upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// MENTOR
// ------------------------------------------------------------------------------------------------------- //

route.post("/mentor", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("mentor", rows, async (row) => {
        await mentor.upsert(row);
    });
    res.send("Mentor upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// SCOPE
// ------------------------------------------------------------------------------------------------------- //

route.post("/scope", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("scope", rows, async (row) => {
        await scope.upsert(row);
    });
    res.send("Scope upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// CALCULATION
// ------------------------------------------------------------------------------------------------------- //

route.post("/calculation", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("calculation", rows, async (row) => {
        await calculation.upsert(row);
    });
    res.send("Calculation upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// ACADEMIC
// ------------------------------------------------------------------------------------------------------- //

route.post("/academic", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("academic", rows, async (row) => {
        await academic.upsert(row);
    });
    res.send("Academic upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// RS MATRIX
// ------------------------------------------------------------------------------------------------------- //

route.post("/rsmatrix", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("rsmatrix", rows, async (row) => {
        await rsmatrix.upsert(row);
    });
    res.send("RS Matrix upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// COURSE MASTER
// ------------------------------------------------------------------------------------------------------- //

route.post("/coursemaster", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("coursemaster", rows, async (row) => {
        await coursemaster.upsert(row);
    });
    res.send("Course Master upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// PROGRESS (SSE)
// ------------------------------------------------------------------------------------------------------- //

route.get("/progress/:type", (req, res) => {

    const { type } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const timer = setInterval(() => {
        const progress = uploadProgress[type];
        if (!progress) return;

        const percent = Math.round(
            (progress.processed / progress.total) * 100
        );

        res.write(`data: ${percent}\n\n`);

        if (percent >= 100) {
            clearInterval(timer);
            delete uploadProgress[type];
            res.end();
        }
    }, 500);

    req.on("close", () => clearInterval(timer));
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;