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

// Hàm xử lý sự kiện login
function login(){
    const username = document.querySelector('.login-username').value
    const password = document.querySelector('.login-password').value
    const announce = document.querySelector('.login-announce')

    console.log(username, password);

    if(!username || !password){
        announce.innerHTML = 'Bạn cần nhập đủ thông tin để đăng nhập'
    }
    else{
        // Gửi request lên server
        var xhttp = new XMLHttpRequest()
        xhttp.onreadystatechange = function(){
            // Gửi request và nhận response thành công
            if(this.readyState == 4 && this.status == 200){
                const res = JSON.parse(this.responseText)
                if(res['status'] == 'success'){
                    console.log("success");
                    const userid = res['userInfo']['id']
                    window.location = `/user/${userid}/home`
                }
                else{
                    console.log('fail');
                    announce.innerHTML = res['message']
                }
            }
        }
    }

    xhttp.open('POST', '/loginFromWeb', true)
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send(`username=${username}&password=${password}`)
}

// Hàm xử lý sự kiện register
function register(){
    const username = document.querySelector('.register-username').value
    const password1 = document.querySelector('.register-password-1').value
    const password2 = document.querySelector('.register-password-2').value
    const cardid = document.querySelector('.register-card-id').value
    const name = document.querySelector('.register-name').value
    const announce = document.querySelector('.register-announce')

    console.log(username, password1, password2, cardid)

    if(!username || !password1 || !password2 || !cardid || !name){
        announce.innerHTML = 'Bạn cần nhập đủ các trường dữ liệu để đăng ký'       
    }
    else{
        if(password1 != password2){
            announce.innerHTML = 'Mật khẩu nhập lại không khớp'
        }
        else{
            // gửi request lên server
            var xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function(){
                // Gửi request và nhận response thành công
                if(this.readyState == 4 && this.status == 200){
                    const res = JSON.parse(this.responseText)
                    if(res['status'] == 'success'){
                        console.log("success");
                        announce.innerHTML = 'Đăng ký thành công'
                    }
                    else{
                        console.log('fail');
                        announce.innerHTML = res['message']
                    }
                }
            }

            xhttp.open('POST', '/register', true)
            xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhttp.send(`username=${username}&password=${password1}&cardid=${cardid}&name=${name}`)
        }
    }
}