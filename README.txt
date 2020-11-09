
To integrate the server side components:


const slideIntegrator = require('ei-slideshow-1/server-js/webhandle-slideshow-integrator')
slideIntegrator('historycenter', {
	addTemplateDir: false
})



To integrate admin client code, add to app.js

require('ei-slideshow-1/client-js/slideshow-client')


To integrate styles, add to app.less:

@import (less) "../node_modules/ei-slideshow-1/less/slideshow";



