HiiirImageuploadPreviewer.js
==================

# Description

可以對單張圖片上傳進行及時預覽，並且可以針對圖片檔案大小，尺寸與檔案類型設定驗證條件

This is a really simple jquery plugin for preview and valid single image upload 

based on input type=file


## How to use it ##

### step1: link the CSS file

```
 <link href=""hiiirImageuploadPreviewer/hiiirImageuploadPreviewer.css" rel="stylesheet">
```

### step2: link the js file & jquery

```
 <script src="jquery-1.9.1.min.js"></script>
 <script src="hiiirImageuploadPreviewer/hiiirImageuploadPreviewer.js"></script>
```

### step3: use & enjoy it!

```
 $('#imageUploader').hiiirImageuploadPreviewer({
	 previewer: $('#imagePreviewer'),
     fileSize: '3000kb',
     imgSize: {
         width: '<1500',
         height: '<3000'
     },
     imgType: ['png', 'jpg'],
     validateCallback: function(validObj) {
         // dosomething for validations
         // ex. alert('your image is too big!!')
     }
 });	
```


## options

```
// input file selector, input file位置
$('#imageUploader').hiiirImageuploadPreviewer({ 
    
    // img tag selector, 要預覽的img tag位置
    previewer: $('#imagePreviewer'),	
    
    // 限制檔案大小
    fileSize: '3000kb',	// mb, kb, ex: '150kb', '2mb'
    
    // 限制圖片大小
    imgSize: { 
        width: '<1500', // 圖片寬度: 可用 '>', '<', '>=', '<=', '==', 如果不寫則不驗證
        height: '<3000' // 圖片高度: 可用 '>', '<', '>=', '<=', '==', 如果不寫則不驗證
    },
    
    // 限制圖片類型: 目前只開放 jpg, png, bmp, gif, tiff等格式,如果不寫則判斷全部內建格式 
    imgType: ['png', 'jpg'], 
    	                                        
    // 驗證錯誤callback function
    validateCallback: function(validObj) {
        // dosomething for validations
        // ex. alert('your image is too big!!')
    },
    successCallback: function() {
        // dosomething
    },
    defaultImg: { // 設定若驗證失敗，要顯示的預設圖，若無設定則顯示上一次成功上傳的預覽圖
        url: 'images/1px.png',
        width: '100',
        height: '200'
    }
});
```