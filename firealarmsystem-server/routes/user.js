var database = require('../database')
var mqttConfig = require('../config.json').MQTTBrokerInfo
var utils = require('../utils')
var mailer = require('../mailer')

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
        conn.query('select * from user where id = ?', [userid], function(err, results){
            if(err) return err
            
            // tồn tại card id
            if(results.length > 0){
                cardCode = results[0].cardid
                console.log(results[0].cardid);

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

                res.send('success')
                conn.end()
            }
            else{
                res.send('fail')
                conn.end()
            }
        })
    })

    // Đăng nhập vào trang home
    app.get('/user/:uid/home', function(req, res){
        const uid = req.params.uid

        // Tạo kết nối tới cơ sở dữ liệu
        const conn = database.createConnection()

        conn.query(`select * from user where id = ?`, [uid], function(err, results){
            if(err) throw err

            const userid = results[0].id
            const username = results[0].name
            const cardid = results[0].cardid

            // Lấy những dữ liệu khác
            const queryList = []
            const date = new Date()
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()


            // lấy danh sách dữ liệu mới nhất ngày hôm nay
            queryList.push(`select * from environment_state where cardid = ${cardid} and thoigian between '${year}-${month}-${day}' and '${year}-${month}-${day} 23:59:59' order by thoigian desc limit 1`) 

            // lấy giá trị trung bình trong ngày
            
            queryList.push(`select avg(temperature) as atemp, avg(humidity) as ahumi, avg(fire) as afire, avg(gas) as agas from environment_state where cardid = ${cardid} and thoigian between '${year}-${month}-${day}' and '${year}-${month}-${day} 23:59:59'`) 

            // Lấy trạng thái hiện tại của hệ thống
            queryList.push(`select * from system_state where cardid = ${cardid}`)
            conn.query(queryList.join(';'), function(err, results){
                if(err) throw err

                // Thông số hiện tại
                var curState = {};
                
                if(results[0].length > 0){
                    curState = {
                        temperature: results[0][0].temperature.toFixed(2),
                        humidity: results[0][0].humidity.toFixed(2),
                        fire: results[0][0].fire,
                        gas: results[0][0].gas,
                        warning: utils.warningTranslater(results[0][0].warning)
                    }
                }
                else{
                    curState = {
                        temperature: 0,
                        humidity: 0,
                        fire: 0,
                        gas: 0,
                        warning: utils.warningTranslater("")
                    }
                }

                // Thông số trung bình
                const avgState = {
                    temperature: (results[1][0].atemp || 0).toFixed(2),
                    humidity: (results[1][0].ahumi || 0).toFixed(2),
                    fire: (results[1][0].afire || 0).toFixed(0),
                    gas: (results[1][0].agas || 0).toFixed(0)
                }
                
                // Trạng thái hệ thống
                const system_state = + results[2][0].state

                res.render('home', {
                    userid: userid,
                    username: username,
                    cardid: cardid,
                    systemState: system_state,
                    curState: curState,
                    avgState: avgState
                })

                conn.end()
            })
        })
    })

    app.get('/user/:uid/updateData', function(req, res){
        const uid = req.params.uid
        const cardid = req.query.cardId

        // lấy dữ liệu mới nhất

        // Tạo kết nối tới db
        const conn = database.createConnection()

        // Lấy những dữ liệu khác
        const queryList = []
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // lấy danh sách dữ liệu mới nhất ngày hôm nay
        queryList.push(`select * from environment_state where cardid = ${cardid} and thoigian between '${year}-${month}-${day}' and '${year}-${month}-${day} 23:59:59' order by thoigian desc limit 10`) 

        // lấy giá trị trung bình trong ngày
        
        queryList.push(`select avg(temperature) as atemp, avg(humidity) as ahumi, avg(fire) as afire, avg(gas) as agas from environment_state where cardid = ${cardid} and thoigian between '${year}-${month}-${day}' and '${year}-${month}-${day} 23:59:59'`) 

        // Lấy trạng thái hiện tại của hệ thống
        queryList.push(`select * from system_state where cardid = ${cardid}`)

        // Lấy thông tin user
        queryList.push(`select * from user where id = ${uid}`)

        conn.query(queryList.join(';'), function(err, results){
            if(err) throw err

            // Danh sách 10 dữ liệu mới nhất
            const latestStateList = []
            results[0].forEach(function(row) {
                latestStateList.push({
                    temperature: row.temperature,
                    humidity: row.humidity,
                    fire: row.fire,
                    gas: row.gas,
                    thoigian: row.thoigian,
                    warning: utils.warningTranslater(row.warning)
                })
            })

            // Kiểm tra trạng thái
            const curWarning = latestStateList[0].warning

            // có nguy hiểm
            if(curWarning != 'Không rõ' && curWarning != 'An toàn'){
                console.log('Có nguy hiểm!!!');
                // Kiểm tra lần cảnh báo cuối
                // Thời gian update gần đây nhất
                const lastAnnounce = new Date(results[3][0].lastannounce)
                const curTime = new Date()

                const timeStampInMinute = 15 // 15p cập nhật 1 lần
                const timeStampInMillis = timeStampInMinute * 60 * 1000

                // đủ thời gian
                if(curTime - lastAnnounce > timeStampInMillis){
                    // Cảnh báo
                    const email = results[3][0].email
                    const str = `Chúng tôi đã phát hiện những thông số bất thường trong căn nhà của bạn.\nKết quả dự đoán: ${curWarning}\n\nBạn hãy quay về trang web để theo dõi thông tin chi tiết.\nTrân trọng,\nPopcorn`
                    mailer.sendMail(email, "Popcorn: WARNING!!!", str, function(err, info){
                        if(err) throw err
                    
                        console.log('Send mail: ', info.response);
                    })

                    console.log("Cảnh báo người dùng");

                    // Cập nhật lại thời gian
                    const updateConn = database.createConnection()

                    updateConn.query('update user set lastannounce = "?-?-? ?:?:?" where id = ?', [curTime.getFullYear(), curTime.getMonth() + 1, curTime.getDate(), curTime.getHours(), curTime.getMinutes(), curTime.getSeconds(), uid], function(err, results){
                        if(err) throw err

                        console.log("Cập nhật thời gian thông báo thành công");

                        updateConn.end()
                    })
                }
            }

            // Dữ liệu trung bình trong ngày
            const avgState = {
                temperature: results[1][0].atemp,
                humidity: results[1][0].ahumi,
                fire: results[1][0].afire,
                gas: results[1][0].agas
            }

            // Trạng thái hiện tại của hệ thống
            const systemState = + results[2][0].state

            res.json({
                latestStateList: latestStateList,
                avgState: avgState,
                systemState: systemState
            })
            
            conn.end()
        })
    })

    // Cập nhật thời gian update
    app.get('/user/:uid/updateLastAnnounce', function(req, res){
        const newTime = new Date(req.query.newTime)
        const uid = req.params.uid

        // Tạo kết nối database
        const conn = database.createConnection()

        conn.query('update user set lastannounce = "?-?-? ?:?:?" where id = ?', [newTime.getFullYear(), newTime.getMonth + 1, newTime.getDate(), newTime.getHours(), newTime.getMinutes(), newTime.getSeconds(), uid], function(err, results){
            if(err) throw err

            console.log("Cập nhật thời gian thành công");
            res.send('OK')
            conn.end()
        })
    })
}
