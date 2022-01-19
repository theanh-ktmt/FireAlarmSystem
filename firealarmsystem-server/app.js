// Import module
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mqttUtils = require('./mqtt_utils')
const mqttInfo = require('./config.json').MQTTBrokerInfo
const database = require('./database')
const utils = require('./utils')

// Import HTTP route
const indexController = require('./routes/index')
const userController = require('./routes/user')

// Khởi tạo express
const app = express()
const port = process.env.PORT || '9999'

// Tạo MQTT Client
const mqttClient = mqttUtils.getMQTTClient()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// NodeJS Middleware
app.use(logger('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use('/public', express.static(path.join(__dirname, 'public')))

// HTTP route
indexController(app, mqttClient)
userController(app, mqttClient)

// MQTT connection
// Thông tin topic
const dataTopic = mqttInfo.dataTopic
const commandTopic = mqttInfo.commandTopic

// Đăng ký và nhận dữ liệu từ sensor trên data topic
mqttClient.on('connect', () => {
  console.log(`Connected to Broker ${mqttInfo.host} port ${mqttInfo.port}`)
  mqttClient.subscribe([dataTopic], () => {
    console.log(`Subscribed to topic ${dataTopic}`);
  })
})

// Xử lý dữ liệu gửi tới
mqttClient.on('message', function(topic, payload){
  // Tiếp nhận dữ liệu gửi tới
  if(topic == mqttInfo.dataTopic){
    // Lấy dữ liệu
    const data = JSON.parse(payload.toString())

    const cardid = + data['cardid']
    const temp = (+ data['temperature']).toFixed(2)
    const humi = (+ data['humidity']).toFixed(2)
    const fire = + data['fire']
    const gas = + data['gas']
    console.log('------------------------------------')
    console.log(`Recieve data from ${cardid}: \n\t- Temperature: \t${temp}\n\t- Humidity: \t${humi}\n\t- Fire: \t${fire}\n\t- Gas: \t\t${gas}\n`);

    // Đánh giá độ nguy hiểm theo độ ưu tiên fire > gas > temp and humi
    var response = {};
    response['type'] = "warning"
    response['cardid'] = cardid

    if(humi < 50){
      response['danger'] = 'DRY!'
    }

    if(temp > 32){
      response['danger'] = 'TOO HOT!'
    }

    if(gas > 300){
      response['hasGas'] = 1
      response['danger'] = 'GAS LEAK!'
    }
    else{
      response['hasGas'] = 0
    }

    if(fire < 200){
      response['hasFire'] = 1
      response['danger'] = "FIRE!"
    }
    else{
      response['hasFire'] = 0
    }

    if(!response['danger']){
      response['danger'] = "No danger"
    }

    // Lưu dữ liệu xuống CSDL
    const conn = database.createConnection()

    // Lưu trữ vào CSDL
    conn.query('insert into environment_state(cardid, temperature, humidity, fire, gas, thoigian) values (?, ?, ?, ?, ?, ?)', [cardid, temp, humi, fire, gas, utils.getCurrentDateString()], function(err, results){
      if(err) throw err

      console.log("Saved data to database.\n")
      conn.end()
    })

    // Gửi lại dữ liệu vào kênh command
    mqttClient.publish(commandTopic, JSON.stringify(response), {qos: 0, retain: false}, (error) => {
      if(error){
        console.error(error)
      }

      console.log(`Send result to topic ${mqttInfo.commandTopic}\n\t- Has fire: \t${response['hasFire']}\n\t- Has gas: \t${response['hasGas']}\n\t- Danger: \t${response['danger']}\n`);
    })
  }
})

app.listen(port, function(){
  console.log(`Listening on port ${port}`);
})
