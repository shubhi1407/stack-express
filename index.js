var mysql = require('mysql');
var express = require('express');
var _ = require('underscore');
var cors = require('cors');
var countries = require('./countries.json');

var app = express();
app.use(cors());

app.use(wwwRedirect);

app.use('/',express.static('public'));

function wwwRedirect(req, res, next) {
    if (req.headers.host.slice(0, 4) === 'www.') {
        var newHost = req.headers.host.slice(4);
        return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
    }
    next();
};

var con = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "password",
    database: 'stackNetwork'
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

//Tags api
app.get('/getData/tags',function(req,res){
    con.query("select tagName, GROUP_CONCAT(count order by quarter desc SEPARATOR ', ') as counts from tags_analysis group by tagName",function(error,results){
	if(error!=null){
	    res.send(error);
	    return;
	}
	
	results = results.map(function(res){
	    return {
		tagName:res.tagName,
		counts:res.counts.split(", ")
	    }
	});
	res.json({
	    tags: _.pluck(results,'tagName'),
	    counts:_.pluck(results,'counts')
	});
		 
    });
})

//Demographic API
app.get('/getData/:table', function(req, res) {
	var table=req.params.table;

    con.query('select * from ' +table+' where DATE(creation_date)=(select DATE(MAX(creation_date)) from ' +table+ ' )', function(error, results) {
        var creationDate = results[0].creation_date;
        if (error) throw error;
        var response = {};
        var count=0;
        _.each(results, function(res) {
        	count+=res.count;
            var country = _.find(countries, function(country) {
                return country.name == res.Location;

            })
            if (country != null && country != undefined) {
                response[country.code] = res.count;
            }
        })       
        res.json({
            creation_Date: creationDate,
            count:count,
            result: response
        });
    })

});

app.listen(3000);
