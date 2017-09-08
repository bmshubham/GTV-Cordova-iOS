        var table_name = "user_details";
        var baseUrl = 'https://www.gazebotv.com/public/api/';
        var storage = window.localStorage;
        var api_token = '';
        var vhx_id = '';
        var db;
        document.addEventListener('deviceready', checkLogin);
        document.addEventListener('deviceready', listenBackEvent, false);



        function checkLogin() {

            if(storage.getItem('api_token') != '' && storage.getItem('api_token') != undefined && storage.getItem('api_token') != null) {
                getMyProducts();
            } else {
                $('#login').css('display', 'block');
                openDatabase(db);
            }
        }

        function openDatabase(db) {
            db = window.sqlitePlugin.openDatabase(
                {name: 'gazeboDB.db', location: 'default'},
                function(db) {createUserDetailTable(db)},
                function(error) {}
            );
        }

        function createUserDetailTable(db) {
            db.transaction(
                function(tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS user_detail (email TEXT UNIQUE NOT NULL, api_token TEXT UNIQUE, vhx_id TEXT NOT NULL)');
                }, 
                function(error) {}, 
                function() {return;}
            );
        }

        function validateLogin() {
                var email = $('#email').val();
                var password = $('#password').val();
                var error = '';
                var error1 = '';
                x=1;
                if (email == "" ) {
                    x = 0;
                    error = "All Fields Required";
                    $('.username').addClass("has-error");
                } else if (!(/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email))){
                    x = 0;
                    error1 = "Please Correct Required Fields";
                    $('.username').addClass("has-error");
                } else {
                    $('.username').removeClass("has-error");
                }

                if (password == "" ) {
                    x = 0;
                    error = "All Fields Required";
                    $('.password').addClass("has-error");
                } else {
                    $('.password').removeClass("has-error");
                }

                if (x) {
                    $('.resp2').append("Please wait...");
                    return true;
                } else {
                    if(error != ""){
                        document.getElementById("form-errors").innerHTML = error;
                        $('#form-errors').css('color', 'red');
                        error = "";
                        }
                    if( error1 != ""){
                        document.getElementById("form-errors1").innerHTML =  error1;
                        $('#form-errors1').css('color', 'red');
                        error1 = "";
                    }
                    return false;
                }// return true;
        }

        function login() {
            if(validateLogin()) {
                $.ajax({
                    type: 'POST',
                    url: baseUrl + 'login',
                    data: 'email='+$('#email').val()+'&password='+$('#password').val(),
                    context: this,
                    success: function(data, textStatus, xhr) {
                        getUserDetails(data.api_token);
                    },
                    error: function(xhr, textStatus) {
                        $('#loader').removeClass('loader-show');
                        $('#form-errors').text('Invalid Email or Password')
                        $('#form-errors').css('color', 'red');
                    },
                    beforeSend: function() {
                        $('#loader').addClass('loader-show');
                    }
                });
            }
            return false;
        }

        function getUserDetails(api_token) {
            $.ajax({
                type: 'GET',
                url: baseUrl + 'user_details',
                data: 'api_token='+api_token,
                context: this,
                success: function(data, textStatus, xhr) {
                    var user = data.user;
                    if(user) saveUserDetails(user);
                    else {
                        $('#loader').removeClass('loader-show');
                        $('#form-errors').text('Not found any product video!')
                        $('#form-errors').css('color', 'red');
                    }
                },
                error: function(xhr, textStatus) {},
                beforeSend: function() {
                    $('#loader').addClass('loader-show');
                }
            });
        }

        function saveUserDetails(user) {
            var values = [user.email, user.api_token, user.vhx_id];
            db = window.sqlitePlugin.openDatabase({name: 'gazeboDB.db', location: 'default'});
            db.transaction(
                function(tx) {
                    var query = 'INSERT INTO user_detail (email, api_token, vhx_id) VALUES (?,?,?)';
                    tx.executeSql(query, values, function(tx, rs) {});
                    storage.setItem('api_token', user.api_token);
                    storage.setItem('vhx_id', user.vhx_id);
                    getMyProducts();
                },
                function(error) {},
                function() {
                }
            );
        }

        function getMyProducts() {
            api_token = storage.getItem('api_token');
            $.ajax({
                type: 'GET',
                url: baseUrl + 'my_products',
                data: 'api_token='+api_token+'&vhx_id='+storage.getItem('vhx_id'),
                context: this,
                success: function(data, textStatus, xhr) {
                    window.location.href = 'index.html#home';
                    $('#my-products').empty();
                    $.each(data.products, function(key, value) {
                        renderProduct(value);
                    });
                    $('#loader').removeClass('loader-show');
                },
                error: function(xhr, textStatus) {},
                beforeSend: function() {
                    $('#login').css('display', 'none');
                    $('#loader').addClass('loader-show');
                }
            });
        }

        function renderProduct(product) {
            $('#my-products').append(
                '<div class="session-type">' +
                    '<a data-transition="fade" data-rel="sessions" onclick="getMyProductVideos('+product.id+', \''+product.name+'\')">' +
                        '<div class="img-gallery">' +
                            '<img src="'+product.thumbnail.medium+'">' +
                        '</div>' +
                        '<h2>'+product.name+'</h2>' +
                    '</a>' +
                '</div>'
            );
        }

        function getMyProductVideos(product_id, product_name) {
            api_token = storage.getItem('api_token');
            $.ajax({
                type: 'GET',
                url: baseUrl + 'product_videos',
                data: 'api_token='+api_token+'&product_id='+product_id,
                context: this,
                success: function(data, textStatus, xhr) {
                    $('#my-videos').empty();
                    $('#product-title').text(product_name);
                    $.each(data.videos, function(key, value) {
                        renderVideo(value);
                    });
                    window.location.href = 'index.html#sessions';
                    $('#loader').removeClass('loader-show');
                },
                error: function(xhr, textStatus) {},
                beforeSend: function() {
                    $('#loader').addClass('loader-show');
                }
            });
        }

        function renderVideo(video) {
            $('#my-videos').append(
                '<div class="session-type">' +
                    '<a data-transition="fade" data-rel="sessions" onclick="getMyVideoDetails('+video.id+', \''+video.name+'\')">' +
                        '<div class="img-gallery">' +
                            '<img src="'+video.thumbnail.medium+'">' +
                        '</div>' +
                        '<h2>'+video.name+'</h2>' +
                    '</a>' +                      
                '</div>'
            );
        }

        function getMyVideoDetails(video_id, video_name) {
            api_token = storage.getItem('api_token');
            vhx_id = storage.getItem('vhx_id');
            $.ajax({
                type: 'GET',
                url: baseUrl + 'video_details',
                data: 'api_token='+api_token+'&video_id='+video_id+'&vhx_id='+vhx_id,
                context: this,
                success: function(data, textStatus, xhr) {
                    var video = data.video;
                    $('#video-title').text(video_name);
                    videoDownload(api_token, video_id);
                    videoDetail(video);
                    window.location.href = 'index.html#videodetail';
                    $('#loader').removeClass('loader-show');
                },
                error: function(xhr, textStatus) {},
                beforeSend: function() {
                    $('#loader').addClass('loader-show');
                }
            });
        }

        function videoDownload(api_token, video_id) {
            $.ajax({
                type: 'GET',
                url: baseUrl + 'video_download',
                data: 'api_token='+api_token+'&video_id='+video_id,
                context: this,
                success: function(data, textStatus, xhr) {
                    var files = data.files;
                    // console.log(files); 
                    $.each(data.files, function(key, value) {
                        videoDownloadDetails(value);
                    });                  
                },
                error: function(xhr, textStatus) {},
                beforeSend: function() {                    
                }
            });
        }

        function videoDownloadDetails(files) {
            if (files.quality != "adaptive"){
                var fileURL = files._links.source.href;
                $('#video-download').append(
                    '<li><a href="'+fileURL+'" download target="_blank">'+files.quality+' &nbsp; <span>. &nbsp; '+files.size.formatted+'</span></a></li>'
                );
            }
        }

        function videoDetail(video) {
            console.log(video.player.host+video.player.path);
        	var videoDetail =
                '<div class="session-type">' +
                    '<div class="img-gallery">' +
                        //'<iframe width="200" height="200" src="https://www.youtube.com/embed/GP_dyQGENCI?ecver=1" frameborder="0" allowfullscreen></iframe>' +
                        '<iframe width="100%" height="360" src="'+video.player.host+video.player.path+'?authorization='+video.token+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowfullscreen></iframe>' +
                    '</div>' +
                    '<h2>'+video._embedded.video.title+'</h2>';
            if(video._embedded.video.descrption) videoDetail += '<p>'+video._embedded.video.descrption+'</p>';
            videoDetail += '</div>';
            $('#video-detail').html(videoDetail);
        }

        function logout() {
            storage.removeItem('vhx_id');
            storage.removeItem('api_token');
            db = window.sqlitePlugin.openDatabase({name: 'gazeboDB.db', location: 'default'});
            db.transaction(
                function(tx) {
                    tx.executeSql('DELETE FROM user_detail');
                },
                function(error) {},
                function() {
                }
            );
            window.location.href = 'index.html';
        }

        function listenBackEvent() {
            document.addEventListener("backbutton", function(e){   
                $('#video-detail').empty();
                if($('.ui-page-active').attr('id') == 'home') navigator.app.exitApp();
                else history.back();
            });
        }

        function showQuality() {
            $(".video-button").css('display', 'block');
        }

        function hideQuality() {
            $(".video-button").css('display', 'none');
        }

        function getDevices() {
            console.log(cordova.plugins.chromecastios);
            cordova.plugins.chromecastios.getDefaultReceiverApplicationID().then(function(response){
                var defaultAppId = response;
                console.log(defaultAppId);
                scanDevices(defaultAppId);
                //do something  
            });
            
        }

        function scanDevices(receiverAppId) {
            cordova.plugins.chromecastios.scanForDevices(receiverAppId).then(function(response){
                var scanDevices = response;
                console.log(scanDevices);
                selectDevices();
                //successfully started scanning for devices
                //response is simply a string value "started";
            }).catch(function(error){
                //failed to start scanningˀ for devices
                //see error for details
            });

        }

        function selectDevices() {
            //Get the list of available devices
            var devices = cordova.plugins.chromecastios.devices;
            console.log(devices);
            //select the device you want from the list and use the device object as the input param for select
            cordova.plugins.chromecastios.selectDevice(devices[0]).then(function(response){
                console.log(response);
                //successfully selected device
                //returns an object with the selected device details
            }).catch(function(error){
                //an error occurred selecting the device
                //returns an error code
            });
            cordova.plugins.chromecastios.passiveScanForDevices(bool).then(function(reponse){
                console.log(response);
                //successfully enabled passive scanning mode
                //returns a boolean value representing the native frameworks current passive
                //scanning state
            }).catch(function(error){
                //an error occurred with the request
            });
        }
