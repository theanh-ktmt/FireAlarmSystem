// import module
var database = require('../database')
var utils = require('../utils')

module.exports = function(app, mqttClient){

    // ---------------------- Phía Website ------------------------------- //

  // home page web
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  })

  // Đăng nhập trên web
  app.post('/loginFromWeb', function(req, res){
    // Dữ liệu gửi lên
    const username = req.body.username
    const password = req.body.password

    // Truy vấn cơ sở dữ liệu
    const conn = database.createConnection()
    
    // ... Truy vấn

    conn.end()

    res.send({
      status: 'success',
      message: 'Đăng nhập thành công',
      userInfo:{
        name: "Tran The Anh"
      }
    })
  })

  // Đăng ký User trên web
  app.post('/register', function(req, res){
    // Thông tin người dùng
    const username = req.body.username
    const password = req.body.password
    const code = req.body.code
    const name = req.body.name
    const avatar = req.body.avatar

    // Kiểm tra thông tin người dùng
    const conn = createConnection()

    // Kiểm tra thông tin tài khoản
    // Nếu đúng, tạo tài khoản
    // Nếu sai, báo lại client

    conn.end()
  })

  // ---------------------- Phía phần cứng ------------------------------- //

  // Đăng nhập bằng thẻ từ
  app.post('/loginFromHome', function(req, res){
    // Dữ liệu gửi lên từ nhà (mã số của thẻ Mifare)
    const mifareCode = req.body.code;
    console.log("A user is logging in with code: ", mifareCode);

    // Truy vấn cơ sở dữ liệu
    const conn = database.createConnection()

    conn.query('select name FROM user where cardid = ?;', [mifareCode], function(err, results){
      if(err) throw err
      
      // Đăng nhập thành công
      if(results.length > 0){
        res.send({
          status: 'success',
          message: "Login successfully!",
          userInfo: {
            name: utils.removeAccent(results[0].name),
          }
        })
      }

      // Đăng nhập thất bại
      else{
        res.send({
          status: 'fail',
          message: "Card ID not exist!",
        })
      }

      conn.end()
    })
  })
}