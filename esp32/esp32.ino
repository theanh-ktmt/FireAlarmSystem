/**************** Import thư viện ******************/ 
#include <Wire.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <Arduino_JSON.h>
#include <SPI.h>
#include <MFRC522.h>
#include <math.h>

/**************** Danh sách hằng số ******************/ 
#define DHT_TYPE DHT11
#define LCD_ADDR 0x27
#define LCD_HEIGHT 4
#define LCD_WIDTH 20
#define STEP 100
#define BUZZER_CHANNEL 0
#define DATA_CYCLE 5000 // gửi dữ liệu mỗi 5s

/**************** Danh sách GPIO ******************/ 
#define NORMAL_PIN 2
#define ALERT_PIN 0
#define ERR_PIN 15
#define BUZZER_PIN 4
#define DHT_PIN 14
#define FIRE_PIN 34
#define GAS_PIN 35
#define RFID_RST_PIN 13
#define RFID_SS_PIN 5

/**************** Tham số sử dụng ******************/ 
// Thông số wifi
const char* ssid = "The Anh";
const char* password = "theanhbeo372000";

// Địa chỉ Server
String serverAddr = "http://171.245.27.199:9999";

// Địa chỉ MQTT Broker
String mqtt_server = "broker.hivemq.com";
const uint16_t mqtt_port = 1883;

// Serial baudrate
const int baudrate = 115200;

// Trạng thái hiện tại của server
int isOn = 0;

// Tần số còi
unsigned int buzzer_f = 500;

// Thông số môi trường
float temp, humi;
int  fire, gas;

// Topic
String dataTopic = "popcorn_mqtt_fas_data";
String commandTopic = "popcorn_mqtt_fas_command";

// Tham số khác
// Mã thẻ đang dùng {0xA1, 0x3E, 0xBC, 0x1B}
int myID[4];
int Id;
int fixId = 0;
int i;
int lastUpdate = 0;

/**************** Khởi tạo cấu trúc dữ liệu ******************/ 
DHT dht(DHT_PIN, DHT_TYPE); 
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_WIDTH, LCD_HEIGHT);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

/**************** Định nghĩa hàm ******************/ 
// convert 0-3.3V 12bit -> 0.5V 10bit
int convert(int a){
  return (int) (a / 4096.0 * 3.3 / 5.0 * 1024.0);
}

// Đổi màu led cảnh báo
void changeLedState(String state){
  if(state == "red"){
    digitalWrite(ALERT_PIN, HIGH);
    digitalWrite(NORMAL_PIN, LOW);
    digitalWrite(ERR_PIN, LOW);
  }

  if(state == "green"){
    digitalWrite(ALERT_PIN, LOW);
    digitalWrite(NORMAL_PIN, HIGH);
    digitalWrite(ERR_PIN, LOW);
  }

  if(state == "blue"){
    digitalWrite(ALERT_PIN, LOW);
    digitalWrite(NORMAL_PIN, LOW);
    digitalWrite(ERR_PIN, HIGH);
  }
}

// Bật còi báo động
void warning(){
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  ledcWriteNote(BUZZER_CHANNEL, NOTE_C, 4);
  delay(1000);
  ledcDetachPin(BUZZER_PIN);
}

// Hiển thị khung dữ liệu
void displayInfo(float temp, float humi){
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp(C): ");
  lcd.setCursor(0, 1);
  lcd.print("Humi(%): ");
  lcd.setCursor(0, 2);
  lcd.print("Fire: ");
  lcd.setCursor(10, 2);
  lcd.print("Gas: ");
  lcd.setCursor(0, 3);
  lcd.print("Danger: ");

  // Thông số môi trường
  lcd.setCursor(12, 0);
  lcd.print(temp);
  lcd.setCursor(12, 1);
  lcd.print(humi);
}

// Hiển thị dữ liệu server gửi về
void displayStatus(int hasFire, int hasGas, String danger){
  lcd.setCursor(6, 2);
  if(hasFire){
    lcd.print("YES");
  }
  else{
    lcd.print("NO ");
  }
  lcd.setCursor(16, 2);
  if(hasGas){
    lcd.print("YES");
  }
  else{
    lcd.print("NO ");
  }
  lcd.setCursor(9, 3);
  lcd.print("           ");
  lcd.setCursor(9, 3);
  lcd.print(danger);
}

// Hàm call back khi có dữ liệu gửi tới từ Broker
void callback(char* topic, byte* payload, unsigned int length){
  Serial.print("New message from topic: ");
  Serial.println(topic);
  for (int i = 0; i < length; i++){
    Serial.print((char) payload[i]);
  }
  Serial.println();

  // Xử lý ở đây
  if( (String) topic == commandTopic){
    JSONVar command = JSON.parse((String) ((const char*) payload));

    // Kiểm tra xem tín hiệu điều khiển có phải cho mình không
    if((int) command["cardid"] == fixId){
      Serial.println("Right ID");
      // Tín hiệu nhận được là tín hiệu điều khiển
      if((String) ((const char*)command["type"]) == "control"){
        Serial.println("Control Signal");
        int signal = (int) command["state"];
  
        // Tín hiệu điều khiển khác với trạng thái hiện tại
        if(signal != isOn){
          isOn = signal;
  
          // Xử lý
          if(isOn){
            Serial.println("Signal: Turn on");
            lcd.clear();
            lcd.setCursor(3, 1);
            lcd.print("System is ON!");
            lcd.setCursor(4, 2);
            lcd.print("Popcorn Team");
          }
          else{
            Serial.println("Signal: Turn off");
            lcd.clear();
            lcd.setCursor(3, 1);
            lcd.print("System is OFF!");
            lcd.setCursor(4, 2);
            lcd.print("Popcorn Team");
          }

          delay(1000);
        }
      }
      
      // Tín hiệu nhận được là tín hiệu cảnh báo
      else{
        Serial.println("Warning Signal");
        // Lấy tham số gửi về
        int hasFire = command["hasFire"];
        int hasGas = command["hasGas"];
        String danger = (String) ((const char*) command["danger"]);
  
        // Hiển thị lên
        if(isOn){
          displayStatus(hasFire, hasGas, danger);
        }
  
        // Chuyển màu led
        if(danger == "No danger"){
          changeLedState("green");
        }
        else {
          changeLedState("red");
          warning();
        }
      }
    }
  }
}

// Hàm kết nối lại Broker nếu mất kết nối
void reconnectBroker(){
  // Hiển thị thông báo
  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("Connecting to Broker");
  lcd.setCursor(8, 2);
  lcd.print("...");

  Serial.println("Connecting to Broker ... ");
  
  // Kết nối thành công
  while(!mqttClient.connect("ESP32_ID1", "ESP_OFFLINE", 0, 0, "ESP32_ID1_OFFLINE")){
    Serial.print("Error, rc = ");
    Serial.print(mqttClient.state());
    Serial.println("Try again in 5 seconds");

    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("Error!!!");
    lcd.setCursor(0, 2);
    lcd.print("Try again in 5s ...");

    delay(5000);
  }

  // Kết nối thành công
  Serial.println("Connected to Broker!");

  // Subscribe vào topic command để nhận tín hiệu điều khiển
  mqttClient.subscribe(commandTopic.c_str()); // <------ Thay đổi topic ở đây

  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("Connected to Broker");
  delay(1000);
}

// Hàm kết nối lại nếu mất Wifi
void reconnectWifi(){
  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("Connecting to Wifi");
  lcd.setCursor(8, 2);
  lcd.print("...");
  
  while(WiFi.status() != WL_CONNECTED){
    Serial.println("Connecting to WiFi ... ");
    delay(1000);
  }
  
  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("Connected to Wifi!");
  lcd.setCursor(5, 2);
  lcd.print(ssid);
  Serial.print("Connected to Wifi ");
  Serial.println(ssid);
  delay(1000);
}

/**************** Cấu hình hệ thống ******************/ 
void setup() {
  // Đặt baudrate cho serial
  Serial.begin(baudrate);

  // Đặt chế độ cho các PIN
  pinMode(ALERT_PIN, OUTPUT);
  pinMode(NORMAL_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GAS_PIN, INPUT);
  pinMode(FIRE_PIN, INPUT);

  // Khởi động cảm biến DHT
  Serial.println("Starting sensors ... ");
  dht.begin();

  // Cấu hình màn LCD
  Serial.println("Starting LCD ... ");
  lcd.init();
  lcd.begin(LCD_WIDTH, LCD_HEIGHT);
  lcd.backlight();
  lcd.print("Hello user!!!");
  lcd.setCursor(4, 3);
  lcd.print("Popcorn Team");
  delay(1000);

  // Cấu hình RFID
  Serial.println("Starting RFID ... ");
  SPI.begin();
  mfrc522.PCD_Init();

  // Cấu hình Wifi
  WiFi.begin(ssid, password);

  // Cấu hình MQTT server và port
  mqttClient.setServer(mqtt_server.c_str(), mqtt_port);
  mqttClient.setCallback(callback);
}

/**************** Vòng lặp hệ thống ******************/ 
void loop() {

  /**************** 1. Kiểm tra kết nối ******************/ 
  // Mất kết nối tới Wifi
  if(WiFi.status() != WL_CONNECTED){
    changeLedState("blue");
    reconnectWifi();
    return;
  }

  // Sau khi kết nối Wifi, tiến hành kết nối lại MQTT broker nếu cần
  if(!mqttClient.connected()){
    changeLedState("blue");
    
    reconnectBroker();

    // Hoàn tất kết nối
    lcd.clear();
    lcd.setCursor(3, 1);
    if(isOn){
      lcd.print("System is ON!");
    }
    else{
      lcd.print("System is OFF!");
    }
    lcd.setCursor(4, 2);
    lcd.print("Popcorn Team");
    delay(1000);
  }

  mqttClient.loop(); // Đọc dữ liệu trên mqtt queue

  // Sau khi kết nối tới Broker thành công, bắt đầu thực hiện vòng lặp
  // Thực hiện tiếp ...

  /**************** 2. Kiểm tra có thẻ nào không ******************/ 
  
  if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()){
    Serial.println("Checking card ID ...");

    // Hiển thị thông báo ra LCD
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("Verifying your ID");
    lcd.setCursor(0, 2);
    lcd.print("Please wait ...");
    delay(500);
    
    
    // Đọc id từ thẻ MIFARE
    for (i = 0; i < 4; i ++){
      myID[i] = mfrc522.uid.uidByte[i];
    }

    // Ghép 4 byte id thành 1 số
    Id = 0;
    for (i = 0; i < 4; i ++){
      Id += myID[i] * pow(256, i);
    }

    // Nếu đây là lần quẹt đầu tiên
    // hoặc mã thẻ chính xác (giống với mã đã cấu hình)
    if(!fixId || Id == fixId){
      // Gửi card ID lên server để đăng nhập
      JSONVar json;
      json["code"] = Id;
  
      HTTPClient http;
      String path = serverAddr + "/loginFromHome";
      http.begin(path.c_str());
      http.addHeader("Content-Type", "application/json");
      int resCode = http.POST(JSON.stringify(json));
  
      JSONVar response;
      if(resCode == 200){ // Thành công
        String payload = http.getString();
        response = JSON.parse(payload);
  
        // Đăng nhập thành công
        if((String) ((const char*) response["status"]) == "success"){
          String username = (String) ((const char*) response["userInfo"]["name"]);
          Serial.println(response["message"]);
          Serial.print("Username: ");
          Serial.println(username);

          // Cấu hình ID cho lần quẹt thẻ đầu tiên
          if(!fixId) fixId = Id;
          
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Correct UID!");
          lcd.setCursor(0, 1);
          lcd.print("Hello!!");
          lcd.setCursor(3, 2);
          lcd.print(username);
  
          delay(2000);
  
          isOn = 1 - isOn; // Đổi trạng thái
  
          // Bật hệ thống
          if(isOn){
            Serial.println("Turning on ...");
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("System is ready!");
            lcd.setCursor(3, 1);
            lcd.print("Running ...");
            lcd.setCursor(5, 3);
            lcd.print("Hello Boss!");
          }
  
          // Tắt hệ thống
          else{
            Serial.println("Turning off ...");
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("System is stopped!");
            lcd.setCursor(3, 1);
            lcd.print("Turning off ...");
            lcd.setCursor(5, 3);
            lcd.print("Goodbye Boss!");
  
            delay(1000);
  
            lcd.clear();
            lcd.setCursor(3, 1);
            lcd.print("System is OFF!");
            lcd.setCursor(4, 2);
            lcd.print("Popcorn Team");
          }
        }
  
        // Đăng nhập thất bại
        else{
          Serial.println(response["message"]);
          lcd.clear();
          lcd.setCursor(5, 1);
          lcd.print("Wrong UID!");
          lcd.setCursor(2, 2);
          lcd.print("Please try again!");
        }
      }
      else{
        changeLedState("blue");
        Serial.println("Server is not responding!");
        lcd.clear();
        lcd.setCursor(2, 1);
        lcd.print("Not responding!");
        lcd.setCursor(0, 2);
        lcd.print("Please try again!");
      }
    }
    else {
      Serial.println("Your ID does not match with system ID!");
      lcd.clear();
      lcd.setCursor(5, 1);
      lcd.print("Wrong UID!");
      lcd.setCursor(2, 2);
      lcd.print("Please try again!");
    }    

    delay(1000);
    return;
  }

  /**************** 3. Gửi dữ liệu lên server ******************/
  // Hệ thống đang bật
  if(isOn){
    // Đủ 1 chu kỳ đọc dữ liệu
    if(millis() - lastUpdate > DATA_CYCLE){
      lastUpdate = millis();
      
      // Đọc dữ liệu từ DHT11
      temp = dht.readTemperature();
      humi = dht.readHumidity();
  
      Serial.println("_______________________");
      Serial.print("Temperature: ");
      Serial.println(temp);
      Serial.print("Humidity: ");
      Serial.println(humi);
  
      // Đọc dữ liệu từ cảm biến lửa
      fire = analogRead(FIRE_PIN);
      fire = convert(fire);
      Serial.print("Fire: ");
      Serial.println(fire);
      
      // Đọc dữ liệu từ cảm biến chất lượng không khí
      gas = analogRead(GAS_PIN);
      gas = convert(gas);
      Serial.print("Gas: ");
      Serial.println(gas);
      Serial.println();
      
      // Gửi dữ liệu lên server bằng MQTT
      JSONVar json;
      json["cardid"] = Id;
      json["temperature"] = temp;
      json["humidity"] = humi;
      json["fire"] = fire;
      json["gas"] = gas;
  
      // Gửi dữ liệu qua MQTT
      mqttClient.publish(dataTopic.c_str(), JSON.stringify(json).c_str());

      // Hiển thị dữ liệu
      displayInfo(temp, humi);
    }
  }
  // Tắt hệ thống
  else{
    
  }

  delay(STEP);
}
