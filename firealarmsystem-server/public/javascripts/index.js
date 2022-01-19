document.addEventListener('DOMContentLoaded', function () {
    // Button chuyển trạng thái
    const buttonToRight = document.querySelector('.to-right')
    const buttonToLeft = document.querySelector('.to-left')

    buttonToRight.addEventListener('click', function(){
        document.querySelector('.login-container').style.display = 'none'
        buttonToLeft.style.display = 'block'

        document.querySelector('.register-container').style.display = 'block'
        buttonToRight.style.display = 'none'

        document.querySelector('.content-left').style.flex = 1
        document.querySelector('.content-right').style.flex = 5
    })

    buttonToLeft.addEventListener('click', function(){
        document.querySelector('.login-container').style.display = 'block'
        buttonToLeft.style.display = 'none'

        document.querySelector('.register-container').style.display = 'none'
        buttonToRight.style.display = 'block'

        document.querySelector('.content-left').style.flex = 5
        document.querySelector('.content-right').style.flex = 1
    })
})