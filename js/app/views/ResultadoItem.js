define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/resultado_item.html'
], function ($,_,Backbone,resultadoItemTemplate) {
	
	var ResultadoItemView = Backbone.View.extend({

		//precompilo el template
		template: _.template(resultadoItemTemplate),

		initialize: function() {
			
		},

		render: function() {
			this.$el.html(this.template());
			return this;
		},
		
	});

	return ResultadoItemView;
})