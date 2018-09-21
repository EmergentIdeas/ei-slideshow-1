const Dreck = require('dreck')
let webhandle = require('webhandle')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('underscore')
const commingle = require('commingle')
const addCallbackToPromise = require('dreck/add-callback-to-promise')

const formInjector = require('form-value-injector')
const simplePropertyInjector = require('dreck/binders/simple-property-injector')


class SlideshowDreck extends Dreck {
	constructor(options) {
		super(options)
		let curDreck = this
		_.extend(this, 
			{
				templatePrefix: 'ei-slideshow-1/slideshow/',
				locals: {
					pretemplate: 'app_pre',
					posttemplate: 'app_post'
				},
				injectors: [
					(req, focus, next) => {
						simplePropertyInjector(req, focus, curDreck.bannedInjectMembers, next)
					}
				]
			}
		)
	}
	
	validateCreate(req, res, focus, callback) {
		let p = new Promise((resolve, reject) => {
			if(!focus.slides) {
				focus.slides = []
			}
			resolve(focus)
		})		
		return addCallbackToPromise(p, callback)
	}
	
	editSlideGET(req, res, next) {
		this.fetch(this.createQuery(req, res))
		.then((focus) => {
			_.extend(res.locals, this.locals)
			if(!focus || focus.length == 0) {
				this.log.error('Missing for edit screen: ' + req.originalUrl)
				this.prepLocals(req, res)
				res.render(this.templatePrefix + this.templates.missing)
			}
			else {
				let orgFocus = focus[0]
				focus = (focus[0].slides || []).filter(slide => slide.id == req.params.slideId)
				this.prepLocals(req, res, orgFocus, focus[0])
				res.locals.dreck.title = this.editTitle(focus[0])
				this.addFormInjector(req, res, focus[0])
				res.render(this.templatePrefix + 'slide-edit')
			}
		})
	}
	
	createSlideGET(req, res, next) {
		this.fetch(this.createQuery(req, res))
		.then((focus) => {
			_.extend(res.locals, this.locals)
			if(!focus || focus.length == 0) {
				this.log.error('Missing for edit screen: ' + req.originalUrl)
				this.prepLocals(req, res)
				res.render(this.templatePrefix + this.templates.missing)
			}
			else {
				let orgFocus = focus[0]
				focus = (focus[0].slides || []).filter(slide => slide.id == req.params.slideId)
				this.prepLocals(req, res, orgFocus, focus[0])
				res.locals.dreck.title = this.editTitle(focus[0])
				this.addFormInjector(req, res, focus[0])
				res.render(this.templatePrefix + 'slide-create')
			}
		})
	}
	
	modifySlidePOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.slides) {
				focus.slides = []
			}
			let orgFocus = focus
			let slideIndex
			for(let i = 0; i < focus.slides.length; i++) {
				if(focus.slides[i].id == req.params.slideId) {
					slideIndex = i
					focus = focus.slides[i]
					break;
				}
			}
			this.updateFocus(req, res, focus).then((updated) => {
				orgFocus.slides[slideIndex] = updated
				this.validateModify(req, res, orgFocus).then((validated) => {
					this.save(validated).then(() => {
						res.redirect(req.baseUrl + '/' + orgFocus._id + '/edit')
					}).catch((err) => {
						this.log.error(err)
						next(err)
					})
				}).catch((err) => {
					this.log.error(err)
					this.prepLocals(req, res, orgFocus, updated)
					res.locals.dreck.title = this.editTitle(updated)
					this.addFormInjector(req, res, updated)
					res.render(this.templatePrefix + this.templates.edit)
				})
			})
		})
	}
	
	createSlidePOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.slides) {
				focus.slides = []
			}
			let orgFocus = focus
			let slideIndex
			focus = {}
			// for(let i = 0; i < focus.slides.length; i++) {
			// 	if(focus.slides[i].id == req.params.slideId) {
			// 		slideIndex = i
			// 		focus = focus.slides[i]
			// 		break;
			// 	}
			// }
			this.updateFocus(req, res, focus).then((updated) => {
				orgFocus.slides.push(updated)
				updated.id = uuidv4()
				this.validateCreate(req, res, orgFocus).then((validated) => {
					this.save(validated).then(() => {
						res.redirect(req.baseUrl + '/' + orgFocus._id + '/edit')
					}).catch((err) => {
						this.log.error(err)
						next(err)
					})
				}).catch((err) => {
					this.log.error(err)
					this.prepLocals(req, res, orgFocus, updated)
					res.locals.dreck.title = this.editTitle(updated)
					this.addFormInjector(req, res, updated)
					res.render(this.templatePrefix + this.templates.edit)
				})
			})
		})
	}

	
	sortSlidesPOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.slides) {
				focus.slides = []
			}
			focus.slides = focus.slides.sort((one, two) => {
				try {
					let o1 = parseInt(req.body[one.id] || 0)
					let o2 = parseInt(req.body[two.id] || 0)
					if(o1 < o2) {
						return -1
					}
					if(o1 > o2) {
						return 1
					}
					return 0
				}
				catch(e) {
					return 0
				}
				
			})
			this.save(focus).then(() => {
				res.end('success')
			}).catch((err) => {
				this.log.error(err)
				next(err)
			})
		})
	}


	deleteSlidePOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.slides) {
				focus.slides = []
			}
			focus.slides = (focus.slides || []).filter(slide => slide.id != req.params.slideId)

			this.save(focus).then(() => {
				res.redirect(req.baseUrl + '/' + focus._id + '/edit')
			}).catch((err) => {
				this.log.error(err)
				next(err)
			})
		})
	}

	prepLocals(req, res, focus, subfocus) {
		if(!subfocus) {
			subfocus = focus
		}
		_.extend(res.locals, this.locals)
		let dvars = res.locals.dreck = {}
		dvars.baseUrl = req.baseUrl
		dvars.newUrl = req.baseUrl + this.urls.new[0]
		dvars.createUrl = req.baseUrl + this.urls.create[0]
		dvars.editPrefix = req.baseUrl
		dvars.deletePrefix = req.baseUrl
		if(dvars.editPrefix.lastIndexOf('/') != dvars.editPrefix.length - 1) {
			dvars.editPrefix += '/'
		}
		dvars.deleteSuffix
		
		if(subfocus) {
			res.locals.focus = subfocus
		}
		if(focus) {
			if(!Array.isArray(focus)) {
				dvars.modifyUrl = req.baseUrl + this.urls.modify[0].replace(':focusId', this.getFocusId(focus))
				dvars.editUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus))
				dvars.createSlideUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus)) + "/slide/create"
				dvars.sortSlidesUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus)) + "/slides/sort"
			}
		}
		else {
			
		}
	}
	
	addToRouter(router) {
		super.addToRouter(router)
		router.get(this.urls.edit + '/slide/create', this.createSlideGET.bind(this))
		router.post(this.urls.edit + '/slide/create', this.createSlidePOST.bind(this))
		router.get(this.urls.edit + '/slide/:slideId/edit', this.editSlideGET.bind(this))
		router.post(this.urls.modify + '/slide/:slideId/edit', this.modifySlidePOST.bind(this))
		router.post(this.urls.modify + '/slide/:slideId/delete', this.deleteSlidePOST.bind(this))
		router.post(this.urls.modify + '/slides/sort', this.sortSlidesPOST.bind(this))
		return router
	}
}

module.exports = SlideshowDreck