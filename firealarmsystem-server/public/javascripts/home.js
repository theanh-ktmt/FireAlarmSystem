document.addEventListener('DOMContentLoaded', function () {
    // Dữ liệu
    var xLabels = ['12:00:05', '12:00:10', '12:00:15', '12:00:20', '12:00:25', '12:00:30']
    var yValues = [24, 25, 28, 29, 18, 30]
    
    // Đổ dữ liệu lên biểu đồ
    const tempChart = drawChart(1, "Nhiệt độ", xLabels, yValues)
    const humiChart = drawChart(2, "Độ ẩm", xLabels, yValues)
    const fireChart = drawChart(3, "Cảm biến lửa", xLabels, yValues)
    const gasChart = drawChart(4, "Cảm biến khí gas", xLabels, yValues)

    // update dữ liệu liên tục
    setInterval(function(){
        updateData(tempChart, humiChart, fireChart, gasChart)
    }, 5000)

    // Nút làm mới
    const refreshButton = document.querySelector('.button-refresh')
    refreshButton.addEventListener('click', function(){
        updateData(tempChart, humiChart, fireChart, gasChart)
    })
})

function updateData(tempChart, humiChart, fireChart, gasChart){
    console.log('Update dữ liệu');

    const cardId = + document.querySelector('.content-left-user-info span').innerHTML
    const userId = + window.location.pathname.split('/')[2]
    console.log(userId, cardId);

    // Gọi API để update dữ liệu
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            const res = JSON.parse(this.responseText)

            console.log(res);
            // Đổ dữ liệu lên màn hình
            
            if(res.latestStateList.length > 0){
                // Update phần thông tin hiện tại
                const listInfo = document.querySelectorAll('.content-left-env-info-item h1')
                listInfo[0].innerHTML = `${res.latestStateList[0].temperature.toFixed(2)}<span>&ordm;C</span>`
                listInfo[1].innerHTML = `${res.latestStateList[0].humidity.toFixed(2)}<span>%</span>`
                listInfo[2].innerHTML = `${res.latestStateList[0].fire.toFixed(0)}`
                listInfo[3].innerHTML = `${res.latestStateList[0].gas.toFixed(0)}`

                // Update phần warning
                const warning = document.querySelector('.content-left-env-info-status span')
                warning.innerHTML = res.latestStateList[0].warning
                if(warning.innerHTML == 'An toàn'){
                    warning.style.color = 'limegreen'
                }
                else if(warning.innerHTML == 'Không rõ'){
                    warning.style.color = 'deepskyblue'
                }
                else{
                    warning.style.color = 'red'
                }

                // Update phần system state
                const state = res.systemState
                const systemControll = document.querySelector('.content-left-control-body')
                if(state == 1){
                    systemControll.innerHTML = `
                        <p><i class="fas fa-check-circle"></i> Trạng thái: <span style="color: limegreen;">Bật</span></p>
                        <button onclick="turnOff()"><i class="fas fa-power-off"></i> Tắt hệ thống</button>
                    `
                }
                else{
                    systemControll.innerHTML = `
                        <p><i class="fas fa-check-circle"></i> Trạng thái: <span style="color: red;">Tắt</span></p>
                        <button onclick="turnOn()"><i class="fas fa-power-off"></i> Bật hệ thống</button>
                    `
                }

                // Update thời gian
                const timeDisplay = document.querySelector('.content-left-analyse-average-header span')
                const date = new Date()
                timeDisplay.innerHTML = `${('0' + date.getDate()).slice(-2)}-${('0' + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}` 

                // Update giá trị trung bình
                const avgInfo = document.querySelectorAll('.content-left-analyse-item h1')
                avgInfo[0].innerHTML = `${res.avgState.temperature.toFixed(2)}<span>&ordm;C</span>`
                avgInfo[1].innerHTML = `${res.avgState.humidity.toFixed(2)}<span>%</span>`
                avgInfo[2].innerHTML = `${res.avgState.fire.toFixed(0)}`
                avgInfo[3].innerHTML = `${res.avgState.gas.toFixed(0)}`

                // Update giá trị sơ đồ
                const newTimeSeries = []
                const newTemp = []
                const newHumi = []
                const newFire = []
                const newGas = []

                res.latestStateList.forEach(function(state){
                    const d = new Date(state.thoigian)
                    newTimeSeries.push(`${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}`)
                    newTemp.push(state.temperature.toFixed(2))
                    newHumi.push(state.humidity.toFixed(2))
                    newFire.push(state.fire.toFixed(0))
                    newGas.push(state.gas.toFixed(0))
                })

                // Reverse
                newTimeSeries.reverse()
                newTemp.reverse()
                newHumi.reverse()
                newFire.reverse()
                newGas.reverse()

                updateChart(tempChart, newTimeSeries, newTemp)
                updateChart(humiChart, newTimeSeries, newHumi)
                updateChart(fireChart, newTimeSeries, newFire)
                updateChart(gasChart, newTimeSeries, newGas)
            }
            else{
                return
            }
        }
    }

    xhttp.open('GET', `/user/${userId}/updateData?cardId=${cardId}`, true)
    xhttp.send()
}

// Hàm update đồ thị
function updateChart(chart, newX, newY){
    chart.data.labels = newX
    chart.data.datasets[0].data = newY
    chart.update()
}

// Hàm vẽ đồ thị
function drawChart(chartIndex, chartLabel, xLabels, yValues){
    var ChartTag = document.querySelector(`.content-right-chart-container:nth-child(${chartIndex}) canvas`).getContext("2d")
    var colorList = ['rgb(244, 67, 54)', 'rgb(255, 152, 0)', 'rgb(33, 150, 243)', 'rgb(4, 170, 109)', 'rgb(0, 188, 212)']
    var chart = new Chart(ChartTag, {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: [{
                label: chartLabel,
                data: yValues,
                backgroundColor: [
                    colorList[(chartIndex - 1) % 5]
                ],
                borderColor: [
                    colorList[(chartIndex - 1) % 5]
                ],
                borderWidth: 2
            }]
        }
    })

    return chart
}

// Hàm đăng xuất
function logout(){
    window.location = window.location.protocol + '//' + window.location.host + '/'
}

// Hàm bật hệ thống
function turnOn(){
    // Gọi API tắt hệ thống
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            console.log('Turn on success');
        }
    }

    const userId = + window.location.pathname.split('/')[2]
    xhttp.open('GET', `/user/${userId}/control/1`, true)
    xhttp.send()

    // Thay đổi giao diện
    const controlBox = document.querySelector('.content-left-control-body')
    controlBox.innerHTML = `
        <p><i class="fas fa-check-circle"></i> Trạng thái: <span style="color: limegreen;">Bật</span></p>
        <button onclick="turnOff()"><i class="fas fa-power-off"></i> Tắt hệ thống</button>
    `
}

// Hàm tắt hệ thống
function turnOff(){
    // Gọi API tắt hệ thống
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            console.log('Turn off success');
        }
    }

    const userId = + window.location.pathname.split('/')[2]
    xhttp.open('GET', `/user/${userId}/control/0`, true)
    xhttp.send()

    // Thay đổi giao diện
    const controlBox = document.querySelector('.content-left-control-body')
    controlBox.innerHTML = `
        <p><i class="fas fa-check-circle"></i> Trạng thái: <span style="color: red;">Tắt</span></p>
        <button onclick="turnOn()"><i class="fas fa-power-off"></i> Bật hệ thống</button>
    `
}
