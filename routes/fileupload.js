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

async function processExcel(type, rows, handler) {

    uploadProgress[type] = {
        total: Array.isArray(rows) ? rows.length : 0,
        processed: 0,
        failed: 0,
        errors: []
    };

    if (!Array.isArray(rows)) {
        uploadProgress[type].failed++;
        uploadProgress[type].errors.push({
            row: "-",
            identifier: "-",
            message: "Invalid or empty Excel file"
        });
        return;
    }

    for (let i = 0; i < rows.length; i++) {
        try {
            await handler(rows[i]);
            uploadProgress[type].processed++;
        } catch (err) {
            uploadProgress[type].failed++;
            uploadProgress[type].errors.push({
                row: i + 2,
                identifier:
                    rows[i]?.reg_no ||
                    rows[i]?.staff_id ||
                    rows[i]?.course_code ||
                    "Unknown",
                message:
                    err?.errors?.[0]?.message ||
                    err?.original?.sqlMessage ||
                    err.message
            });
        }
    }
}

// ------------------------------------------------------------------------------------------------------- //
// READ EXCEL
// ------------------------------------------------------------------------------------------------------- //

function readExcel(file) {
    try {
        const workbook = XLSX.readFile(file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        return rows;
    } catch (err) {
        return null;
    } finally {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
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

    if (!activeAcademic) {
        return res.status(400).send("No active academic semester found");
    }

    res.send("Upload started");

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
})

// ------------------------------------------------------------------------------------------------------- //
// MARK ENTRY
// ------------------------------------------------------------------------------------------------------- //

route.post("/markentry", upload.single("file"), async (req, res) => {
    const rows = readExcel(req.file);
    const activeAcademic = await academic.findOne({
        where: { active_sem: 1 },
    });
    processExcel("markentry", rows, async (row) => {
        await markentry.upsert({
            ...row,
            academic_sem: activeAcademic.academic_sem,
            academic_year: activeAcademic.academic_year,
        });
    });
    res.send("Mark Entry upload started");
});

// ------------------------------------------------------------------------------------------------------- //
// ESE UPDATE
// ------------------------------------------------------------------------------------------------------- //

function toMark(value) {
    if (value === null || value === undefined) return -1;
    if (typeof value === "string" && value.trim() === "") { return -1 }
    const num = Number(value);
    if (Number.isNaN(num)) { return -1 }
    return num;
}

route.post("/ese", upload.single("file"), (req, res) => {
    const rows = readExcel(req.file);
    processExcel("ese", rows, async (row) => {
        const [updatedCount] = await markentry.update(
            {
                ese_lot: toMark(row.ese_lot),
                ese_mot: toMark(row.ese_mot),
                ese_hot: toMark(row.ese_hot),
                ese_total: toMark(row.ese_total),
            },
            {
                where: {
                    reg_no: row.reg_no?.trim(),
                    course_code: row.course_code?.trim(),
                },
            }
        );
        if (updatedCount === 0) {
            throw new Error("Record not found for given reg_no and course_code");
        }
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

        if (!progress) {
            res.write(`data: ${JSON.stringify({
                total: 0,
                processed: 0,
                failed: 1,
                errors: [{
                    row: "-",
                    identifier: "-",
                    message: "No upload in progress"
                }]
            })}\n\n`);
            res.end();
            return;
        }

        res.write(`data: ${JSON.stringify(progress)}\n\n`);

        if ((progress.processed + progress.failed) >= progress.total) {
            clearInterval(timer);
            setTimeout(() => delete uploadProgress[type], 5000);
            res.end();
        }
    }, 500);

    req.on("close", () => clearInterval(timer));
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;