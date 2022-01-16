const mysql = require('mysql')
const dbConfig = require('../config.json').databaseInfo

module.exports = {
    createConnection: function() {
        const connection = mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user, 
            password: dbConfig.password, 
            database: dbConfig.database,
            multipleStatements: true
        })

        connection.connect()

        return connection
    }
}