document.addEventListener('DOMContentLoaded', function () {
    // Dữ liệu
    var xLabels = ['12:00:05', '12:00:10', '12:00:15', '12:00:20', '12:00:25', '12:00:30']
    var yValues = [24, 25, 28, 29, 18, 30]
    
    // Đổ dữ liệu lên biểu đồ
    drawChart(1, "Nhiệt độ", xLabels, yValues)
    drawChart(2, "Độ ẩm", xLabels, yValues)
    drawChart(3, "Cảm biến lửa", xLabels, yValues)
    drawChart(4, "Cảm biến khí gas", xLabels, yValues)
})

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
}