define([
	'text!templates/header.html',
	'jquery',
	'underscore',
	'models/Sesion',
	'backbone'
], function (headerTemplate,$,_,Sesion) {
	
	var HeaderView = Backbone.View.extend({

		//precompilo el template
		template: _.template(headerTemplate),

		initialize: function() {
			this.menuItem = "inicio";
			this.checkUser();
			this.render();

			Sesion.on("change:timestamp",this.updateUser,this);
		},

		events: {
			// 'touchstart #logout' 	: 'logout'
			'click #logout' 	: 'logout',
		},


		render: function() {
			
			this.$el.html(this.template({logueado: this.logueado, user: this.username}));
			return this;
		},

		checkUser: function() {
			this.logueado = Sesion.get("logueado");
			if(this.logueado)
				this.username = Sesion.get("username");
			else
				this.username = "";
		},

		updateUser: function() {
			console.log("Update User..")
			this.checkUser();
			this.render();
			this.selectMenuItem(this.menuItem);
		},

		selectMenuItem: function (menuItem) {
			this.menuItem = menuItem;
			$('#app-header-menu li').removeClass('activo');
			$('#menu-principal-xs span.menu-principal-xs-activo').hide();
	        if (menuItem) {
	            $('#menuitem-' + menuItem).addClass('activo');
	            $('#menu-principal-xs-'+ menuItem).show();
        	}
    	},
    	logout: function(evt) {
    		if(evt)
    			evt.preventDefault();
    		Sesion.logout();
    		Backbone.history.navigate("home",true);
    	}

	});

	return HeaderView;
})