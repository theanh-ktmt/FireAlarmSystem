// import module
var database = require('../database')
var utils = require('../utils')

module.exports = function (app, mqttClient) {

  // ---------------------- Phía Website ------------------------------- //

  // home page web
  app.get('/', function (req, res, next) {
    res.render('index');
  })

  app.get('/home', function (req, res) {
    res.render('home')
  })

  // Đăng nhập trên web
  app.post('/loginFromWeb', function (req, res) {
    // Dữ liệu gửi lên
    const username = req.body.username
    const password = req.body.password

    // Truy vấn cơ sở dữ liệu
    const conn = database.createConnection()

    // ... Truy vấn
    conn.query('select * from user where username = ? and password = ?', [username, password], function(err, results){
      if(err) throw err
      
      // Tồn tại user
      if(results.length > 0){
        res.send({
          status: 'success',
          message: 'Đăng nhập thành công',
          userInfo: {
            id: results[0].id,
            name: results[0].name
          }
        })
      }

      // Không tồn tại user
      else{
        res.send({
          status: 'fail',
          message: 'Tài khoản không tồn tại!'
        })
      }

      conn.end()
    })
  })

  // Đăng ký User trên web
  app.post('/register', function (req, res) {
    // Thông tin người dùng
    const username = req.body.username
    const password = req.body.password
    const cardid = utils.hexDecoder(req.body.cardid)
    const name = req.body.name
    const email = req.body.email

    // Kiểm tra thông tin người dùng
    const conn = database.createConnection()

    // Kiểm tra xem thông tin người dùng đã tồn tại chưa
    conn.query('select * from user where username = ? or cardid = ?', [username, cardid], function(err, results){
      // Đã tồn tại tài khoản
      if(results.length > 0){
        res.send({
          status: 'fail',
          message: 'Tài khoản đã tồn tại'
        })

        console.log("Thêm thất bại");
        conn.end()
      }

      // Tài khoản chưa tồn tại
      else{
        // Thêm tài khoản vào cơ sỏ dữ liệu
        conn.query('insert into user(username, password, name, cardid, email) values (?, ?, ?, ?, ?)', [username, password, name, cardid, email], function(err, results){
          if(err) throw err

          res.send({
            status: 'success',
            message: "Đăng ký thành công"
          })

          console.log("Thêm thành công");
          conn.end()
        })
      }
    })
  })

  // ---------------------- Phía phần cứng ------------------------------- //

  // Đăng nhập bằng thẻ từ
  app.post('/loginFromHome', function (req, res) {
    // Dữ liệu gửi lên từ nhà (mã số của thẻ Mifare)
    const mifareCode = req.body.code;
    console.log("A user is logging in with code: ", mifareCode);

    // Truy vấn cơ sở dữ liệu
    const conn = database.createConnection()

    conn.query('select name FROM user where cardid = ?;', [mifareCode], function (err, results) {
      if (err) throw err

      // Đăng nhập thành công
      if (results.length > 0) {
        res.send({
          status: 'success',
          message: "Login successfully!",
          userInfo: {
            name: utils.removeAccent(results[0].name),
          }
        })
      }

      // Đăng nhập thất bại
      else {
        res.send({
          status: 'fail',
          message: "Card ID not exist!",
        })
      }

      conn.end()
    })
  })
}