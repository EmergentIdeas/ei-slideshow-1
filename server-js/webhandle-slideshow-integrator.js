const webhandle = require('webhandle')
const commingle = require('commingle')
const usersSetup = require('webhandle-users/integrate-with-webhandle')
const path = require('path')
const express = require('express');

const SlideshowDreck = require('./slideshow-dreck')

let integrate = function(dbName, options) {
	if(!webhandle.dbs[dbName].collections.slideshows) {
		webhandle.dbs[dbName].collections.slideshows = webhandle.dbs[dbName].db.collection('slideshows')
	}

	options = options || {}
	options.templateDir = options.templateDir || 'node_modules/ei-slideshow-1/views'
	options.addTemplateDir = options.addTemplateDir || true

	
	let slideshows = new SlideshowDreck({
		mongoCollection: webhandle.dbs[dbName].collections.slideshows,
	})
	
	let slideshowsRouter = slideshows.addToRouter(express.Router())
	let securedSlideshowsRouter = require('webhandle-users/utils/allow-group')(
		['administrators'],
		slideshowsRouter
	)
	webhandle.routers.primary.use('/slideshow', securedSlideshowsRouter)
	
	if(options.addTemplateDir) {
		webhandle.addTemplateDir(path.join(webhandle.projectRoot, options.templateDir))
	}
	
	webhandle.pageServer.preRun.push((req, res, next) => {
		let pageName = req.path.split('/').pop()
		if(!pageName) {
			pageName = 'index'
		}
		webhandle.dbs[dbName].collections.slideshows.findOne({name: pageName}, (err, result) => {
			if(err) {
				log.error(err)
			}
			else if(result){
				res.locals.page.images = result.slides
			}
			next()
		})
	})
	
}

module.exports = integrate