/*
 *   Pelly Survey admin REST API
 *   ---> USE MYSQL2 , sync query (not async)
 *   @author hyr
 */

var express = require('express');
var router = express.Router();
var mysql = require('mysql2');
var promise = require('mysql2/promise');

var db = mysql.createConnection({
    //
});

var pool = promise.createPool({
    //
});

var promiseDb = promise.createConnection({
    //
});

const preSelect = ``;
const postSelect = ``;

/* AES encrypt function */
function encryptFunc(val) {
    let query = `TO_BASE64(AES_ENCRYPT('${val}', '암호화키'))`;
    return query;
}

/* AES decrypt function */
function decryptFunc(columnName) {
    let query = `CAST(AES_DECRYPT(FROM_BASE64(${columnName}), '암호화키') AS CHAR)`;
    return query;
}

// ------------------------------------------------ hyr cms query start -------------

/* Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }

    if (connection) connection.release()

    return
})
*/

/* await로 하나씩 담기 test get -- 이거안됨 */
router.get('/awaitTest', async function (req, res, next) {
    let result = {
        result: false,
        message: 'error',
        items: []
    };

    let query = `SELECT COUNT(*) FROM survey_question WHERE useYn = 'Y'`;
    await promiseDb.execute(query)
        .then((rows, fields) => {
            result.items.push(rows);
        }).catch((err) => {
            console.log(err)
        });

    query = `SELECT 99, 12 FROM dual`;
    await promiseDb.execute(query)
        .then((rows, fields) => {
            result.items.push(rows);
        })
        .catch((err) => {
            console.log(err)
        });

    return res.json(result);
});

/* mysql2 async await test get -- 됨 */
router.get('/asyncAwaitTest', async function (req, res, next) {
    let result = {
        result: false,
        message: 'error',
        items: {}
    };

    let query = `SELECT COUNT(*) FROM survey_question WHERE useYn = 'Y'`;
    await pool.query(query).then((rows, fields) => {
            result.items.query1 = rows[0];

            query = `SELECT 99, 12 FROM dual`;
            return pool.query(query);
        }).catch(err => {
            console.log(err);
            return res.json(result);
        }).then((rows, fields) => {
            result.items.query2 = rows[0];
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.json(result);
        });
});

/* mysql2 promise test get -- 됨 */
router.get('/promiseTest',
    function (req, res, next) {
        let result = {
            result: false,
            message: 'error',
            items: {}
        };
        let query = `SELECT COUNT(*) cnt FROM survey_question WHERE useYn = 'Y'`;

        db.promise().query(query).then((rows, fields) => {
                console.log(`query1 : 개수 구하기 ---> ${rows}`);
                console.log(JSON.stringify(rows));


                result.items.query1 = rows[0];

                query = `SELECT 99 FROM dual`;
                return db.promise().query(query);
            }).catch(err => console.log(err))
            .then((rows, fields) => {
                console.log(`두번째 쿼리 여기서 실행한다`);
                result.items.query2 = rows[0];
                return res.json(result);
            }).catch(err => console.log(err));
    }
);

/* test get */
router.get('/getTest',
    function (req, res, next) {
        let result = {
            result: false,
            message: 'error',
            items: []
        };
        let query = `SELECT COUNT(*) FROM survey_question WHERE useYn = 'Y'`;

        db.query(query,
            function (err, rows, fields) {
                if (!err) {
                    result.result = true;
                    result.message = 'success';
                    result.items = rows;

                    res.json(result);
                } else {
                    console.log(err);
                    res.json(result);
                }
            }
        );
    }
);

/*
 * 관리자 화면 - 설문 등록수정 MERGE
 */
router.post('/survey',
    function (req, res, next) {
        let result = {
            result: false,
            message: 'error',
            items: {}
        };

        const title = req.body.title;
        const content = req.body.content;
        const tenantId = req.body.tenantId;

        let insertData = [];

        let query = `/* 설문 마스터 MERGE */
                 INSERT INTO survey_master(title, content, tenantId, regDt`;

        if (req.body.surveySeq) {
            query += `, surveySeq`;
        }

        query += `) VALUES(?, ?, ?, NOW()`;
        insertData.push(`'${title}'`);
        insertData.push(`'${content}'`);
        insertData.push(`${tenantId}`);

        if (req.body.surveySeq) {
            query += `, ?`;
            insertData.push(`${req.body.surveySeq}`);
        }
        query += `) ON DUPLICATE KEY UPDATE
                    title = ?,
                    content = ?,
                    tenantId = ?,
                    updDt = NOW()`;
        insertData.push(`'${title}'`);
        insertData.push(`'${content}'`);
        insertData.push(`${tenantId}`);

        if (req.body.surveySeq) {
            query += `, surveySeq = ${req.body.surveySeq}`;
            insertData.push(`${req.body.surveySeq}`);
        }
        query += `;`;

        if (req.body.question.length > 0) {
            query += `/* 설문 문항 MERGE */`;

            for (let i in req.body.question) {
                let questionSeq = `${req.body.result[i].questionSeq}`;
                // TODO :: 설문문항 루프 돌면서 머지
                query += `INSERT INTO survey_question(surveySeq, title, type, tenantId`;

                if (req.body.questionSeq) {
                    query += `, questionSeq`;
                }

                query += `) VALUES(?, ?, ?, ?`;

                if (req.body.questionSeq) {
                    query += `, ?`;
                }

                query += `) ON DUPLICATE KEY UPDATE
                    surveySeq = ?,
                    title = ?,
                    type = ?,
                    tenantId = ?
                    `;



                db.query(query, insertData, function (err, result, fields) {
                    console.log(`@@@ insertData =`);
                    for (let k = 0; k < insertData.length; k++) {
                        console.log(`${insertData[k]},`);
                    }

                    console.log(`@@@ insert survey_result query ---> ${query}`);
                    if (err) {
                        console.log(err);
                        queryResult.error = err;
                        resultMap.items.error++;
                    }
                    resultMap.items.success += result.affectedRows;
                    console.log(`result.affectedRows = ${result.affectedRows}`);

                });
            }
        }

        if (resultMap.items.error > 0) {
            console.log(err);
            res.json({
                error: queryResult.error,
                ...resultMap
            });
            // res.json({result: false, message: 'error', error: err});
        } else {
            resultMap.result = true;
            resultMap.message = 'success';
            res.json(resultMap);
        }

    }
);

/* ----- test api ----- */
/* 원하는 컬럼 및 조건 요청하여 결과받기 테스트 */
router.post('/testList',
    function (req, res, next) {
        let result = {
            result: false,
            message: 'error',
            items: []
        };

        console.log(`@@@ req.body.selectColumns --> ${req.body.selectColumns}`);

        let queryWant = `SELECT articleSeq
                        ,title
                        ,content
                        ,regUser
                    FROM cms_article3`;
        let query = `SELECT `;
        for (let i = 0; i < req.body.selectColumns.length; i++) {
            query += req.body.selectColumns[i];
            if (i < req.body.selectColumns.length - 1) {
                query += `, `;
            }
        }
        query += ` FROM cms_article3 `;

        // whereColumns 객체에 키가 존재하면 where절을 추가한다.
        if (Object.keys(req.body.whereColumns).length) {
            query += `WHERE 1=1 `;
            for (let i in req.body.whereColumns) {
                query += `AND ${i} = ${req.body.whereColumns[i]} `;
            }
        }

        console.log(`@@@@ TEST API QUERY --> ${query}`);

        db.query(query,
            function (err, rows, fields) {
                if (!err) {
                    result.result = true;
                    result.message = 'success';
                    result.items = rows;

                    res.json(result);
                } else {
                    console.log(err);
                    res.json(result);
                }
            }
        );
    }
);

/* ----- test ----- */
router.get('/index', function (req, res, next) {
    const result = {
        msg: "hello yurim",
        result: true
    };

    res.status(200).json(result);
});


module.exports = router;