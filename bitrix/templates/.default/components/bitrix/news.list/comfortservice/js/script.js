$(function() {
	_comfort.init();
});

var _comfort = {
	init: function() {
		var intCore = setInterval(function() {
			if (typeof core != 'undefined') {
				clearInterval(intCore);
				// loading Ymaps api
				if (typeof ymaps == 'undefined' && window.location.hostname !== 'localhost') {
					core.content.append('<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU" type="text/javascript"></script>');
				}
				// waiting Ymaps api
				var intYmaps = setInterval(function() {
					if (typeof ymaps != 'undefined') {
						clearInterval(intYmaps);
						site.loading = false;
						ymaps.ready(_comfort.initMaps);
					}
				}, 200);
				// waiting Swiper
				var intSwiper = setInterval(function() {
					if (typeof Swiper != 'undefined') {
						clearInterval(intSwiper);
						_comfort.initSwipers();
					}
				}, 200);
				_comfort.initNews();
			}
		}, 200);

		_comfort.initScroll();

		$('.comfort-menu-links a').on('click', function(e) {
			e.preventDefault();
			var a = $('.anchor[data-id="' + $(this).attr('href').replace('#', '') + '"]');
			/*if (a.length == 1) {
				a[0].scrollIntoView({behavior: 'smooth'});
			}*/
      $('html, body').animate({scrollTop: a.offset().top}, 800)
			return false;
		});

		$('.comfort-advantages-menu a').on('click', function(e) {
			e.preventDefault();
			var block = $(this).closest('.comfort-block');

      $('html, body').animate({scrollTop: block.find('.comfort-content').offset().top - $('.page-header').outerHeight()})

			if (!$(this).hasClass('active')) {
				block.find('.comfort-advantages-menu a').removeClass('active')
					.closest('.comfort-advantages-item').removeClass('active');
				$(this).addClass('active')
					.closest('.comfort-advantages-item').addClass('active');
				block.find('.comfort-advantages-info').removeClass('active')
					.filter('[data-id="' + $(this).attr('href').replace('#', '') + '"]').addClass('active');
			}
			return false;
		});

    $('.comfort-advantages-menu div.comfort-advantages-item span').on('click', function(){
      $(this).parent().addClass('active')
      $(this).siblings('a').eq(0).trigger('click')
    })

		$('.comfort-objects-menu a').on('click', function(e) {
			e.preventDefault();
			if (!$(this).hasClass('active')) {
				$('.comfort-objects-menu a').removeClass('active');
				$(this).addClass('active');
				$('.comfort-objects').removeClass('by-map by-tile')
					.addClass($(this).attr('href').replace('#', ''));
			}
			return false;
		});

    $('.comfort-popup-buttons a').on('click', function(){
      window.open($(this).attr('href'), "_blank");
    })

		_comfort.initPopups();
	},
	initMaps: function() {
		$('.comfort-map').each(function() {
			var id = $(this).attr('id');
			var coord = [parseFloat($(this).attr('data-lat')), parseFloat($(this).attr('data-lon'))];

			var map = new ymaps.Map(
				id,
				{
					center: coord,
					zoom: 15,
					controls: [],
					margin: id == 'comfort-contacts-map' || id == 'comfort-object-infrastructure-map' ? [40, window.innerWidth / 2, 40, 20] :  [40, 20, 40, 20]
				},
				{
					searchControlProvider: 'yandex#search',
					yandexMapDisablePoiInteractivity: true
				}
			);
			var zoomControl = new window.ymaps.control.ZoomControl({
				options: {
					size: 'small',
					position: id == 'comfort-objects-map' ? { right: 20, top: 20 } : { left: 20, top: 20 }
				}
			})
			map.controls.add(zoomControl);
			map.behaviors.disable('scrollZoom');

			if (id == 'comfort-objects-map') {
				$('.comfort-objects-item').each(function() {
					if ($(this).attr('data-lat') && $(this).attr('data-lon')) {
						var pid = $(this).attr('data-id');
						var title = $(this).find('.comfort-objects-txt .big').html();
						var c = [parseFloat($(this).attr('data-lat')), parseFloat($(this).attr('data-lon'))];
						var p = new ymaps.Placemark(
							c,
							{
								hintContent: title,
								id: pid
							},
							{
								iconLayout: 'default#image',
								iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-grey.svg',
								iconImageSize: [31, 40],
								iconImageOffset: [-15, -40],
								zIndex: 0
							}
						);
						p.events.add('click', function() {
							_comfort.setActiveObject(map, pid, false, true);
						});
						map.geoObjects.add(p);
					}
				});
				map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true });
				$('.comfort-objects-item').on('mouseenter', function() {
					_comfort.setActiveObject(map, $(this).attr('data-id'), false, false);
				});
				$('.comfort-objects-item').on('mouseleave', function() {
					_comfort.setActiveObject(map, 0, false, false);
				});
			} else if (id == 'comfort-contacts-map') {
				var placemark = new ymaps.Placemark(
					coord,
					{},
					{
						iconLayout: 'default#image',
						iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-green.svg',
						iconImageSize: [46, 60],
						iconImageOffset: [-23, -60]
					}
				);
				map.geoObjects.add(placemark);
			} else if (id == 'comfort-object-infrastructure-map') {
				_comfort.centerCoords = coord
				_comfort.id = id
				$('.comfort-object-infrastructure-item:first-child').addClass('active')
				_comfort.infrastructureObjects = []

				var allCategories = []

				function callback(res, category) {
					if (res && res.features) {
						res.features.map(function(el) {
							if (el && el.properties && el.geometry && el.properties.CompanyMetaData) {
								var id = el.properties.CompanyMetaData.id
								var coords = el.geometry.coordinates.reverse()
								var title = el.properties.name
								var description = el.properties.description

								_comfort.infrastructureObjects.push({
									id: id,
									coords: coords,
									title: title,
									category: category,
									description: description
								})
							}

							_comfort.setActiveCategory(map, $('.comfort-object-infrastructure-item.active').attr('href').replace('#', ''));
						})
					}
				}

				function getCategoryItems(category, search_words) {
					search_words.map(function(el) {
						//console.log('https://search-maps.yandex.ru/v1/?lang=ru_RU&text='+ el +'&apikey=f52fdf88-7977-454d-bbfa-637ede548f57&type=biz&ll='+ coord.slice().reverse().join() +'&spn=0.05,0.05&rspn=1');
						$.ajax({
							type: 'GET',
							url: 'https://search-maps.yandex.ru/v1/?lang=ru_RU&text='+ el +'&apikey=f52fdf88-7977-454d-bbfa-637ede548f57&type=biz&ll='+ coord.slice().reverse().join() +'&spn=0.05,0.05&rspn=1',
							success: function(response) {
								allCategories.push(category)
								callback(response, category)
							},

						});
					})
				}
				var firstCategory = infraCategories[$('.comfort-object-infrastructure-item.active').attr('href').replace('#','')]

				getCategoryItems(firstCategory.name, firstCategory.search_words)


				$('.comfort-object-infrastructure-item').on('click', function(e) {
					e.preventDefault();
					var category = infraCategories[$(this).attr('href').replace('#','')]
					if (allCategories.includes(category.name)) return _comfort.setActiveCategory(map, $(this).attr('href').replace('#', ''));
					$('.comfort-object-infrastructure-item').removeClass('active').filter('[href="#' + $(this).attr('href').replace('#', '') + '"]').addClass('active');
					getCategoryItems(category.name, category.search_words)
					return false;
				});
			}
		});
	},
	setActiveObject: function(map, pid, isCenterMap, isScrollList) {
		$('.comfort-objects-item').removeClass('active');
		map.geoObjects.each(function(p) {
			if (p.properties.get('id') == pid)  {
				var it = $('.comfort-objects-item').filter('[data-id="' + pid + '"]');
				p.options.set({
					iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-green.svg',
					iconImageSize: [46, 60],
					iconImageOffset: [-23, -60],
					zIndex: 1
				});
				it.addClass('active');
				if (isCenterMap) {
					map.setCenter(p.geometry.getCoordinates());
				}
				if (isScrollList) {
					var iT = it.offset().top;
					var wT = $(document).scrollTop();
					var wB = wT + window.innerHeight;
					if (iT - 80 < wT) {
						$('html, body').animate({scrollTop: iT - 80}, 500);
					} else if (iT > wB) {
						$('html, body').animate({scrollTop: iT + it.outerHeight() - window.innerHeight}, 500);
					}
				}
			} else {
				p.options.set({
					iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-grey.svg',
					iconImageSize: [31, 40],
					iconImageOffset: [-15, -40],
					zIndex: 0
				});
			}
		});
	},
	setActiveCategory: function(map, cid) {
		$('.comfort-object-infrastructure-item').removeClass('active').filter('[href="#' + cid + '"]').addClass('active');
		map.geoObjects.removeAll();
		var block = $('#comfort-object-infrastructure-map');
		var placemark = new ymaps.Placemark(
			[parseFloat(block.attr('data-lat')), parseFloat(block.attr('data-lon'))],
			{
				hintContent: block.attr('data-title')
			},
			{
				iconLayout: 'default#image',
				iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-black.svg',
				iconImageSize: [46, 60],
				iconImageOffset: [-23, -60]
			}
		);
		map.geoObjects.add(placemark);
		if (typeof _comfort.infrastructureObjects != 'undefined') {
			for (var i = 0; i < _comfort.infrastructureObjects.length; i ++) {
				var obj = _comfort.infrastructureObjects[i];
				if (obj.category === infraCategories[cid].name) {
					var p = new ymaps.Placemark(
						obj.coords,
						{
							hintContent: obj.title + '<br/>' + obj.description,
						},
						{
							iconLayout: 'default#image',
							iconImageHref: '/bitrix/templates/.default/components/bitrix/news.list/comfortservice/img/pin-green.svg',
							iconImageSize: [23, 30],
							iconImageOffset: [-12, -15]
						}
					);
					map.geoObjects.add(p);
				}
			}
			//console.log(_comfort.id)
			if (_comfort.id === 'comfort-object-infrastructure-map') {
				map.setCenter(_comfort.centerCoords, 15);
				var pixelCenter = map.getGlobalPixelCenter(_comfort.centerCoords);

				pixelCenter = [
					pixelCenter[0] + window.innerWidth / 4,
					pixelCenter[1]
				];
				var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
				map.setCenter(geoCenter, 15);
			} else {

				map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, useMapMargin: true})
					.then(function(){
						console.log(map.getZoom())
					});
			}
		}
	},
	initSwipers: function() {
		$('.comfort-facilities-slider').each(function() {
			var facilitiesSliderBlock = $(this);

      if(facilitiesSliderBlock.find('.swiper-slide').length <= 2){
        facilitiesSliderBlock.find('.swiper-button-prev, .swiper-button-next').hide();
      }

			var facilitiesSlider = new Swiper(facilitiesSliderBlock, {
				slidesPerView: 2,
				spaceBetween: 97,
				speed: 300,
				navigation: {
					prevEl: facilitiesSliderBlock.find('.swiper-button-prev'),
					nextEl: facilitiesSliderBlock.find('.swiper-button-next')
				}
			});
		});

		if ($('.comfort-detail-gallery').length > 0) {
			var objectSliderBlock = $('.comfort-detail-gallery');


      if(objectSliderBlock.find('.swiper-slide').length == 1){
        objectSliderBlock.find('.bottom-next-square, .bottom-prev-square, .pagination-fraction').hide()
      }

			var objectSlider = new Swiper(objectSliderBlock, {
				slidesPerView: 1,
				speed: 1000,
				loop: true,
				parallax: true,
				navigation: {
					nextEl: objectSliderBlock.find('.bottom-next-square'),
					prevEl: objectSliderBlock.find('.bottom-prev-square')
				},
				pagination: {
					el: objectSliderBlock.find('.pagination-fraction'),
					type: 'fraction',
					renderFraction: function (currentClass, totalClass) {
						return '<span class="' + currentClass + '"></span>' +
							'<span></span><span class="' + totalClass + '"></span>';
					}
				},
				on: {
					slideNextTransitionStart: function () {
						objectSliderBlock.find('.pagination-fraction').addClass('anim-fow_');
					},
					slidePrevTransitionStart: function () {
						objectSliderBlock.find('.pagination-fraction').addClass('anim-back_');
					},
					slideChangeTransitionEnd: function () {
						objectSliderBlock.find('.pagination-fraction').removeClass('anim-fow_ anim-back_');
					}
				}
			});
		}
	},
	initScroll: function() {
		$(window).resize(function() {
			_comfort.positionScroll();
		});
		$(window).scroll(function() {
			_comfort.positionScroll();
		});
	},
	positionScroll: function() {
		var posWT = $(document).scrollTop();
		var posWB = posWT + window.innerHeight;
		$('.comfort-fix-block').each(function() {
			var item = $(this).find('.comfort-fix-item');
			if (item.length == 1) {
				var col1 = item.hasClass('comfort-column') ? item : item.closest('.comfort-column');
				var isFix = true;
				if (col1.length == 1) {
					var col2 = col1.siblings('.comfort-column');
					if (col2.length == 1 && col2.outerHeight() < item.outerHeight()) {
						isFix = false;
					}
				}

				if (isFix) {
					var next = $(this).next('.comfort-block').length > 0 ? $(this).next('.comfort-block') : $(this).next('.comfort-intro').length > 0 ? $(this).next('.comfort-intro') : null;
					var posBT = item.offset().top;
					var posBB = posBT + item.outerHeight();
					var yT = posWT - posBT + parseInt($(this).css('padding-top'));
					var yB = posWB - posBB - parseInt($(this).css('padding-bottom')) + 60;
					var yBI = next ? item.outerHeight() + (yB > yT ? 210 : 60) + posWT - next.offset().top : -1;
					if (yBI >= 0) {
						item.find('.comfort-fix-item-in').css({'transition': 'transform ' + Math.max(Math.max(yT, yB) * 5, 500) + 'ms ease, opacity 0.5s ease', 'transform': 'translateY(0)', 'opacity': 0})
							.find('.comfort-fix-item-in-op').css({'transition': 'opacity 0.5s ease', 'opacity': 0});
					} else {
						item.find('.comfort-fix-item-in').css({'transition': 'transform 0s ease, opacity 0.5s ease', 'transform': 'translateY(' + (yT >= 0 && yB >= 0 ? Math.min(yT, yB) : 0) + 'px)', 'opacity': 1})
							.find('.comfort-fix-item-in-op').css({'transition': 'opacity 0.5s ease', 'opacity': 1});
					}
					var yBI2 = next ? (parseInt(item.find('.comfort-title').outerHeight()) || parseInt(item.find('.comfort-subtitle').outerHeight())) + (yB > yT ? 150 : 30) + posWT - next.offset().top : -1;
					if (yBI2 >= 0) {
						item.find('.comfort-fix-item-in').css({'transition': 'transform ' + Math.max(Math.max(yT, yB) * 5, 500) + 'ms ease, opacity 0.5s ease', 'transform': 'translateY(0)', 'opacity': 0});
					} else {
						item.find('.comfort-fix-item-in').css({'transition': 'transform 0s ease, opacity 0.5s ease', 'transform': 'translateY(' + (yT >= 0 && yB >= 0 ? Math.min(yT, yB) : 0) + 'px)', 'opacity': 1});
					}
				}
			}
		});
	},
	initPopups: function() {
		if ($('.comfort-popup').length > 0) {
			$('.comfort-popup').appendTo($('body'));
			$('.comfort-popup-button').on('click', function(e) {
				e.preventDefault();
				_comfort.openPopup($(this).attr('href').replace('#', ''));
				return false;
			});
			$('.comfort-popup').on('click', function(e) {
				_comfort.closePopup($(this).attr('id'));
			});
			$('.comfort-win').on('click', function(e) {
				e.stopPropagation();
				return false;
			}).find('a').on('click', function(e) {
				e.stopPropagation();
			});
			$('.comfort-close').on('click', function(e) {
				e.stopPropagation();
				_comfort.closePopup($(this).closest('.comfort-popup').attr('id'));
				return false;
			});
		}
	},
	openPopup: function(id) {
		var p = $('#' + id);
		if (p.length == 1) {
			p.addClass('opened');
			$('body').addClass('comfort-popup-opened');
		}
	},
	closePopup: function(id) {
		var p = $('#' + id);
		if (p.length == 1) {
			p.removeClass('opened');
			$('body').removeClass('comfort-popup-opened');
		}
	},
	initNews: function() {
		if ($('.comfort-news-item').length > 0) {
			$('.comfort-news-item').find('.comfort-more, .comfort-news-img').on('click', function(e) {
				e.preventDefault();
				var item = $(this).closest('.comfort-news-item');
				if (!item.hasClass('active')) {
					_comfort.openNews(item);
				} else {
					_comfort.closeNews(item);
				}
				return false;
			});
			if ($('.comfort-news-item.active').length == 1) {
				var item = $('.comfort-news-item.active');
				_comfort.openNews(item);
				// waiting offset
				var intOffset = setInterval(function() {
					var offset = item.offset().top;
					if (offset > 0) {
						clearInterval(intOffset);
						$('html, body').animate({scrollTop: offset - 80}, 500);
					}
				}, 200);
			}
		}
	},
	openNews: function(item) {
		item.find('.comfort-more span').html('Свернуть');
		item.addClass('active').find('.comfort-news-full').slideDown(500);
	},
	closeNews: function(item) {
		item.find('.comfort-more span').html('Подробнее');
		item.removeClass('active').find('.comfort-news-full').slideUp(500);
	}
};
