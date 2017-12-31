var mysql = require('mysql');
var express = require('express');
var _ = require('underscore');
var cors= require('cors');
var countries = require('./countries.json');

var app = express();
app.use(cors());

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database : 'stackNetwork'
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.get('/getColumns', function(req, res){
	con.query('select * from demographic where DATE(creation_date)=(select DATE(MAX(creation_date)) from demographic)', function(error,results){

			if(error) throw error;
			var response = {};
			_.each(results,function(res){
				var country =_.find(countries,function(country){
					return country.name==res.Location;

				})
				if(country!=null && country!=undefined){
					response[country.code]=res.count;
				} 
			})

			res.json(response); 	 	
	})
  
});

app.listen(3001);