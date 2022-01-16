// import module
var database = require('../database')

module.exports = function(app, mqttClient){
  // home page web
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  })

  // Đăng nhập bằng thẻ từ
  app.post('/loginFromHome', function(req, res){
    // Dữ liệu gửi lên từ nhà (mã số của thẻ Mifare)
    const mifareCode = req.body.code;
    console.log(mifareCode);

    // Truy vấn cơ sở dữ liệu
    const conn = database.createConnection()

    // ... Truy vấn ...

    conn.end()

    // Kết quả trả về
    res.send({
      status: 'success',
      message: "Login successfully!",
      userInfo: {
        name: "Tran The Anh",
      }
    })
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
}