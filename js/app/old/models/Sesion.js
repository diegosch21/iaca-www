/*
* models/Sesion
* SINGLETON Model - Encargado de mantener info y estado de usuario logueado, y realizar request a sistema VIANET
*
* Guarda el usuario actual y se encarga de las operaciones que requieren credenciales de usuario:
* - login, relogin y logout
* - get de los resultados
*
* Viejo sistema seteaba data para notificaciones
*/
//* globals device */
define([
 	'jquery',
 	'underscore',
 	'backbone',
 	'localstorage',
 	'collections/Usuarios',
], function ($,_,Backbone,Store,Usuarios) {

    var sesionModel = Backbone.Model.extend({

        defaults:{
        	id: 'app', // unica sesión (este modelo es un singleton)
        	logueado: false,
        	userID: -1,
        	username: "",
        	token: "",
            timestamp: -1
        },

        /* URLs viejo sistema (VIANET)
            (la URL del web service SOAP de Shift se define y usa en services/shift_webservice.js) */
        urls: {
            // login: 'https://www.iaca.com.ar/ws.json!login!',
            // results: 'https://www.iaca.com.ar/ws.json!list-results!'

            /* Proxy local a VIANET (para desarrollo, por same-origin-policy) */
            // login: 'http://imotion.local/iaca/iaca-www/proxy/VIANET_login.php?',
            login: 'proxy/VIANET_login.php?',
            // login: 'proxy/login_18277932.json?',
            // results: 'http://imotion.local/iaca/iaca-www/proxy/VIANET_results.php?'
            results: 'proxy/VIANET_results.php?'
            // results: 'proxy/results_18277932_2.json?'
            // results: 'proxy/results_vacio.json?'
        },

        localStorage: new Store('iaca-shift-session'),

        initialize: function() {

            console.log("Initialize Sesion");
            _.bindAll(this,'login','relogin','getAuth','setUsuario','crearUsuario','logout','getResultados','checkTimestamp');
            // Bind con métodos deshabilitados
        	// _.bindAll(this,'setNotificar','setNotifID','enviarNotifID');

            var self = this;
            this.set("timestamp",new Date().getTime());

            // Chequeo si había sesión previa para hacer "relogin"
            if(localStorage.getItem('iaca-shift-session-app')) {
                // ToDo - nuevo sistema login
        		console.log("Init: Fetch sesion");
        		this.fetch({
                    success: function(){
                        if(self.get("logueado")) {
                            self.relogin({success: function() {
                                console.log("Relogin inicial - Redirecciono a home");
                                Backbone.history.navigate("",true);
                            }});
                        }
                    }
                });
        	}
        	else {
        		console.log("Init: Save sesion");
        		this.save();
        	}
        },

        login: function(user,pass,callback) {
        	var self = this;
        	this.getAuth(user,pass,{
        		success: function(data) {
                    console.log("Login OK");
        			self.setUsuario(user,pass,data);
        			if (callback && 'success' in callback) {
        				callback.success(data);
        			}
        		},
        		error: function(error,errorcode) {
        			console.log('Error: ' + error);
        			console.log("CantLogin");
                    if(errorcode == 1)
        			    self.logout();   // Si el error fue por user/pass invalid, desloguea
        			if (callback && 'error' in callback) {
        				callback.error(error);
        			}
        		},
        		complete: function() {
        			if (callback && 'complete' in callback) {
        				callback.complete();
        			}
        		}
        	});
        },

        relogin: function(callback) {
            console.log("Relogin");
            var userGuardado = Usuarios.get(this.get("userID"));
            if(userGuardado) {
                this.login(userGuardado.get("id"),userGuardado.get("pass"),callback);
            }
        },

        getAuth: function(user,pass,callback) {
        	$.ajax({
        		url: this.urls.login+"username="+user+"&password="+pass,
        		dataType: 'json',
        		type: 'GET'
        	}).done(function(data){
        		console.log(data);
        		if(data.result && data.name !== null) {
        			if (callback && 'success' in callback) {
        				callback.success(data);
        			}
        		}
        		else if (data.result && data.name===null) {
        			callback.error('Usuario inválido');
        		}
        		else {
        			if (callback && 'error' in callback) {
        				switch(data.errorcode) {
        					case 1:
        						callback.error('Usuario o clave inválidos',1);
        						break;
        					case -1:
        						callback.error('Ocurrió un error en la base de datos. Intente de nuevo.',-1);
        						break;
        					default:
        						callback.error("Error desconocido. Intente de nuevo.",-2);
        				}
        			}
        		}
        	}).fail(function( jqXHR, textStatus, errorThrown ) {
        		console.log(jqXHR.responseText +" "+ textStatus +" "+ errorThrown);
        		if (callback && 'error' in callback) {
        			callback.error('No se pudo comunicar con el servidor. Verifique su conexión a internet.',0);
        		}
        	}).always(function(){
        		if (callback && 'complete' in callback) {
        			callback.complete();
        		}
        	});
        },

        setUsuario: function(id,pass,data) {

			//Si no existe el usuario, lo creo
			if(!Usuarios.get(id))
				this.crearUsuario(id,data.name,pass);
            else {
                console.log("El usuario ya existe en la colección");
            }

			console.log("Set usuario logueado: "+id+" "+data.name+" ,token: "+data.token);

            this.set("userID",id);
            this.set("username",data.name);
			this.set("token",data.token);
			this.set("logueado",true);
            this.set("timestamp",new Date().getTime());
        	this.save();

            // Cambios en modelo usuario para actualizar estado notificacion en el server
            /* Desactivado porque no se implementó en server */
            // var cambioLogin = false;
            // var user = Usuarios.get(id);
            // if (!user.get("logueado")) {
            //     console.log("setUsuario: nuevo estado logueado usuario");
            //     cambioLogin = true;
            //     user.save({logueado: true});
            // }

            // var cambioID = false;
            // var actualID = user.get('notifID');
            // var notifID = "";
            // if (window.localStorage['iaca-notificationsID']) {
            //     notifID = window.localStorage.getItem('iaca-notificationsID');
            // }
            // if (notifID !== "" && notifID != actualID) {
            //     console.log("setUsuario: nuevo notifID");
            //     user.save({'notifID': notifID});
            // }

            // var notificar = user.get('notificar');
            // if (cambioLogin || cambioID) {
            //     this.enviarNotifID(notificar,id,notifID); // actualizo estado en el server [no implemeentado]
            // }

        },

        crearUsuario: function(id,name,pass) {
            console.log("Creo usuario id:"+id);
            Usuarios.create({id: id, name: name, pass: pass});
        },

        logout: function() {
            var id = this.get("userID");
            var user = Usuarios.get(id);
            if(user) {
            	user.save({logueado: false});
                // aviso al server que estoy logout, para que no envie notificaciones [no implementado]
	            // this.enviarNotifID(false,id,user.get('notifID'));
	        }

        	this.set("token","");
        	this.set("userID",-1);
			this.set("username","");
			this.set("logueado",false);
            this.set("timestamp",new Date().getTime());
        	this.save();
        	console.log("Logueado: "+false);

        },

        reintentoResultados: false, // para controlar un solo reintento

        getResultados: function(callback) {
            var token = this.get("token");
            var self = this;
            console.log("Obtener lista resultados... Token: "+token+" Reintento: "+this.reintentoResultados);
            // if token mayor a 30 minutos
            //  relogin
            //else
            $.ajax({
                url: this.urls.results+"token="+token,
                dataType: 'json',
                type: 'GET'
            }).done(function(data){
                console.log(data);
                if(data.result) {
                    console.log("Get Resultados OK");
                    if (callback && 'success' in callback) {
                        callback.success(data);
                        self.reintentoResultados = false;
                    }
                }
                else {
                    console.log("Get resultados - Errorcode: "+data.errorcode);
                    // ERROR DE TOKEN: Reintento (Relogin y otra vez getResultados)
                    if(data.errorcode == 2 && !self.reintentoResultados) {
                        self.reintentoResultados = true;
                        console.log("Reintento obtener resultados...");
                        self.relogin({complete: function() {
                            console.log("Vuelvo a obtener resultados...");
                            self.getResultados(callback);
                        }});
                    }
                    // OTRO ERROR o reintento fallido: devuelvo error (callback error)
                    else {
                        if (callback && 'error' in callback) {
                            callback.error("No se puede actualizar la lista de resultados");
                            self.reintentoResultados = false;
                        }
                    }
                }
            }).fail(function( jqXHR, textStatus, errorThrown ) {
                console.log(jqXHR + textStatus + errorThrown);
                // ERROR DE AJAX: reintento una vez, si no devuelvo error (callback error)
                if(!self.reintentoResultados) {
                    console.log("Reintento obtener resultados...");
                    self.reintentoResultados = true;
                    self.getResultados(callback);
                }
                else {
                    self.reintentoResultados = false;
                    if (callback && 'error' in callback) {
                        callback.error('Error al actualizar lista de resultados. Verifique su conexión a internet.');
                    }

                }
            }).always(function(){
                if (callback && 'complete' in callback) {
                    callback.complete();
                }
            });
        },

        // Verifica que el token sea valido (timestamp < 30 min)
        // Si es menor ejecuta callback
        // Si es mayor relogin y luego callback
        checkTimestamp: function(callback) {
            var diferencia_segs = (new Date().getTime() - this.get('timestamp'))/1000;
            var diferencia_mins = diferencia_segs/60;
            console.log("checkTimestamp - diferencia en minutos: "+diferencia_mins);
            if (diferencia_mins < 60) {     // VALIDEZ TOKEN: 1 HORA
                if (callback && 'success' in callback) {
                    callback.success();
                }
                if (callback && 'complete' in callback) {
                    callback.complete();
                }
            }
            else {
                this.relogin(callback);
            }
        },

        /* Opción para recibir notificaciones - no implementado en server */
        // setNotificar: function(notificar) { //param: boolean
        //     var userID = this.get("userID");
        //     if (userID != -1 && Usuarios.get(userID)) {
        //         var user = Usuarios.get(userID);
        //         var actualNotificar = user.get('notificar');
        //         if (notificar != actualNotificar) {
        //             console.log('setNotificaciones: cambio opcion notificar');
        //             user.save({
        //                 'notificar': notificar
        //             });
        //             this.enviarNotifID(notificar,userID,user.get("notifID"));  // Actualizo opcion en el server (si estoy logueado y cambió)
        //         }
        //     }
        // },

        /* setea id para notificacion - no implementado en server */
        // setNotifID: function(notifID) {
        //     var userID = this.get("userID");
        //     if (userID != -1 && Usuarios.get(userID)) {
        //         var user = Usuarios.get(userID);
        //         var actualID = user.get('notifID');
        //         if (notifID != actualID) {
        //             console.log("setNotifID: nuevo regID");
        //             user.save({
        //                 'notifID': notifID
        //             });
        //             this.enviarNotifID(user.get("notificar"),userID,notifID); // Actualizo id en el server (si estoy logueado y cambió)
        //         }
        //     }
        // },

        /* Enviar a servidor id para notificar - no implementado en server */
        // enviarNotifID: function(notificar,userID,notifID) {
        //     var platform = "";
        //     var uuid = "";
        //     if (window.device) {
        //         platform = device.platform;
        //         uuid = device.uuid;
        //     }
        //     console.log("enviarNotifID: notificar="+notificar+" userID="+userID+" platform="+platform+" uuid="+uuid+" regID="+notifID);
        //     //ToDo: AJAX POST SERVER
        //     //    data:  userID, platform, regID, notificar, uuid
        // }

    });
    return new sesionModel(); //SINGLETON

});
