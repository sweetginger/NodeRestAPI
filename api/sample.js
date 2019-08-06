/*
*   Pelly CRM REST API
*   @author hyr
*/

var express  = require('express');
var router   = express.Router();
var mysql    = require('mysql');

var db = mysql.createConnection({
    host:'localhost',
    user:'user',
    password:'password!',
    database:'database',
    multipleStatements: true
});

const preSelect = ``;
const postSelect = ``;

/* AES encrypt function */
function encryptFunc(val){
  let query = `TO_BASE64(AES_ENCRYPT('${val}', 'pE##yCrM^'))`;
  return query;
}

/* AES decrypt function */
function decryptFunc(columnName){
  let query = `CAST(AES_DECRYPT(FROM_BASE64(${columnName}), 'pE##yCrM^') AS CHAR)`;
  return query;
}

// ------------------------------------------------ hyr cms query start -------------

/* ----- test api ----- */
/* 원하는 컬럼 및 조건 요청하여 결과받기 테스트 */ 
router.post('/testList',
  function(req, res, next){
    let result = {result: false, message: 'error', items: []};

    console.log(`@@@ req.body.selectColumns --> ${req.body.selectColumns}`);

    let queryWant = `SELECT articleSeq
                        ,title
                        ,content
                        ,regUser
                    FROM cms_article3`;
    let query = `SELECT `;
    for(let i=0; i<req.body.selectColumns.length; i++){
      query += req.body.selectColumns[i];
      if(i < req.body.selectColumns.length - 1){
        query += `, `;
      }
    }
    query += ` FROM cms_article3 `;

    // whereColumns 객체에 키가 존재하면 where절을 추가한다.
    if(Object.keys(req.body.whereColumns).length){
      query += `WHERE 1=1 `;
      for(let i in req.body.whereColumns){
        query += `AND ${i} = ${req.body.whereColumns[i]} `;
      }
    }

    console.log(`@@@@ TEST API QUERY --> ${query}`);

    db.query(query,
      function(err, rows, fields){
        if(!err){
          result.result = true;
          result.message = 'success';
          result.items = rows;

          res.json(result);
        } else {
          res.json(result);
        }
      }
    );
  }
);

/* ----- test ----- */
router.get('/index', function(req, res, next){
    const result = {msg: "hello yurim", result: true};

    res.status(200).json(result);
});


module.exports = router;
