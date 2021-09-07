var axios = require("axios");
var mysql = require("mysql");

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
    Authorization:
      "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjIyMTU1OTUsInR5cGUiOiJleHRlcm5hbCIsInVzZXIiOiJjb3NlY2hhc2lzdGVtYUBnbWFpbC5jb20ifQ.xwawKXq6XsrAI8K-eUKb7LbFtFvR71axWaOIPg2ryoc3Oc8DXmzKhRRLXwa-65hHg8Rl5BLa5kYS6A7XKV9-IA",
  },
};

axios(config)
  .then(function (response) {
    // console.log(JSON.stringify(response.data));
    response.data.forEach(grabarMysql);
  })
  .catch(function (error) {
    console.log(error);
  });

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
    console.log("Last insert ID:", res.insertId);
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
}, 15000);

// ***************************************************
// **** Para que se llame Cada hora ***
// ***************************************************
setInterval(function () {
  axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      response.data.forEach(grabarMysql);
    })
    .catch(function (error) {
      console.log(error);
    });
}, delay_1_hour);
