var sortable = require('sortablejs')

var $slides = $('.slideshow-list-edit .slides')
if($slides.length > 0) {
	var dd = sortable.create($slides.get(0), {
		handle: '.move',
		onSort: function(evt) {
			var count = 0;
			var order = {}
			$(evt.target).find('li').each(function(li) {
				order[$(this).attr('data-id')] = count++
			})
			$.ajax({
				method: 'POST',
				url: $(evt.target).attr('data-sort-url'),
				data: order
			})
		}
	})
}


var UploadableImage = require('ei-pic-browser/uploadable-image')

$('input.picture-input-field').each(function() {
        new UploadableImage(this)
})
