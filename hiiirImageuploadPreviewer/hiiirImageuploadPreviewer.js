/*
hiiirImageuploadPreviewer.js
=========================================================
Copyright 2014 Hiiir 台灣時間軸科技股份有限公司
建立者: Hank Kuo
建立時間: 2014-04-11

jquery版本支援: 1.4.1 up
瀏覽器支援測試: chrome, firefox, safari, ie8

套件描述: 可以對單張圖片上傳進行及時預覽，並且可以針對圖片檔案大小，尺寸與檔案類型設定驗證條件
 */


/*
更新記錄:

日期: 2014-04-11
更新描述: 建立元件
版本: 1.0
更新人: Hank Kuo

日期: 2014-04-23
更新描述: 修正html5部分預覽圖片出現"defaultPreviewerWidth not defined"的錯誤
		 修正驗證功能在驗證圖片成功後，驗證其他類型檔案時驗證失效
		 增加validMsg物件，裡面有簡單與詳細的驗證訊息，方便直接顯示不需要自己再花時間組合驗證訊息
		 增加驗證圖片寬高比
版本: 1.01
更新人: Hank Kuo

日期: 2014-04-28
更新描述: 增加defaultImg參數，可設定若驗證失敗，要顯示的預設圖，若無設定則顯示上一次成功上傳的預覽圖
版本: 1.02
更新人: Hank Kuo

日期: 2014-05-02
更新描述: 增加successCallback, 當照片通過驗證時呼叫
版本: 1.03
更新人: Hank Kuo

日期: 2014-05-08
更新描述: 修正判斷successCallback存在並且為function才呼叫
版本: 1.04
更新人: Hank Kuo
*/


/*
使用說明:

$('#imageUploader').hiiirImageuploadPreviewer({ // input file selector, input file位置
    previewer: $('#imagePreviewer'),	// img tag selector, 要預覽的img tag位置
    fileSize: '3000kb',	// mb, kb, ex: '150kb', '2mb'
    imgSize: { 
        width: '<1500', // 圖片寬度: 可用 '>', '<', '>=', '<=', '==', 如果不寫則不驗證
        height: '<3000' // 圖片高度: 可用 '>', '<', '>=', '<=', '==', 如果不寫則不驗證
    },
    imgSizeEqualScale: false, // 是否要驗證圖片寬高比
    imgType: ['png', 'jpg'], // 圖片類型: 目前只開放 jpg, png, bmp, gif, tiff等格式, 如果不寫則判斷全部內建格式
    validateCallback: function(validObj) { // 驗證錯誤callback function
        // dosomething for validations
        // ex. alert('your image is too big!!')
    },
   	defaultImg: { // 設定若驗證失敗，要顯示的預設圖，若無設定則顯示上一次成功上傳的預覽圖
        url: 'images/1px.png',
        width: '100',
        height: '200'
    },
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
			height: 0, // 可下 '>. <, >=, <= 符號, 若沒下任何符號代表 ==, 0代表不驗證'
		},
		imgSizeEqualScale: false, // 如果是true, 就要檢查圖片比例跟設定的圖片比例是否相同, 精度小數點後2位
		imgType: [], // 可復合判斷 jpg, jpeg, png, bmp, gif, tiff等圖片檔案格式
		successCallback: null, // 驗證成功時呼叫
		validateCallback: null, // 驗證失敗時呼叫
		startPreviewCallback: null, // 照片開始丟到previwer時呼叫
		defaultImg: '' // 如果沒照片時, 要顯示的預設圖
	};
	var classNameHash = {
		'ie8Preview': 'hiiirImageuploadPreviewer-ie8-preview',
		'ie8Size': 'hiiirImageuploadPreviewer-ie8-size'
	};


	$.fn.hiiirImageuploadPreviewer = function(settings) {

		var that = this;
		var browser = isIE(8, 'lte') ? 'ie8' : 'html5';
		var settings  = $.extend({}, _defaultSettings, settings, {
			selector: that.length > 0 ? $(that[0]) : undefined
		});
		
		var init = function(browser) {


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
						else {

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
					var fileTypeStr = '';
					var regexEnd = ')$';
					var lastIndex = 0;
		
					if ($.isArray(imgTypeAry) && imgTypeAry.length > 0) {

						lastIndex = imgTypeAry.length - 1;

						$.each(imgTypeAry, function(index, value) {


							fileTypeStr += value;
							regexBeginForFileName += value;
							regexBeginForFileType += imageTypeValidateHash[value];

							if (index < lastIndex) {
								fileTypeStr += ', ';
								regexBeginForFileName += '|';
								regexBeginForFileType += '|';
							}
						});
					}
					else {
						lastIndex = Object.keys(imageTypeValidateHash).length - 1;

						var count = 0;

						$.each(imageTypeValidateHash, function(index) {

							fileTypeStr += index;
							regexBeginForFileName += index;
							regexBeginForFileType += imageTypeValidateHash[index];

							if (count < lastIndex) {
								fileTypeStr += ', ';
								regexBeginForFileName += '|';
								regexBeginForFileType += '|';
							}
							count++;
						});
					}
					return {
						'fileTypeStr': fileTypeStr,
						'fileName': new RegExp(regexBeginForFileName + regexEnd, 'i'),
						'fileType': new RegExp(regexBeginForFileType + regexEnd, 'i'),
						'fileTypeAry': imgTypeAry
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
					'imgSizeEqualScale': settings.imgSizeEqualScale,
					'imgTypeRegex': imgType,
					'getImgTypeAry': getImgTypeAry,
					'getPreviewer': getPreviewer,
					'browser': browser
				};

			})();


			// 如果DOM要作處理, 在這邊控制
			var initDomHash = {

				'html5': function() {
					
				},
				'ie8': function() {

					var previewerWrap = null;
					var imgForSize = null;
					var previewer = initSettings.getPreviewer(settings.previewer);
					var previewerWidth = 0;
					var previewerHeight = 0;
					var hasPreviewWrap = false;
					var hasImgForSize = false;

					if (previewer) {

						previewerWidth = previewer.attr('width');
						previewerHeight = previewer.attr('height');

						hasPreviewWrap = previewer.parent('.' + classNameHash.ie8Preview).length;
						hasImgForSize = $(document).find('.' + classNameHash.ie8Size).length;

						// 如果沒有PreviewWrap, 加入一個, 並設定寬高
						if (!hasPreviewWrap) {
							previewerWrap = $(document.createElement('div')).addClass(classNameHash.ie8Preview);
							previewerWrap.css({'width': previewerWidth});
							previewerWrap.css({'height': previewerHeight});
							previewer.wrap(previewerWrap);
						} 

						if (!hasImgForSize) {
							imgForSize = $(document.createElement('img')).addClass(classNameHash.ie8Size);
							imgForSize.appendTo('body');
						}
					}

				}
			};
			initDomHash[browser]();






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

			// 將驗證結果整理後輸出
			var validResultOutputer = function(fileHash) {


				var fileName = fileHash.fileName;
				var fileExtension = fileHash.fileExtension;
				var fileSize = fileHash.fileSize || null;
				var fileSizeReading = fileSize ? (fileSize / sizeTypeHash[initSettings.fileSize.sizeType]).toFixed(2) + ' ' + initSettings.fileSize.sizeType : null;
				var imgEqualScaleData = fileHash.imgEqualScaleData;
				var width = fileHash.width;
				var height = fileHash.height;
				var isValid = true;
				var validMsgShort = {
					'fileSize': '',
					'fileType': '',
					'imgSize': '',
					'imgEqualScale': ''
				};
				var validMsgDetail = {
					'fileSize': '',
					'fileType': '',
					'imgSize': '',
					'imgEqualScale': ''
				};
				var validMsgShortForShow = '';
				var validMsgDetailForShow = '';

				if (fileSize && !validDetail.fileSize) {
					isValid = false;
					validMsgShort.fileSize = '上傳圖片檔案大小不符合設定';
					validMsgDetail.fileSize = '上傳圖片檔案大小不符合設定，上傳圖片檔案大小為： ' + fileSizeReading;
					validMsgDetail.fileSize += '，設定的圖片檔案大小限制為： ' + initSettings.fileSize.originStr;

					validMsgShortForShow += validMsgShort.fileSize + '<br>';
					validMsgDetailForShow += validMsgDetail.fileSize + '<br>';
				}

				if (!validDetail.fileType) {
					isValid = false;
					validMsgShort.fileType = '上傳圖片檔案類型不符合設定';
					validMsgDetail.fileType = '上傳圖片檔案類型不符合設定，上傳圖片檔案類型為： ' + fileExtension;
					validMsgDetail.fileType += '，設定的圖片檔案類型為： ' + initSettings.imgTypeRegex.fileTypeStr;

					validMsgShortForShow += validMsgShort.fileType + '<br>';
					validMsgDetailForShow += validMsgDetail.fileType + '<br>';
				}

				if (width && height && !validDetail.imgSize) {
					isValid = false;
					validMsgShort.imgSize = '上傳圖片尺寸不符合設定';
					validMsgDetail.imgSize = '上傳圖片尺寸不符合設定，上傳圖片寬度： ' + width + '，高度為： ' + height + '，設定的圖片寬度限制為： ';
					validMsgDetail.imgSize += initSettings.imgSize.width.condition + ' ' + initSettings.imgSize.width.value;
					validMsgDetail.imgSize += '，設定的圖片寬度限制為： ' + initSettings.imgSize.height.condition + ' ' + initSettings.imgSize.height.value;
					
					validMsgShortForShow += validMsgShort.imgSize + '<br>';
					validMsgDetailForShow += validMsgDetail.imgSize + '<br>';
				}

				if (!validDetail.imgEqualScale) {
					isValid = false;
					validMsgShort.imgEqualScale = '上傳圖片尺寸比例不符合設定';
					validMsgDetail.imgEqualScale = '上傳圖片尺寸比例不符合設定，上傳圖片比例： ' + imgEqualScaleData.scale;
					validMsgDetail.imgEqualScale += '，設定的圖片比例為： ' + imgEqualScaleData.validScale;

					validMsgShortForShow += validMsgShort.imgEqualScale + '<br>';
					validMsgDetailForShow += validMsgDetail.imgEqualScale + '<br>';
				}
				
				return {
					'fileName': fileName,
					'fileSize': fileSize,
					'fileSizeReading': fileSizeReading,
					'width': width,
					'height': height,
					'imgEqualScaleData': imgEqualScaleData,
					'isValid': isValid,
					'validDetail': validDetail,
					'validMsg': {
						'validMsgShort': validMsgShort,
						'validMsgDetail': validMsgDetail,
						'validMsgShortForShow': validMsgShortForShow,
						'validMsgDetailForShow': validMsgDetailForShow
					},
					'settings': {
						'fileSize': initSettings.fileSize,
						'imgSize': initSettings.imgSize,
						'fileType': initSettings.imgTypeRegex.fileTypeAry,
					}
				};
			};

			// 驗證圖片尺寸是否合乎使用者的設定
			var validImgSize = function(width, height) {

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
				return isValidWidth && isValidHeight;
			};

			// 驗證圖片尺寸比例是否與設定相符
			var validImgScale = function(width, height) {

				var validWidth = initSettings.imgSize.width.value;
				var validHeight = initSettings.imgSize.height.value; 
				var validScale = (validWidth / validHeight).toFixed(2);
				var scale = (width / height).toFixed(2);

				return {
					'imgEqualScale': validScale == scale,
					'validScale': validScale,
					'scale': scale
				};
			};

			var getFileExtension = function(fileName) {
				return fileName.substr((~-fileName.lastIndexOf('.') >>> 0) + 2);
			};


			var validateHash = {

				'html5': (function() {

					return {

						getImgSize: function(file, callback) {

							var imgAllRegex = initSettings.getImgTypeAry();

							// 檢查檔案類型是否為設定的所有圖檔類型, 如果不是就不走preview圖片這段
							// TODO: 以後是否可以做判斷其他檔案類型? 
							if (!imgAllRegex.fileType.test(file.type)) {
								callback(false, false, false);
							}
							else {

								var fileReaderForGetSize = new window.FileReader();
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
							}
						},
						validate: function(file, width, height) {


							var fileName = file.name;
							var fileExtension = getFileExtension(fileName);
							var fileSize = file.size;
							var fileType = file.type;
							var width = width;
							var height = height;
							var imgEqualScaleData = null;

							// reset validDetail
							validDetail = {
								fileSize: false,
								fileType: false,
								imgSize: false,
								imgEqualScale: true
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
				
							validDetail.imgSize = validImgSize(width, height);


							if (initSettings.imgSizeEqualScale) {

								imgEqualScaleData = validImgScale(width, height);
								validDetail.imgEqualScale = imgEqualScaleData.imgEqualScale;
							}
						
							var data = {
								fileType: fileType,
								fileName: fileName,
								fileExtension: fileExtension,
								fileSize: fileSize || null,
								imgEqualScaleData: imgEqualScaleData,
								width: width,
								height: height
							};
							return validResultOutputer(data);
						}
					};
				
				})(),
				'ie8': (function() {

					return {

						getImgSize: function(file, callback) {

							var imgSrc = '';
							var imgForSize =  $('body').find('.' + classNameHash.ie8Size);

							file.select();
							imgSrc = document.selection.createRange().text;

							// 如果圖檔太大會直接壞掉..拿約11mb的圖就失敗了							
							if (imgForSize.length) {
								
								try {
									imgForSize[0].filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = imgSrc;

									setTimeout(function() {

										if (typeof callback == 'function') {
											callback(imgForSize[0].offsetWidth, imgForSize[0].offsetHeight, imgSrc);
										}
									}, 100);
								}
								catch(error) {

									switch (error.name) {

										case 'Error':
											alert('檔案為非圖片類型，請重新選擇圖片')
											break;
										
										case 'TypeError':
											alert('圖片檔案過大，無法偵測圖片尺寸與預覽!');
											break;
									}
								}
							}
						},
						validate: function(fileName, width, height) {

							var fileName = fileName;
							var fileExtension = getFileExtension(fileName);
							var width = width;
							var height = height;
							var imgEqualScaleData = null;

							validDetail = {
								fileSize: false,
								fileType: false,
								imgSize: false,
								imgEqualScale: true
							};

							if (initSettings.imgTypeRegex.fileName.test(fileName)) {
								validDetail.fileType = true;
							}	

							validDetail.imgSize = validImgSize(width, height);

							if (initSettings.imgSizeEqualScale) {

								imgEqualScaleData = validImgScale(width, height);
								validDetail.imgEqualScale = imgEqualScaleData.imgEqualScale;
							}

							var data = {
								fileName: fileName,
								fileExtension: fileExtension,
								imgEqualScaleData: imgEqualScaleData,
								width: width,
								height: height
							};
							return validResultOutputer(data);
						}
					};
				})()
			}


			var initChangeEvent = function(initSettings) {
				
				var selector = initSettings.selector;
				var isIE8Lte = isIE(8, 'lte');
				var processor = null;
				var previewer = initSettings.getPreviewer(settings.previewer);
				var defaultImg = settings.defaultImg;

			

				var failRefresh = function(input, previewerWrap) {

					var defaultPreviewerImageUrl = '';
					var defaultPreviewerWidth = 0;
					var defaultPreviewerHeight = 0;

					if (previewer) {

						defaultPreviewerImageUrl = previewer.attr('src');
						defaultPreviewerWidth = previewer.css('width');
						defaultPreviewerHeight = previewer.css('height');
	
    					$(input).wrap('<form>').closest('form').get(0).reset();
    					$(input).unwrap();

    					if (defaultImg.url) {
    						defaultPreviewerImageUrl = defaultImg.url;
    						defaultPreviewerWidth = defaultImg.width;
    						defaultPreviewerHeight = defaultImg.height;
    					}
						

						// 	IE8用
						if (previewerWrap) {
							
							previewerWrap.css({
								'width': defaultPreviewerWidth,
								'height': defaultPreviewerHeight
							});

							if (defaultPreviewerImageUrl && defaultPreviewerWidth != '28px' && defaultPreviewerHeight != '30px') {
								previewerWrap[0].filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = defaultPreviewerImageUrl;
							}
							else {
								previewerWrap.css({
									'filter': ''
								});
							}

						}
						else {

							// 如果有攝定defaultImg, 就要顯示
							if (defaultImg.url) {

								defaultImg.width =  defaultImg.width || 1;
								defaultImg.height =  defaultImg.height || 1;

								previewer.attr('src', defaultImg.url);
								previewer.css({
									'width': defaultImg.width + 'px',
									'height': defaultImg.height + 'px'
								});
							}
							else {
								previewer.attr('src', defaultPreviewerImageUrl);
							}
							previewer.css({'visibility': 'visible'});
							
						}
					}
				};
				var processorHash = {

					'html5': function(validateFunc) {
				
						return function(that) {

							var files = that.files;

							if (files.length > 0) {

								var file = files[0];
								var isValidObj = null;

								validateFunc.getImgSize(file, function(width, height, imgBinary) {

									validObj = validateFunc.validate(file, width, height);

									// 驗證通過，顯示圖片在previewer, 不通過則拋出validateCallback
									if (validObj.isValid && settings.previewer && width && height) {

										settings.previewer.attr('src', imgBinary);

										if (typeof settings.successCallback == 'function') {
											settings.successCallback();
										}
									}
									else if (!validObj.isValid) {
										if (typeof settings.validateCallback == 'function') {
											settings.validateCallback(validObj);
											failRefresh(that);
										}
									}
								});
							}
						};
					},
					'ie8': function(validateFunc) {


						var calculateImgSize = function(previewer, width, height) {

							var outputWidth = previewer.css('width').replace('px', '');
							var outputHeight = previewer.css('height').replace('px', '');
						
							// IE8沒有設定任何圖片大小時, 預設的寬高
							if (outputWidth == 28 && outputHeight == 30) {
								outputWidth = width;
								outputHeight = height;
							}
							else {
								outputHeight = height * (outputWidth / width);
							}

							return {
								width: outputWidth,
								height: outputHeight
							};
						};


						return function(that) {

							var previewer = initSettings.getPreviewer(settings.previewer);
							var previewerWrap = previewer ? previewer.parent('.' + classNameHash.ie8Preview) : null;
							var imgSrc = '';
							var fileName = $(that).val();

							if (fileName) {

								// 取得圖片寬高後, 進行圖檔驗證
								validateFunc.getImgSize(that, function(width, height, imgSrc) {

									validObj = validateFunc.validate(fileName, width, height);

									if (validObj.isValid && previewer) {

										// 計算圖片要顯示的寬高
										var size = calculateImgSize(previewer, width, height);

										previewerWrap.css({
											'width': size.width,
											'height': size.height,
											'filter': 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)'
										});
										previewerWrap[0].filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = imgSrc;
										previewer.css('visibility', 'hidden');

										if (typeof settings.successCallback == 'function') {
											settings.successCallback();
										}
									}
									else if (!validObj.isValid) {
										if (typeof settings.validateCallback == 'function') {
											settings.validateCallback(validObj);
											failRefresh(that, previewerWrap);
										}
									}
								});

							}
						};
					}
				};
				var getProcessor = function(type) {
					return processorHash[type](validateHash[type]);
				};

				processor = getProcessor(initSettings.browser);

				// 如果selector存在, 才綁定change事件
				if (selector) {
					selector.on('change', function() {
						processor(this);
					});
				}
			};
			initChangeEvent(initSettings);
		}
		init(browser);
	};

})(jQuery, window, document);