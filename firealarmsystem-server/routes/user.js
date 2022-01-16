var database = require('../database')
var mqttConfig = require('../config.json').MQTTBrokerInfo

module.exports = function(app, mqttClient){
    // Gửi tín hiệu điều khiển
    app.get('/user/:uid/control/:state', function(req, res){
        // Lấy thông tin request
        const userid = req.params.uid
        const state = + req.params.state
    
        // Lấy mã hệ thống
        var cardCode = 465321633
        const conn = database.createConnection()
    
        // Truy xuất để lấy thông tin card code của user
    
        conn.end()
    
        // gửi tín hiệu điều khiển lên topic điều khiển
        const command = {}
        command['type'] = 'control'
        command['cardid'] = cardCode
        command['state'] = state
    
        mqttClient.publish(mqttConfig.commandTopic, JSON.stringify(command), {qos: 0, retain: false}, (error) => {
        if(error){
            console.error(error)
        }
    
        console.log(`Send command to topic ${mqttConfig.commandTopic}\n\t- Card code: \t${cardCode}\n\t- Command: \t${state == 1? 'On' : 'Off'}\n`);
        })

        res.send('OK')
    })
}
