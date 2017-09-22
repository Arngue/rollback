var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
//var easyimg = require('easyimage');
var fs = require('fs');

var app = express();
app.use(bodyParser());
app.use(cors());
app.use(fileUpload());
var mysql      = require('mysql');

var host;
var port;
var server = app.listen(3000, function () {
   host = server.address().address;
   port = server.address().port;
   
   console.log("Running on http://%s:%s", host, port);
});

//TEST DATABASE CONNECTION

/* B E G I N 	A P I 	C A L L S */
// GET SECTION

app.get('/', function (req, res) {
  var conn = Connect();
  conn.connect();
	res.send('Connected to database');
  conn.end();
});

//AUTH
app.get('/auth', function (req, res) {
   	res.setHeader('Content-Type', 'application/json');
   	var user = req.query["user"];
   	if (user != undefined){
    	res.send(JSON.stringify({ token: "eoeo" + user }));
   	}
   	else{
    	res.send(JSON.stringify({ token: "undefined" }));
   		console.log("Anonymous user tryed to log in");
   	}
});

// DEMO DATABASE
app.get("/database", function (req,res){
  res.setHeader('Content-Type', 'application/json');
  var conn = Connect();
  conn.connect();
	conn.query('SELECT "Test" as demo from dual', function(err, rows, fields) {
	  if (!err)
	    res.send(rows);
	  else
	    console.log('Error while performing Query: ' + err);
	});
  conn.end();
})

// NEWS
// retornar noticies
app.get('/news', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  var query = "Select id, title, description, portrait, tags, content, (Select min(id) From News) as firstId ";
  query += "From News ";
  query += "Order By 1 DESC Limit ";
  var limit;
  if(req.query.top != undefined)
    limit = req.query.top;
  else
    limit = 5;
  query += limit;
  Query(query,res);
});
// Retornar totes les notícies entre 2 id de notícia
app.get('/news/:idStart/:idEnd', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var query = "Select id, title, description, portrait, tags, content, (Select min(id) From News) as firstId ";
  query += "From News ";
  query += " Where id between ";
  query += req.params.idStart;
  query += " and ";
  query += req.params.idEnd;
  query += " Order By 1 DESC";
  Query(query,res);
});
// Afegir notícia
app.post('/add/new', function (req, res) {
   	res.setHeader('Content-Type', 'application/json');
   	if (Validate(req)){
   		//get data
      //console.dir(req.body);
   		var titulo = req.body.title;
   		var descripcion = req.body.desc;
   		var imagen = req.body.img;
   		var contenido = req.body.content;
   		var etiquetas = req.body.tags;
      var user = req.body.user;
      var forum = req.body.forum;
   		var query = 'Call InsertNews("'+titulo+'","'+forum+'","'+descripcion+'","'+imagen+'","'+etiquetas+'","'+contenido+'","'+user+'")';
      var conn = Connect();
      conn.connect();
		  conn.query(query, function(err, rows, fields) {
		  	if (!err){
		      	res.send(JSON.stringify({ 
		      		estado: "INSERTADO"
		      	}));
		      	console.log('Se ha insertado: ', titulo);
		  	}else{
		  	    console.log('------- Error al insertar ----');
            console.log(query);
            console.log(err);
            console.log(rows);
            console.log(fields);
		  	}
		  });
      conn.end();
   	}else{
    	res.send(JSON.stringify({ token: "undefined" }));
   		console.log("Anonymous user tryed to log in");
   	}
});
// File Upload
app.post('/fileupload', function (req, res) { 
  res.setHeader('Content-Type', 'application/json');
  if (Validate(req)){
    console.log(req.body.user);
    var dir = '/archives/' + req.body.user + '/';
    //var thumbnails = dir + 'thumbnails/';
    if (!fs.existsSync('/archives')){
      fs.mkdirSync('/archives');
    }
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    //if (!fs.existsSync(thumbnails)){
    //  fs.mkdirSync(thumbnails);
    //}
  
    req.files.file.mv(dir + req.files.file.name, function(err) {
      console.log(err);
      if (err !== null)
        return res.status(500).send(err);
      else {
        //var name = req.files.file.name.split('.')[0];
        //var type = req.files.file.name.split('.')[1];
        //console.log(name + " " + type);
        //if(type == "png" || type == "gif" || type == "jpg" || type == "jpeg") {
        //  easyimg.rescrop({
        //       src: dir + req.files.file.name, 
        //       dst: thumbnails + name + '-thumbnail.' + type,
        //       width: 500, height: 500, 
        //       cropwidth:128, cropheight:128,
        //       x:0, y:0
        //    }).then(
        //    function(image) {
        //       console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
        //    },
        //    function (err) {
        //      console.log(err);
        //    }
        //  );
        //}
        var result = JSON.stringify({
          files: [
            {
              name:  req.files.file.name,
              url: 'http://' + host + ':' + port + dir + req.files.file.name,
              //thumbnailUrl: 'http://' + host + ':' + port + thumbnails + name + '-thumbnail.' + type,
              deleteUrl: 'http://' + host + ':' + port + dir + req.files.file.name,
              deleteType: "DELETE"
            }
          ] 
        });
        return res.status(200).send(result);
      }
    });
  }
});
// retornar ultima (Proves)
app.get('/news/last', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
   
    if (Validate(req)){
      res.send(
        JSON.stringify(
          [
            { 
              titulo: "Parche 0.0.0",
              descripcion: "Pronto estará disponible en la BETA. Incluye correciones de errores y nuevos efectos de hechizo.",
              imagen: "http://orig00.deviantart.net/296e/f/2008/238/f/0/circle_of_helaing_by_namesjames.jpg",
              contenido: "El parche incluye numerosas actualizaciones. <ul><li>Corrección de errores</li><li>Nuevas animaciones</li><li>Nueva pantalla de carga</li><li>Nuevo enfrentamiento</li></ul><br>¡No te pierdas todo esto por el módico precio de 5.000 euros!",
              etiquetas: "Esto, es, el, parche, 0.0.0"
            },
            { 
              titulo: "Parche 0.0.0",
              descripcion: "Pronto estará disponible en la BETA. Incluye correciones de errores y nuevos efectos de hechizo.",
              imagen: "http://orig00.deviantart.net/296e/f/2008/238/f/0/circle_of_helaing_by_namesjames.jpg",
              contenido: "El parche incluye numerosas actualizaciones. <ul><li>Corrección de errores</li><li>Nuevas animaciones</li><li>Nueva pantalla de carga</li><li>Nuevo enfrentamiento</li></ul><br>¡No te pierdas todo esto por el módico precio de 5.000 euros!",
              etiquetas: "Esto, es, el, parche, 0.0.0"
            },
            { 
              titulo: "Parche 0.0.0",
              descripcion: "Pronto estará disponible en la BETA. Incluye correciones de errores y nuevos efectos de hechizo.",
              imagen: "http://orig00.deviantart.net/296e/f/2008/238/f/0/circle_of_helaing_by_namesjames.jpg",
              contenido: "El parche incluye numerosas actualizaciones. <ul><li>Corrección de errores</li><li>Nuevas animaciones</li><li>Nueva pantalla de carga</li><li>Nuevo enfrentamiento</li></ul><br>¡No te pierdas todo esto por el módico precio de 5.000 euros!",
              etiquetas: "Esto, es, el, parche, 0.0.0"
            },
            { 
              titulo: "Parche 0.0.0",
              descripcion: "Pronto estará disponible en la BETA. Incluye correciones de errores y nuevos efectos de hechizo.",
              imagen: "http://orig00.deviantart.net/296e/f/2008/238/f/0/circle_of_helaing_by_namesjames.jpg",
              contenido: "El parche incluye numerosas actualizaciones. <ul><li>Corrección de errores</li><li>Nuevas animaciones</li><li>Nueva pantalla de carga</li><li>Nuevo enfrentamiento</li></ul><br>¡No te pierdas todo esto por el módico precio de 5.000 euros!",
              etiquetas: "Esto, es, el, parche, 0.0.0"
            },
            { 
              titulo: "Parche 0.0.0",
              descripcion: "Pronto estará disponible en la BETA. Incluye correciones de errores y nuevos efectos de hechizo.",
              imagen: "http://orig00.deviantart.net/296e/f/2008/238/f/0/circle_of_helaing_by_namesjames.jpg",
              contenido: "El parche incluye numerosas actualizaciones. <ul><li>Corrección de errores</li><li>Nuevas animaciones</li><li>Nueva pantalla de carga</li><li>Nuevo enfrentamiento</li></ul><br>¡No te pierdas todo esto por el módico precio de 5.000 euros!",
              etiquetas: "Esto, es, el, parche, 0.0.0"
            }
          ]
        ));
    }
    else{
      res.send(JSON.stringify({ estado: "undefined" }));
      console.log("Anonymous user tryed to log in");
    }
});

//error page
app.get('/*', function (req,res){
	res.status(400);
   	res.send('Esta página no existe');
});

/* FUNCTIONS */

function Validate(req){
	return req.header("token") != "undefined" && req.header("token") != null;
  return true;
}

function Connect() {
  return mysql.createConnection({
    host     : 'sql125.main-hosting.eu',
    user     : 'u183747716_rb',
    password : 'rollback',
    database : 'u183747716_rb'
  });
} 
function Query(query,res){
  var conn = Connect();
  conn.connect();
  conn.query(query, function(err, rows, fields) {
    if (!err){
      res.send(rows);
    }
    else
      console.log('Error while performing Query: ' + err);
  });
  conn.end();
}