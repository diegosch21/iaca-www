/* global requirejs */
define([
	'text!templates/laboratorios.html',
	'backbone',
	'collections/Labos',
], function (laboratoriosTemplate,Backbone) {

	var LaboratoriosView = Backbone.View.extend({

		//precompilo el template
		template: _.template(laboratoriosTemplate),

		events: {
			'touchend .labos-boton' : 'pressBoton',
			// 'click .labos-boton' : 'pressBoton',
			'touchstart #reload' : 'reloadMapa'
		},

		initialize: function() { // options
			//console.log(3);
			//this.mapa = options['mapa'];
        },
		render: function() {
			//console.log(5);
			this.$el.html(this.template());
			// self = this;
			// setTimeout(function() {
			// 	self.mapaTodos();
			// },0);
			this.mapaTodos();
            return this;
		},
		mapaTodos: function() {
			//console.log(6);
			var self = this;
			self.$el.find('#loading-map').show();
			require(['services/gmaps'],
				function(mapa) {
					self.$el.find('#reload').hide();
					self.$el.find('#loading-map').hide();
					//console.log(7);
					mapa.setCenter(-38.717607, -62.265389);  //Bahia Blanca
					mapa.setZoom(13);
					mapa.render(self.$('#map_canvas')[0]);
					mapa.setMarkers(self.collection.toJSON());
				},
				function() {
					self.$el.find('#loading-map').hide();
					if (window.deviceready && window.plugins && window.plugins.toast) {
    					window.plugins.toast.showLongBottom('No se puede cargar el mapa: verifique la conexión a internet');
    				}
				}
			);
		},
		pressBoton: function(e) {
			console.log('pressBoton (dragging: '+window.dragging+')');
			if(!window.dragging)
				Backbone.history.navigate('laboratorios/'+$(e.currentTarget).data('lab'),true);
		},
		reloadMapa: function() {
			console.log("ReloadMapa");
			requirejs.undef('services/gmaps');
			this.mapaTodos();
		}


	});

	return LaboratoriosView;
});