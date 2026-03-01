const express = require('express');
const route = express.Router();
const markentry = require('../models/markentry');
const calculation = require('../models/calculation');
const coursemapping = require("../models/coursemapping")
const academic = require('../models/academic');
const { Sequelize } = require("sequelize");
const rsmatrix = require('../models/rsmatrix');
const path = require('path');
const fs = require('fs');
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, BorderStyle, WidthType,
    VerticalAlign, ImageRun, LevelFormat, UnderlineType
} = require('docx');

// ------------------------------------------------------------------------------------------------------- //

// Design constants 
// Page: A4, ~20mm margins (1134 DXA each side)

const PAGE_W = 11906;
const PAGE_H = 16838;
const MARGIN = 1134;

const HEADER_TBL_W = 10058;
const HEADER_COL1 = 1128;
const HEADER_COL2 = 8930;

// Methodology tables (centered, partial width)
// Table 1: weightage (cols 2253+1271+3454)

const METHOD_TBL1_W = 6978;
const METHOD_COL1_1 = 2253;
const METHOD_COL1_2 = 1271;
const METHOD_COL1_3 = 3454;

// Table 2 & 3: scale (cols 1271+3454)
const METHOD_TBL2_W = 4725;
const METHOD_COL2_1 = 1271;
const METHOD_COL2_2 = 3454;

// Data table (page 2, centered)
const DATA_TBL_W = 8000;
const DATA_COL_SNO = 800;
const DATA_COL_CODE = 2400;
const DATA_COL_OBE = 1400;
const DATA_COL_OUT = 1400;

// Borders
const singleBorder = { style: BorderStyle.SINGLE, size: 4, color: "auto" };
const allSingle = { top: singleBorder, bottom: singleBorder, left: singleBorder, right: singleBorder };
const nilBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// ------------------------------------------------------------------------------------------------------- //

// Helper: table cell with Calibri bold (data table style)

function cCell(text, { align = AlignmentType.LEFT, colWidth = 1000, bold = true, fontSize = 22 } = {}) {
    return new TableCell({
        borders: allSingle,
        width: { size: colWidth, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
            new Paragraph({
                alignment: align,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({
                    text: String(text ?? ""),
                    bold,
                    size: fontSize,
                    font: "Calibri",
                    color: "000000",
                })],
            }),
        ],
    });
}

// ------------------------------------------------------------------------------------------------------- //

// Helper: methodology table cell (default font, bold header)

function mCell(text, { align = AlignmentType.LEFT, colWidth = 1000, bold = false } = {}) {
    return new TableCell({
        borders: allSingle,
        width: { size: colWidth, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
            new Paragraph({
                alignment: align,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({
                    text: String(text ?? ""),
                    bold,
                    size: 22,
                })],
            }),
        ],
    });
}

// ------------------------------------------------------------------------------------------------------- //

// Helper: grade label → text (PAR.docx uses Low/Moderate/High/Excellent)

function gradeLabel(avg) {
    if (avg >= 3.5) return 'Excellent';
    if (avg >= 2.5) return 'High';
    if (avg >= 1.5) return 'Moderate';
    return 'Low';
}

// ------------------------------------------------------------------------------------------------------- //

//  College header table (logo + name) — exact PAR.docx structure 

function buildHeaderTable(logoData) {

    const logoCell = new TableCell({
        width: { size: HEADER_COL1, type: WidthType.DXA },
        borders: {
            top: nilBorder,
            left: nilBorder,
            right: nilBorder,
            bottom: { style: BorderStyle.DOUBLE, size: 4, color: "auto" },
        },
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: logoData
                    ? [new ImageRun({ data: logoData, transformation: { width: 63, height: 88 }, type: "jpeg" })]
                    : [new TextRun({ text: "" })],
            }),
        ],
    });

    const titleCell = new TableCell({
        width: { size: HEADER_COL2, type: WidthType.DXA },
        borders: {
            top: nilBorder,
            left: nilBorder,
            right: nilBorder,
            bottom: { style: BorderStyle.DOUBLE, size: 4, color: "auto" },
        },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 180, right: 60 },
        children: [
            // "JAMAL MOHAMED COLLEGE (Autonomous)"  — sz 38 + default for autonomous
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [
                    new TextRun({ text: "JAMAL MOHAMED COLLEGE ", bold: true, size: 38, font: "Bookman Old Style" }),
                    new TextRun({ text: "(Autonomous)", size: 22, font: "Bookman Old Style" }),
                ],
            }),
            // "TIRUCHIRAPPALLI - 620 020"
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [new TextRun({ text: "TIRUCHIRAPPALLI - 620 020", bold: true, size: 22, font: "Bookman Old Style" })],
            }),
            // "OFFICE OF THE CONTROLLER OF EXAMINATIONS"
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "OFFICE OF THE CONTROLLER OF EXAMINATIONS", bold: true, size: 22, font: "Bookman Old Style" })],
            }),
        ],
    });

    return new Table({
        width: { size: HEADER_TBL_W, type: WidthType.DXA },
        columnWidths: [HEADER_COL1, HEADER_COL2],
        layout: "fixed",
        rows: [
            new TableRow({
                height: { value: 1418, rule: "exact" },
                cantSplit: true,
                children: [logoCell, titleCell],
            }),
        ],
    });
}

// ------------------------------------------------------------------------------------------------------- //

// Word builder

// Word builder

async function buildWordDoc(resultByDept, selectedAcademicYear) {

    const logoPath = path.join(__dirname, '../assets/jmclogo.jpeg');
    let logoData = null;
    if (fs.existsSync(logoPath)) {
        logoData = fs.readFileSync(logoPath);
    }

    const sections = [];
    const deptEntries = Object.entries(resultByDept);

    for (let dIdx = 0; dIdx < deptEntries.length; dIdx++) {

        const [deptId, deptData] = deptEntries[dIdx];
        const graduate = deptData.graduate || "PG";

        const page1 = [];

        page1.push(buildHeaderTable(logoData));

        // Empty paragraph after header
        page1.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "", bold: true })] }));

        // "Steps to Calculate..." heading — bold, no font override (matches PAR.docx)
        page1.push(
            new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "Steps to Calculate the Attainment of Programme Specific Outcome", bold: true })],
            })
        );

        // Empty paragraph (spacing)
        page1.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }));

        // Numbered steps — Times New Roman 12pt (sz 24), using numbering list
        const stepTexts = [
            "The CIA and ESE marks are normalized to a common scale value of 100.",
            "From the above normalized values, a weightage of 40% is assigned to the CIA Component and a weightage of 60% is assigned to the ESE component.",
            `These values are summed up to get a OBE score. A OBE scale value of 1 to 4 and the level of attainment (Low, Moderate, High and Excellent) by a student on a specific course is determined based on this score. This is shown in Table 1.`,
            "A mean of the OBE scale value for all the students indicate the attainment level of the particular course. This is shown in Table 2.",
            "The mean of the OBE scale value for all the courses of a specific programme determines attainment level of that specific programme. This is shown in Table 3.",
        ];

        stepTexts.forEach((text) => {
            page1.push(
                new Paragraph({
                    numbering: { reference: "steps-list", level: 0 },
                    spacing: { before: 0, after: 0 },
                    children: [new TextRun({ text, size: 24, font: "Times New Roman" })],
                })
            );
        });

        page1.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }));

        // Spacer + Table 1 caption + table
        page1.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 240, after: 60, line: 360, lineRule: "auto" },
                indent: { left: 220, right: 218 },
                children: [new TextRun({ text: `Table 1: Weightage by students and scale used to assess the attainment for ${graduate}`, bold: true })],
            })
        );

        // Helper: methodology table cell (default font, bold header) - MODIFIED for center alignment
        function mCell(text, { align = AlignmentType.CENTER, colWidth = 1000, bold = false } = {}) {
            return new TableCell({
                borders: allSingle,
                width: { size: colWidth, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [
                    new Paragraph({
                        alignment: align,
                        spacing: { before: 0, after: 0 },
                        children: [new TextRun({
                            text: String(text ?? ""),
                            bold,
                            size: 22,
                        })],
                    }),
                ],
            });
        }

        // Then in your table code:
        page1.push(
            new Table({
                width: { size: METHOD_TBL1_W, type: WidthType.DXA },
                columnWidths: [METHOD_COL1_1, METHOD_COL1_2, METHOD_COL1_3],
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            mCell("Weightage obtained", { bold: true, colWidth: METHOD_COL1_1 }), // Will be centered
                            mCell("Scale used", { bold: true, colWidth: METHOD_COL1_2 }), // Will be centered
                            mCell("Level of attainment of Outcome", { bold: true, colWidth: METHOD_COL1_3 }), // Will be centered
                        ],
                    }),
                    ...[["0 - 49", "1", "Low"], ["50 - 74", "2", "Moderate"], ["75 – 94", "3", "High"], ["95 - 100", "4", "Excellent"]]
                        .map(([w, s, l]) => new TableRow({
                            children: [
                                mCell(w, { colWidth: METHOD_COL1_1 }),
                                mCell(s, { colWidth: METHOD_COL1_2 }),
                                mCell(l, { colWidth: METHOD_COL1_3 }),
                            ]
                        })),
                ],
            })
        );

        // Spacer + Table 2 caption + table
        page1.push(new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }));

        page1.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60, line: 360, lineRule: "auto" },
                indent: { left: 220, right: 218 },
                children: [new TextRun({ text: `Table 2: Scale used to assess the Course Outcome for ${graduate}`, bold: true })],
            })
        );

        page1.push(
            new Table({
                width: { size: METHOD_TBL2_W, type: WidthType.DXA },
                columnWidths: [METHOD_COL2_1, METHOD_COL2_2],
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            mCell("Scale used", { bold: true, colWidth: METHOD_COL2_1 }),
                            mCell("Level of attainment of Outcome", { bold: true, colWidth: METHOD_COL2_2 }),
                        ],
                    }),
                    ...[["0 – 1.0", "Low"], ["1.1 – 2.0", "Moderate"], ["2.1 – 3.0", "High"], ["3.1 – 4.0", "Excellent"]]
                        .map(([s, l]) => new TableRow({
                            children: [
                                mCell(s, { colWidth: METHOD_COL2_1 }),
                                mCell(l, { colWidth: METHOD_COL2_2 }),
                            ]
                        })),
                ],
            })
        );

        // Spacer + Table 3 caption + table
        page1.push(new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }));

        page1.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60, line: 360, lineRule: "auto" },
                indent: { left: 220, right: 218 },
                children: [new TextRun({ text: `Table 3: Scale used to assess the Program Specific Outcome for ${graduate}`, bold: true })],
            })
        );

        page1.push(
            new Table({
                width: { size: METHOD_TBL2_W, type: WidthType.DXA },
                columnWidths: [METHOD_COL2_1, METHOD_COL2_2],
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            mCell("Scale used", { bold: true, colWidth: METHOD_COL2_1 }),
                            mCell("Level of attainment of Outcome", { bold: true, colWidth: METHOD_COL2_2 }),
                        ],
                    }),
                    ...[["0 – 1.0", "Low"], ["1.1 – 2.0", "Moderate"], ["2.1 – 3.0", "High"], ["3.1 – 4.0", "Excellent"]]
                        .map(([s, l]) => new TableRow({
                            children: [
                                mCell(s, { colWidth: METHOD_COL2_1 }),
                                mCell(l, { colWidth: METHOD_COL2_2 }),
                            ]
                        })),
                ],
            })
        );

        // ── PAGE 2: Course Outcome Attainment data ──────────────────────── //
        const page2 = [];

        page2.push(buildHeaderTable(logoData));

        // Empty paragraphs (spacing before "Attainment of Course Outcome")
        page2.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [] }));
        page2.push(
            new Paragraph({
                spacing: { line: 360, lineRule: "auto" },
                indent: { left: 120 },
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "", bold: true })],
            })
        );

        // "Attainment of Course Outcome" — bold + underline, centered
        page2.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 360, lineRule: "auto" },
                indent: { left: 720 },
                children: [new TextRun({
                    text: "Attainment of Course Outcome",
                    bold: true,
                    underline: { type: UnderlineType.SINGLE },
                })],
            })
        );

        // Create a table with two columns for the header information
        page2.push(
            new Table({
                width: { size: 9000, type: WidthType.DXA }, 
                alignment: AlignmentType.CENTER,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: nilBorder, 
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "Programme : ", bold: true }),
                                            new TextRun({ text: " " }),
                                            new TextRun({ text: `${deptId}` }),
                                        ],
                                    }),
                                ],
                            }),
                            // Right cell - Academic Year
                            new TableCell({
                                borders: nilBorder, 
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({ text: "Academic Year: ", bold: true }),
                                            new TextRun({ text: `${selectedAcademicYear}`, bold: false }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        );

        // Empty paragraph before table
        page2.push(
            new Paragraph({
                indent: { left: 720 },
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "", bold: true })],
            })
        );

        // ── Main data table ─────────────────────────────────────────────── //

        const courseCodes = Object.keys(deptData.overall || {});

        const dataRows = [

            // Header row - th contents centered both vertically and horizontally
            new TableRow({
                tableHeader: true,
                height: { value: 400, rule: "exact" },
                children: [
                    cCell("S. No", { align: AlignmentType.CENTER, colWidth: DATA_COL_SNO }),
                    cCell("Course Code", { align: AlignmentType.CENTER, colWidth: DATA_COL_CODE + 200 }),
                    cCell("OBE Level", { align: AlignmentType.CENTER, colWidth: DATA_COL_OBE + 200 }),
                    cCell("Course Outcome", { align: AlignmentType.CENTER, colWidth: DATA_COL_OUT + 200 }),
                ],
            }),

            // Data rows - Course Name field removed
            ...courseCodes.map((code, idx) => {
                const avg = deptData.avgOverallScore?.[code];
                const score = avg != null ? avg.toFixed(2) : "—";
                const label = deptData.grade?.[code] || (avg != null ? gradeLabel(avg) : "N/A");
                return new TableRow({
                    height: { value: 350, rule: "exact" },
                    children: [
                        cCell(idx + 1, { align: AlignmentType.CENTER, colWidth: DATA_COL_SNO }),
                        cCell(code, { align: AlignmentType.CENTER, colWidth: DATA_COL_CODE + 200 }),
                        cCell(score, { align: AlignmentType.CENTER, colWidth: DATA_COL_OBE + 200 }),
                        cCell(label, { align: AlignmentType.CENTER, colWidth: DATA_COL_OUT + 200 }),
                    ],
                });
            }),

            new TableRow({
                height: { value: 400, rule: "exact" },
                children: [
                    new TableCell({
                        columnSpan: 2,
                        borders: {
                            top: singleBorder,
                            left: singleBorder,
                            bottom: singleBorder,
                            right: singleBorder,
                        },
                        width: { size: DATA_COL_SNO + DATA_COL_CODE + 200, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 },
                                children: [new TextRun({ text: "Programme Specific Outcome (PSO) Average", bold: true, size: 22, font: "Calibri", color: "000000" })],
                            }),
                        ],
                    }),
                    // OBE score cell — MODIFIED: now center-aligned (was right-aligned)
                    new TableCell({
                        borders: allSingle,
                        width: { size: DATA_COL_OBE + 200, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,   // <-- changed from RIGHT to CENTER
                                spacing: { before: 0, after: 0 },
                                children: [new TextRun({
                                    text: deptData.meanScores?.pso != null
                                        ? deptData.meanScores.pso.toFixed(2)
                                        : "—",
                                    bold: true, size: 22, font: "Calibri", color: "000000",
                                })],
                            }),
                        ],
                    }),
                    // Outcome label cell (already centered)
                    new TableCell({
                        borders: allSingle,
                        width: { size: DATA_COL_OUT + 200, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 },
                                children: [new TextRun({
                                    text: deptData.meanScores?.pso != null
                                        ? gradeLabel(deptData.meanScores.pso)
                                        : "N/A",
                                    bold: true, size: 22, font: "Calibri", color: "000000",
                                })],
                            }),
                        ],
                    }),
                ],
            }),
        ];

        // Add a small margin top above the table
        page2.push(new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }));

        page2.push(
            new Table({
                width: { size: DATA_TBL_W + 600, type: WidthType.DXA },
                columnWidths: [DATA_COL_SNO, DATA_COL_CODE + 200, DATA_COL_OBE + 200, DATA_COL_OUT + 200],
                alignment: AlignmentType.CENTER,
                rows: dataRows,
            })
        );

        // Add flexible spacing to push signature to bottom of page
        // MODIFIED: increased spacing.before to 6000 (was 400) to push signature to bottom
        page2.push(new Paragraph({
            spacing: { before: 6000, after: 0, line: 360, lineRule: "auto" },
            children: []
        }));

        // "Controller of Examinations" — right-aligned, Bookman Old Style bold sz 26
        page2.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "Controller of Examinations", bold: true, size: 26, font: "Bookman Old Style" })],
            })
        );

        // Push two sections (one per page) for this department
        const commonPageProps = {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 709, footer: 709, gutter: 0 },
        };

        sections.push({
            properties: { page: commonPageProps },
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
            children: page1,
        });

        sections.push({
            properties: { page: commonPageProps },
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
            children: page2,
        });
    }

    return new Document({
        numbering: {
            config: [
                {
                    reference: "steps-list",
                    levels: [{
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: { left: 360, hanging: 360 },
                            },
                            run: {
                                size: 24,
                                font: "Times New Roman",
                            },
                        },
                    }],
                },
            ],
        },
        styles: {
            default: {
                document: { run: { font: "Calibri", size: 22 } },
            },
        },
        sections,
    });
}

// ------------------------------------------------------------------------------------------------------- //

// Routes 

route.get('/specReport', async (req, res) => {

    try {

        const academicYear = req.query.academic_year;

        if (!academicYear) {
            return res.status(400).json({
                error: "Academic year is required"
            });
        }

        const academic_sem = await academic.findOne({
            where: {
                academic_year: academicYear
            }
        });

        if (!academic_sem) {
            return res.status(404).json({
                error: "Academic year not found"
            });
        }

        const deptList = await markentry.findAll({
            where: { academic_year: academicYear },
            attributes: ['dept_id'],
            group: ['dept_id'],
            raw: true
        });

        const cal = await calculation.findOne({
            where: { academic_sem: academic_sem.academic_sem }
        });

        const resultByDept = await buildResultByDept(
            deptList,
            academicYear,
            academic_sem,
            cal
        );

        res.json(resultByDept);

    } catch (err) {
        console.error("Error Fetching Dept Details in Program Specific Outcome:", err);
        res.status(500).json({
            error: "Error Fetching Dept Details in Program Specific Outcome"
        });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Word download endpoint

route.get('/specReport/download-word', async (req, res) => {

    try {

        const academicYear = req.query.academic_year;

        if (!academicYear) {
            return res.status(400).json({
                error: "Academic year is required"
            });
        }

        const academic_sem = await academic.findOne({
            where: { academic_year: academicYear }
        });

        if (!academic_sem) {
            return res.status(404).json({
                error: "Academic year not found"
            });
        }

        const deptList = await markentry.findAll({
            where: { academic_year: academicYear },
            attributes: ['dept_id'],
            group: ['dept_id'],
            raw: true
        });

        const cal = await calculation.findOne({
            where: { academic_sem: academic_sem.academic_sem }
        });

        const resultByDept = await buildResultByDept(
            deptList,
            academicYear,
            academic_sem,
            cal
        );

        if (Object.keys(resultByDept).length === 0) {
            return res.status(404).json({
                error: "No data found for the selected academic year"
            });
        }

        const doc = await buildWordDoc(resultByDept, academicYear);
        const buffer = await Packer.toBuffer(doc);
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=PSO_Report_${timestamp}.docx`);
        res.send(buffer);

    } catch (err) {
        console.error("Error generating Word document:", err);
        res.status(500).json({ error: "Failed to generate Word document" });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Shared data builder

async function buildResultByDept(deptList, academicYear, academic_sem, cal) {

    const resultByDept = {};

    for (const { dept_id } of deptList) {

        const graduateInfo = await markentry.findOne({
            where: { academic_year: academicYear, dept_id },
            attributes: ['graduate'],
            raw: true
        });

        const graduate = graduateInfo?.graduate || "PG";

        const courseEntries = await markentry.findAll({
            where: { academic_year: academicYear, dept_id },
            attributes: ['course_code'],
            raw: true
        });

        const uniqueCourseCode = [...new Set(courseEntries.map(c => c.course_code))];

        if (uniqueCourseCode.length === 0) {
            continue;
        }

        // Fetch course names
        const courseDetails = await coursemapping.findAll({
            where: { course_code: uniqueCourseCode },
            attributes: ['course_code', 'course_title'],
            group: ['course_code', 'course_title'],
            raw: true
        });

        const courseNames = {};
        courseDetails.forEach(course => {
            courseNames[course.course_code] = course.course_title;
        });

        // Fetch all marks for these courses
        const marks = await markentry.findAll({
            where: {
                course_code: uniqueCourseCode,
                academic_year: academicYear
            }
        });

        // Initialize data structures
        let countAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };
        const studentCountsByCourse = {};

        // Process each mark entry
        await Promise.all(marks.map(async entry => {
            const {
                course_code,
                c1_lot = 0, c2_lot = 0, a1_lot = 0, a2_lot = 0,
                c1_mot = 0, c2_mot = 0,
                c1_hot = 0, c2_hot = 0,
                ese_lot = 0, ese_mot = 0, ese_hot = 0
            } = entry.dataValues;

            // Calculate percentages
            const lot_pct = cal.c_lot ? ((c1_lot + c2_lot + a1_lot + a2_lot) / cal.c_lot) * 100 : 0;
            const mot_pct = cal.c_mot ? ((c1_mot + c2_mot) / cal.c_mot) * 100 : 0;
            const hot_pct = cal.c_hot ? ((c1_hot + c2_hot) / cal.c_hot) * 100 : 0;
            const elot_pct = cal.ese_lot ? (ese_lot / cal.ese_lot) * 100 : 0;
            const emot_pct = cal.ese_mot ? (ese_mot / cal.ese_mot) * 100 : 0;
            const ehot_pct = cal.ese_hot ? (ese_hot / cal.ese_hot) * 100 : 0;

            // Initialize counters for this course if not exists
            ['lot', 'mot', 'hot', 'elot', 'emot', 'ehot'].forEach(t => {
                if (!countAboveThreshold[t][course_code]) countAboveThreshold[t][course_code] = 0;
            });

            if (!studentCountsByCourse[course_code]) studentCountsByCourse[course_code] = 0;
            studentCountsByCourse[course_code]++;

            // Check if above threshold
            if (cal.co_thresh_value) {
                if (lot_pct >= cal.co_thresh_value) countAboveThreshold.lot[course_code]++;
                if (mot_pct >= cal.co_thresh_value) countAboveThreshold.mot[course_code]++;
                if (hot_pct >= cal.co_thresh_value) countAboveThreshold.hot[course_code]++;
                if (elot_pct >= cal.co_thresh_value) countAboveThreshold.elot[course_code]++;
                if (emot_pct >= cal.co_thresh_value) countAboveThreshold.emot[course_code]++;
                if (ehot_pct >= cal.co_thresh_value) countAboveThreshold.ehot[course_code]++;
            }
        }));

        // Calculate percentages above threshold
        let pctAbove = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };
        for (const code of uniqueCourseCode) {
            const total = studentCountsByCourse[code] || 1;
            for (const t of ['lot', 'mot', 'hot', 'elot', 'emot', 'ehot']) {
                pctAbove[t][code] = ((countAboveThreshold[t][code] || 0) / total) * 100;
            }
        }

        // Calculate attained scores
        let attainedScores = {
            lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {},
            overall: {}, avgOverallScore: {}, grade: {}, courseNames: {},
            graduate: graduate
        };

        for (const code of uniqueCourseCode) {

            attainedScores.lot[code] = await calculateCategory(pctAbove.lot[code] || 0, cal);
            attainedScores.mot[code] = await calculateCategory(pctAbove.mot[code] || 0, cal);
            attainedScores.hot[code] = await calculateCategory(pctAbove.hot[code] || 0, cal);
            attainedScores.elot[code] = await calculateCategory(pctAbove.elot[code] || 0, cal);
            attainedScores.emot[code] = await calculateCategory(pctAbove.emot[code] || 0, cal);
            attainedScores.ehot[code] = await calculateCategory(pctAbove.ehot[code] || 0, cal);

            // Calculate overall scores with weightage
            if (cal.cia_weightage && cal.ese_weightage) {
                attainedScores.overall[code] = {
                    lot: (attainedScores.lot[code] * (cal.cia_weightage / 100)) + (attainedScores.elot[code] * (cal.ese_weightage / 100)),
                    mot: (attainedScores.mot[code] * (cal.cia_weightage / 100)) + (attainedScores.emot[code] * (cal.ese_weightage / 100)),
                    hot: (attainedScores.hot[code] * (cal.cia_weightage / 100)) + (attainedScores.ehot[code] * (cal.ese_weightage / 100)),
                };

                const avg = (attainedScores.overall[code].lot + attainedScores.overall[code].mot + attainedScores.overall[code].hot) / 3;
                attainedScores.avgOverallScore[code] = avg;
                attainedScores.grade[code] = gradeLabel(avg);
            }
        }

        // Add course names to the result
        attainedScores.courseNames = courseNames;

        // PSO calculation
        let totalCapso1 = 0, totalCapso2 = 0, totalCapso3 = 0, totalCapso4 = 0, totalCapso5 = 0;
        let courseCount = 0;

        for (const code of uniqueCourseCode) {

            attainedScores.capso = attainedScores.capso || {};

            // Find RS matrix for this course
            const cop = await rsmatrix.findAll({ where: { course_code: code } });

            if (cop && cop.length > 0) {
                const { lot, mot, hot } = attainedScores.overall[code] || { lot: 0, mot: 0, hot: 0 };

                for (const entry of cop) {

                    // Calculate denominators (total possible contributions)
                    const d1 = (entry.co1_pso1 + entry.co2_pso1 + entry.co3_pso1 + entry.co4_pso1 + entry.co5_pso1) || 1;
                    const d2 = (entry.co1_pso2 + entry.co2_pso2 + entry.co3_pso2 + entry.co4_pso2 + entry.co5_pso2) || 1;
                    const d3 = (entry.co1_pso3 + entry.co2_pso3 + entry.co3_pso3 + entry.co4_pso3 + entry.co5_pso3) || 1;
                    const d4 = (entry.co1_pso4 + entry.co2_pso4 + entry.co3_pso4 + entry.co4_pso4 + entry.co5_pso4) || 1;
                    const d5 = (entry.co1_pso5 + entry.co2_pso5 + entry.co3_pso5 + entry.co4_pso5 + entry.co5_pso5) || 1;

                    // Calculate weighted contributions
                    const c1 = ((lot * entry.co1_pso1) + (lot * entry.co2_pso1) + (mot * entry.co3_pso1) + (mot * entry.co4_pso1) + (hot * entry.co5_pso1)) / d1;
                    const c2 = ((lot * entry.co1_pso2) + (lot * entry.co2_pso2) + (mot * entry.co3_pso2) + (mot * entry.co4_pso2) + (hot * entry.co5_pso2)) / d2;
                    const c3 = ((lot * entry.co1_pso3) + (lot * entry.co2_pso3) + (mot * entry.co3_pso3) + (mot * entry.co4_pso3) + (hot * entry.co5_pso3)) / d3;
                    const c4 = ((lot * entry.co1_pso4) + (lot * entry.co2_pso4) + (mot * entry.co3_pso4) + (mot * entry.co4_pso4) + (hot * entry.co5_pso4)) / d4;
                    const c5 = ((lot * entry.co1_pso5) + (lot * entry.co2_pso5) + (mot * entry.co3_pso5) + (mot * entry.co4_pso5) + (hot * entry.co5_pso5)) / d5;

                    totalCapso1 += c1;
                    totalCapso2 += c2;
                    totalCapso3 += c3;
                    totalCapso4 += c4;
                    totalCapso5 += c5;

                    attainedScores.capso[code] = {
                        capso1: c1, capso2: c2, capso3: c3, capso4: c4, capso5: c5,
                        capso: (c1 + c2 + c3 + c4 + c5) / 5
                    };
                }
                courseCount++;
            }
        }

        // Calculate mean PSO scores
        const n = courseCount || 1;
        const pso1 = totalCapso1 / n;
        const pso2 = totalCapso2 / n;
        const pso3 = totalCapso3 / n;
        const pso4 = totalCapso4 / n;
        const pso5 = totalCapso5 / n;

        attainedScores.meanScores = {
            pso1, pso2, pso3, pso4, pso5,
            pso: (pso1 + pso2 + pso3 + pso4 + pso5) / 5
        };

        resultByDept[dept_id] = attainedScores;
    }

    return resultByDept;
}

// ------------------------------------------------------------------------------------------------------- //

// Pure helpers 

async function calculateCategory(percentage, cal) {
    try {
        if (!cal) return 0;
        if (percentage >= (cal.so_l3_ug || 75)) return 3;
        if (percentage >= (cal.so_l2_ug || 50)) return 2;
        if (percentage >= (cal.so_l1_ug || 25)) return 1;
        return 0;
    } catch (error) {
        console.error('Error in calculateCategory:', error);
        return 0;
    }
}

// ------------------------------------------------------------------------------------------------------- //

// Get unique academic years

route.get("/academic-years", async (req, res) => {
    try {
        const years = await academic.findAll({
            attributes: [
                [Sequelize.fn("DISTINCT", Sequelize.col("academic_year")), "academic_year"]
            ],
            order: [["academic_year", "ASC"]]
        });

        res.json(years.map(y => y.academic_year));
    } catch (error) {
        console.error("Error fetching academic years:", error);
        res.status(500).json({ error: "Failed to fetch academic years" });
    }
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;