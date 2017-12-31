const BigQuery = require('@google-cloud/bigquery');
var mysql = require('promise-mysql');
// const json2csv = require('json2csv');
const Promise = require('bluebird');

//const fs = require('fs');
//const fields = ['id', 'location'];

// Google Cloud Platform project ID
const projectId = 'utility-ratio-190419';
var DBconn = null;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: 'stackNetwork'
}).then(function(conn) {
    console.log("Connected");
    DBconn = conn;
}).catch(function(err) {
    console.error("Error connection to databse");
    console.log(err);
});


// Creates a client
function queryStackOverflow(projectId, sqlQuery) {

    // Imports the Google Cloud client library
    const BigQuery = require('@google-cloud/bigquery');

    const bigquery = new BigQuery({
        projectId: projectId,
    });

    // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    // Runs the query
    bigquery
        .query(options)
        .then(results => {
            const rows = results[0];
            //     var csv = json2csv({ data: rows, fields: fields });
            //  fs.writeFile('file.csv', csv, function(err) {
            //   if (err) throw err;
            //   console.log('file saved');
            // });
            var promises = [];
            var values = [];

            for (var i = 0; i < rows.length; i++)
                values.push([rows[i].id, rows[i].location]);

            //Since there can be huge number of rows. We split it into multiple batches
            var noOfRecords = Math.floor(values.length / 10000);

            for (i = 0; i <= noOfRecords; i++) {
                var tempRecords = values.splice(0, 10000);
                saveToDB(tempRecords, promises);
            }

            //When all queries are run
            Promise.all(promises).then(function() {
                console.log("Saved all records");
                //Close the connection
                DBconn.end();
                process.exit(1);
            }).catch(function() {
            	DBconn.end();
                console.error("Error saving to DB");
            })

        }).catch(err => {
            console.error('ERROR:', err);
        });
}
var q1 = `SELECT
    p.id, u.location 
    FROM \`bigquery-public-data.stackoverflow.posts_questions\` p
    JOIN \`bigquery-public-data.stackoverflow.users\` u ON p.owner_user_id = u.id
    WHERE p.creation_date > '2017-10-28' and u.location IS NOT NULL and u.location!=''`;

//var q2 = `DESCRIBE bigquery-public-data.stackoverflow.posts_questions`;
queryStackOverflow(projectId, q1);
//queryStackOverflow(projectId, q2);

function saveToDB(records, promises) {
    promises.push(DBconn.query('INSERT INTO  posts_questions (id, Location) VALUES ?', [records]));
}