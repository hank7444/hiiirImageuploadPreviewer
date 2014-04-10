/*
hiiirLoading.js
=========================================================
Copyright 2013 Hiiir 台灣時間軸科技股份有限公司
建立者: Hank Kuo
建立時間: 2014-04-02

jquery版本支援: 1.4.1 up

套件描述: hiiirLoading可讓使用方便在目前html畫面上，
加上loading的lightbox與fade效果 
 */


/*
更新記錄:

日期: 2014-04-02
更新描述: 建立原件
更新人: Hank Kuo
*/


/*
使用說明:
   
全畫面loading:

// fadeIn
$.hiiirLoading('fadeIn', {
	msg: '測試fadeIn', // loading面板上要顯示的訊息
	time: 1000, // fadeIn的時間, 單位:ms, 預設值: 1000
	isFade: true, // 是否要使用fade遮蔽全部畫面, 預設值: true
	startCallback: function() { // 當開始fadeIn時呼叫
		console.log('fadeIn Start');
	},
	endCallback: function() { // 當fadeIn結束時呼叫
		console.log('fadeIn End');
	}
});

// fadeOut
$.hiiirLoading('fadeOut', {
	time: fadeOut的時間, 單位:ms, 預設值: 1000
	startCallback: function() { // 當開始fadeOut時呼叫
		console.log('fadeOut Start');
	},
	endCallback: function() { // 當fadeOut結束時呼叫
		console.log('fadeOut End');
	}
});

指定區域loading:

// fadeIn
$('#testarea').hiiirLoading('fadeIn', {
	time: 1000, // fadeIn的時間, 單位:ms, 預設值: 1000
	isFade: true, // 是否要使用fade遮蔽全部畫面, 預設值: true
	startCallback: function() { // 當開始fadeIn時呼叫
		console.log('begin area fadein');
	},
	endCallback: function() { // 當fadeIn結束時呼叫
		console.log('finish area fadein');
	},
	loading: { // loading圖示設定
		//top: 20, // 同等margin-top, 預設值: 0
		//left: 40 // 同等margin-left, 預設值: 0
	},
	fade: { // fade參數設定
		width: '100%', // 寬度, 預設值: '100%'
		height: '100%', // 高度, 預設值: '100%'
		top: 0, // 同等margin-top, 預設值: 0
		left: 0, // 同等margin-left, 預設值: 0
		zindex: 5000, // 同等zindex, 預設值: 5000
		selectors: [ // 其他區塊要跟著用fade遮蔽時, 在此陣列中設定
			{
				selector: $('#sidearea'), // 區塊物件
				settings: {
					width: '100%', // 寬度, 預設值: '100%'
					height: '100%', // 高度, 預設值: '100%'
					top: 0, // 同等margin-top, 預設值: 0
					left: 0, // 同等margin-left, 預設值: 0
					zindex: 5000, // 同等zindex, 預設值: 5000
				}
			},
			{
				selector: $('#anotherarea'),
				settings: {}
			}
			...
		]
	},
});

// fadeOut
$('#testarea').hiiirLoading('fadeOut', {
	time: 1000, // fadeOut的時間, 單位:ms, 預設值: 1000
	startCallback: function() {	// 當開始fadeOut時呼叫
		console.log('begin area fadeout');
	},
	endCallback: function() {	// 當fadeOut結束時呼叫
		console.log('finish area fadeout');
	},
	fade: {
		selectors: [
			{
				selector: $('#sidearea'), // 區塊物件
			},
			{
				selector: $('#anotherarea'),
			}
			...
		]
	}
});
*/


;
(function($, window, document, undefined) {

	var body = $('body');


	// tool.isIE(8, 'lte')
	var isIE = function(version, comparison) {
	    var div = $('<div style="display:none;"/>').appendTo(body);
	    div.html('<!--[if ' + (comparison || '') + ' IE ' + (version || '') + ']><a>&nbsp;</a><![endif]-->');
	    var ieTest = div.find('a').length;
	    div.remove();

	    return ieTest;
	};

	var imageTypeValidateHash = {
		'jpg': 'image\/jpe?g',
		'jpeg': 'image\/jpe?g',
		'png': 'image\/png',
		'bmp': 'image\/bmp',
		'gif': 'image\/gif',
		'tiff': 'image\/tiff'
	};
	var sizeTypeHash = {
		'kb': 1024,
		'init': function() {
			this.mb = this.kb * this.kb;
			return this;
		}
	}.init();
	var _defaultSettings = {
		selector: null,
		previewer: null,
		fileSize: '2mb', // 可用 'kb', 'mb', 0代表不驗證
		imgSize: {
			width: 0, // 可下 '>, <, >=, <= 符號, 若沒下任何符號代表 ==, 0代表不驗證'
			height: 0 // 可下 '>. <, >=, <= 符號, 若沒下任何符號代表 ==, 0代表不驗證'
		},
		imgType: [], // 可復合判斷 jpg, jpeg, png, bmp, gif, tiff等圖片檔案格式
		validateCallback: null, // 驗證失敗時呼叫
		startPreviewCallback: null, // 照片開始丟到previwer時呼叫
	};


	$.fn.hiiirImageuploadPreviewer = function(settings) {

		var that = this;
		var settings  = $.extend({}, _defaultSettings, settings, {
			selector: that.length > 0 ? $(that[0]) : undefined
		});
		
		var init = function() {


			/*
				1. 初始化selector
				2. 初始化previewer
				3. 解析fileSize
				4. 解析imgSize
				5. 初始化type
			*/
			var initSettings = (function() {

				var getSelector = function(selector) {

					var isInputFile = selector ? selector.is('input[type="file"]') : false;

					if (!selector || !isInputFile) {
						selector = null;
					}
					return selector;
				};

				var getPreviewer = function(previewer) {

					if (previewer && previewer.length > 0) {
						previewer = $(previewer[0]);

						if (!previewer.is('img')) {
							previewer = null;
						}
					}
					return previewer;
				};

				// parse fileSize string
				var parseFileSizeStr = function(fileSizeStr) {

				
					var numbersRegex = /\d+/;
					var sizeRegex = /mb|kb/i;
					var size = +fileSizeStr.match(numbersRegex) || 0;
					var sizeType = fileSizeStr.match(sizeRegex);
					sizeType = $.isArray(sizeType) ? sizeType[0].toLowerCase() : 'kb';

					return {
						originStr: fileSizeStr,
						sizeType: sizeType,
						size: size * sizeTypeHash[sizeType]
					};
				};

				// parse imgSize Object
				var parseImgSizeObj = function(imgSizeObj) {

					var numbersRegex = /\d+/;
					var conditionsRegex = /\>\=|\<\=|\>|\</i;
					var output = {
						width: {
							value: 0,
							condition: ''
						},
						height: {
							value: 0,
							condition: ''
						}
					}
					for (var prop in imgSizeObj) {

						output[prop].value = +imgSizeObj[prop].toString().match(numbersRegex);
						output[prop].condition = imgSizeObj[prop].toString().match(conditionsRegex);
						output[prop].condition = $.isArray(output[prop].condition) ? output[prop].condition[0] : '==';
					}
					return output;
				};

				// check imgType is an array & convert imgType to regular expression
				var getImgTypeAry = function(imgTypeAry) {

					var regexBeginForFileName = '(\.|\/)(';
					var regexBeginForFileType = '^(?:';
					var regexEnd = ')$';
					var lastIndex = 0;
		
					if ($.isArray(imgTypeAry) && imgTypeAry.length > 0) {

						lastIndex = imgTypeAry.length - 1;

						$.each(imgTypeAry, function(index, value) {

							regexBeginForFileName += value;
							regexBeginForFileType += imageTypeValidateHash[value];

							if (index < lastIndex) {
								regexBeginForFileName += '|';
								regexBeginForFileType += '|';
							}
						});
					}
					else {
						lastIndex = Object.keys(imageTypeValidateHash).length - 1;

						var count = 0;

						$.each(imageTypeValidateHash, function(index) {

							regexBeginForFileName += index;
							regexBeginForFileType += imageTypeValidateHash[index];

							if (count < lastIndex) {
								regexBeginForFileName += '|';
								regexBeginForFileType += '|';
							}
							count++;
						});
					}
					return {
						'fileName': new RegExp(regexBeginForFileName + regexEnd, 'i'),
						'fileType': new RegExp(regexBeginForFileType + regexEnd, 'i')
					};
				};

				var selector = getSelector(settings.selector);
				var previewer = getPreviewer(settings.previewer);
				var fileSize = parseFileSizeStr(settings.fileSize);
				var imgSize = parseImgSizeObj(settings.imgSize);
				var imgType = getImgTypeAry(settings.imgType);

				return {
					'selector': selector,
					'previewer': previewer,
					'fileSize': fileSize,
					'imgSize': imgSize,
					'imgTypeRegex': imgType
				};

			})();

			/*
				初始化每次的更換圖片時要做的邏輯, 這邊會判斷如果是IE8(該死的IE8!), 就用IE自己的大便,
				其他瀏覽器就直接使用html5的filereader來抓取檔案資訊

				邏輯順序:
				1. 判斷是否可用fileReader
				2. 根據使用者所設定的驗證條件, 判斷圖片是否符合驗證, 不符合就呼叫validateCallback(),
				3. 如果符合條件, 就將圖片丟到previewer上顯示, 如果previewer不存在或是不是img tag就不做任何事
			*/

			/*
				TODO: 多檔案處理, 目前只會處理單個檔案或檔案列表第一個檔案

			*/
			var initChangeEvent = function(initSettings) {

				var isIE8Lte = isIE(8, 'lte');
				var selector = initSettings.selector;
				var files = null;
				var fileReaderForGetSize = new window.FileReader();

				var getImgSize = function(file, callback) {

					fileReaderForGetSize.onload = function(e) {

						var img = new Image();
						var imgBinary = e.target.result
						
						img.onload = function(e) {

							if (typeof callback == 'function') {
								callback(this.width, this.height, imgBinary);
							}
						};
						img.src = imgBinary;
					};
					fileReaderForGetSize.readAsDataURL(file);
				};
				var validate = function(file, width, height) {

					var fileName = file.name;
					var fileSize = file.size;
					var fileType = file.type;
					var width = width;
					var height = height;
					var imgSizeConditionHash = {
						'>': function(a, b) {
							return a > b;
						},
						'<': function(a, b) {
							return a < b;
						},
						'<=': function(a, b) {
							return a <= b;
						},
						'>=': function(a, b) {
							return a >= b;
						},
						'==': function(a, b) {
							return a == b;
						}
					};
					var validDetail = {
						fileSize: false,
						fileType: false,
						imgSize: false
					};


					// 驗證檔案大小
					if (initSettings.fileSize.size > fileSize) {
						validDetail.fileSize = true;
					}

					// 驗證檔案類型, 如果有檔案類型優先驗證, 如果沒有則判斷檔案副檔名
					if (!fileType) {

						if (initSettings.imgTypeRegex.fileType.test(fileType)) {
							validDetail.fileType = true;
						}
					}
					else {

						if (initSettings.imgTypeRegex.fileName.test(fileName)) {
							validDetail.fileType = true;
						}	
					}

					// 驗證圖片長寬大小
					var validWidth = initSettings.imgSize.width.value;
					var validWidthCondi = initSettings.imgSize.width.condition;
					var validHeight = initSettings.imgSize.height.value; 
					var validHeightCondi = initSettings.imgSize.height.condition; 
					var isValidWidth = true;
					var isValidHeight = true;

					if (validWidth > 0) {
						isValidWidth = imgSizeConditionHash[validWidthCondi](width, validWidth);
					}
					if (validHeight > 0) {
						isValidHeight = imgSizeConditionHash[validHeightCondi](height, validHeight);
					}

					/*
					console.log(validWidthCondi);
					console.log(validHeightCondi);
					console.log(width);
					console.log(height);
					console.log(validWidth);
					console.log(validHeight);
					console.log(isValidWidth);
					console.log(isValidHeight);
					*/

					if (isValidWidth && isValidHeight) {
						validDetail.imgSize = true;
					}

					var validateResult = {
						filename: fileName,
						fileSize: fileSize || null,
						fileSizeReading: fileSize ? (fileSize / sizeTypeHash[initSettings.fileSize.sizeType]).toFixed(2) + ' ' + initSettings.fileSize.sizeType : null,
						validDetail: validDetail,
						checkValid: function() {

							this.isValid = false;

							if (validDetail.fileSize && validDetail.fileType && validDetail.imgSize) {
								this.isValid = true;
							}
							return this;
						}
					}.checkValid();

					return validateResult;
				};


				// 如果selector存在, 才綁定change事件
				if (selector) {

					selector.on('change', function() {
						
						var that = this;
						var files = null;

						var processorHash = {
							'html5': function() {

								var fileReaderForGetSize = new window.FileReader();
						
								files = that.files;

								if (files.length > 0) {

									var file = files[0];
									var isValidObj = null;

									// 取得圖片寬高後, 進行圖檔驗證
									getImgSize(file, function(width, height, imgBinary) {

										validObj = validate(file, width, height);
			
										// 驗證通過，顯示圖片在previewer, 不通過則拋出validateCallback
										if (validObj.isValid && settings.previewer) {
											settings.previewer.attr('src', imgBinary);
										}
										else {
											if (typeof settings.validateCallback == 'function') {
												settings.validateCallback(validObj);
											}
										}
									});
								}
							},
							'ie8': function() {

								var objPreviewFake = document.getElementById( 'preview_fake' );
								that.select();
								var imgSrc = document.selection.createRange().text;

								objPreviewFake.filters.item(
								'DXImageTransform.Microsoft.AlphaImageLoader').src = imgSrc;

								/*
								var sh = setInterval(
									function(){
									var img = document.createElement("img");
									img.src = imgSrc;
									fileSize = img.fileSize;
									console.log(fileSize);
									if (fileSize > 0){ checkFileSize(sender,fileSize);clearInterval(sh);}
									img = null;
									}
								,100);
						*/
							}
						}


						// 
						if (window.FileReader) {
							processorHash['html5']();
						}
						else if (isIE8Lte) { // ie8無法多檔案上傳


						}
					});
				}
			};
			initChangeEvent(initSettings);
		}
		init();
		
	};

})(jQuery, window, document);