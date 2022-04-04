var axios = require("axios");
var mysql = require("mysql");

const http = require("http");

const hostname = "127.0.0.1";
const port = 8080;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// Para Pasarlo a docker https://nodejs.org/de/docs/guides/nodejs-docker-webapp/
require("dotenv").config();

var con = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

var delay_1_hour = 60 * 60 * 1000; // 1 hour in msec
var delay_60_second = 60 * 1000; // 20 segundos

// para ver si se establecio la conexion
con.connect(function (err) {
  if (err) throw err;
});

con.on("error", function (err) {
  console.log("caught this error: " + err.toString());
});

var config = {
  method: "get",
  url: "https://api.estadisticasbcra.com/uva",
  headers: {
    Authorization: process.env.rest_bcra_authorization,
  },
};

function callApi() {
  axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      response.data.forEach(grabarMysql);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function grabarMysql(item, index) {
  // id de mercado pago
  console.log(JSON.stringify(item, null, 4));

  var fecha = String(item.d);
  var uva_valor = String(item.v);

  const valores = {
    fecha: fecha,
    uva_valor: uva_valor,
  };

  console.log("Insertar ", valores.fecha);
  // "INSERT IGNORE INTO node_mercado_pago SET ?",
  con.query("REPLACE INTO tmpuva SET ?", valores, (err, res) => {
    if (err) throw err;
    // console.log("Last insert ID:", res.insertId);
    // console.log("Last insert ID:", err);
    console.log("Ultima fecha API Cargada: ", fecha);
    console.log("Ultima VALOR UVA  Cargado: ", uva_valor);
  });
}

// ***************************************************
// **** para que no se corte la conexion con Mysql ***
// ***************************************************
setInterval(function () {
  var query = "SELECT 1 + 1 as solution";
  con.query(query, function (err, result, fields) {
    if (err) throw err;
    // console.log('Cada 15 segundos: The solution is: ', result[0].solution);
  });
}, 55000);

// ***************************************************
// **** Para que se llame Cada hora ***
// ***************************************************
setInterval(function () {
  callApi();

  /*   axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      response.data.forEach(grabarMysql);
    })
    .catch(function (error) {
      console.log(error);
    }); */
}, delay_1_hour);
