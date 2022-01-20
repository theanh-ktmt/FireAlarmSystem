module.exports = {
    // Bỏ dấu tiếng việt
    removeAccent: function (str) {
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        str = str.replace(/đ/g, 'd');
        // str = str.replace(/\W+/g, ' ');
        // str = str.replace(/\s/g, '-');
        
        var capitalStr = str.split(' ')
        for(let i = 0; i < capitalStr.length; i++){
            capitalStr[i] = capitalStr[i][0].toUpperCase() + capitalStr[i].substring(1)
        }
        
        return capitalStr.join(' ')
    },
    getCurrentDateString: function(){
        const date = new Date()
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    },
    hexDecoder: function(str){
        return parseInt(str.split('-').join(''), 16)
    },
    warningTranslater: function(danger){
        if(danger == 'No danger'){
            return 'An toàn'
        }
        else if(danger == 'FIRE!'){
            return 'Có cháy!'
        }
        else if(danger == 'GAS LEAK!'){
            return 'Rò rỉ khí gas!'
        }
        else if(danger == 'TOO HOT!'){
            return 'Nhiệt độ cao!'
        }
        else if(danger == 'DRY!'){
            return 'Khô hanh!'
        }
        else{
            return 'Không rõ'
        }
    },
    getYesterday: function(today){
        return new Date(new Date().getTime() - 24*60*60*1000);
    },
    formatDate: function(date){
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
}