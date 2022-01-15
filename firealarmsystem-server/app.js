// Import module
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var mqttUtils = require('./mqtt_utils')

// Import HTTP route
var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')

var app = express()
var port = process.env.PORT || '9999'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// NodeJS Middleware
app.use(logger('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// HTTP route
app.use('/', indexRouter)
app.use('/users', usersRouter)

// MQTT connection

// Tạo MQTT Client
const mqttClient = mqttUtils.getMQTTClient()

// Đăng ký và gửi dữ liệu tới các topic

// Xử lý dữ liệu gửi tới
mqttClient.on('message', function(topic, payload){
  console.log(`Receive a message from topic $topic}\nPayload: ${payload}\n\n`);

  // Xử lý
})

app.listen(port, function(){
  console.log(`Listening on port ${port}`);
})
