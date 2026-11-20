(function () {
	"use strict";

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}

	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		return Constructor;
	}

	function _toConsumableArray(arr) {
		return (
			_arrayWithoutHoles(arr) ||
			_iterableToArray(arr) ||
			_unsupportedIterableToArray(arr) ||
			_nonIterableSpread()
		);
	}

	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}

	function _iterableToArray(iter) {
		if (
			(typeof Symbol !== "undefined" && iter[Symbol.iterator] != null) ||
			iter["@@iterator"] != null
		)
			return Array.from(iter);
	}

	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
			return _arrayLikeToArray(o, minLen);
	}

	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;

		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

		return arr2;
	}

	function _nonIterableSpread() {
		throw new TypeError(
			"Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method."
		);
	}

	function _createForOfIteratorHelper(o, allowArrayLike) {
		var it =
			(typeof Symbol !== "undefined" && o[Symbol.iterator]) || o["@@iterator"];

		if (!it) {
			if (
				Array.isArray(o) ||
				(it = _unsupportedIterableToArray(o)) ||
				(allowArrayLike && o && typeof o.length === "number")
			) {
				if (it) o = it;
				var i = 0;

				var F = function () {};

				return {
					s: F,
					n: function () {
						if (i >= o.length)
							return {
								done: true
							};
						return {
							done: false,
							value: o[i++]
						};
					},
					e: function (e) {
						throw e;
					},
					f: F
				};
			}

			throw new TypeError(
				"Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method."
			);
		}

		var normalCompletion = true,
			didErr = false,
			err;
		return {
			s: function () {
				it = it.call(o);
			},
			n: function () {
				var step = it.next();
				normalCompletion = step.done;
				return step;
			},
			e: function (e) {
				didErr = true;
				err = e;
			},
			f: function () {
				try {
					if (!normalCompletion && it.return != null) it.return();
				} finally {
					if (didErr) throw err;
				}
			}
		};
	}
    
    function State(object) {
		this.state = object.state;

		this.start = function () {
			this.dispath(this.state);
		};

		this.dispath = function (action_name) {
			var action = object.transitions[action_name];

			if (action) {
				action.call(this, this);
			} else {
				console.log("invalid action");
			}
		};
	}

	var Player = (function () {
		function Player(object, video, isBgMode) {
			var _this = this;

			_classCallCheck(this, Player);

			this.paused = false;
			this.display = false;
			this.ended = false;
            this.isBgMode = isBgMode;
            this.video = video;
			this.listener = Lampa.Subscribe();

			this.html = $(
				'\n            <div class="cardify-trailer ' + (this.isBgMode ? 'bg-mode' : 'fg-mode') + '">\n                <div class="cardify-trailer__youtube">\n                    <div class="cardify-trailer__youtube-iframe"></div>\n                    <div class="cardify-trailer__youtube-line one"></div>\n                    <div class="cardify-trailer__youtube-line two"></div>\n                </div>\n' + 
                (!this.isBgMode ? '\n                <div class="cardify-trailer__controlls">\n                    <div class="cardify-trailer__title"></div>\n                    <div class="cardify-trailer__remote">\n                        <div class="cardify-trailer__remote-icon">\n                            <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M32.5196 7.22042L26.7992 12.9408C27.8463 14.5217 28.4561 16.4175 28.4561 18.4557C28.4561 20.857 27.6098 23.0605 26.1991 24.7844L31.8718 30.457C34.7226 27.2724 36.4561 23.0667 36.4561 18.4561C36.4561 14.2059 34.983 10.2998 32.5196 7.22042Z" fill="white" fill-opacity="0.28"/>\n                                <path d="M31.262 31.1054L31.1054 31.262C31.158 31.2102 31.2102 31.158 31.262 31.1054Z" fill="white" fill-opacity="0.28"/>\n                                <path d="M29.6917 32.5196L23.971 26.7989C22.3901 27.846 20.4943 28.4557 18.4561 28.4557C16.4179 28.4557 14.5221 27.846 12.9412 26.7989L7.22042 32.5196C10.2998 34.983 14.2059 36.4561 18.4561 36.4561C22.7062 36.4561 26.6123 34.983 29.6917 32.5196Z" fill="white" fill-opacity="0.28"/>\n                                <path d="M5.81349 31.2688L5.64334 31.0986C5.69968 31.1557 5.7564 31.2124 5.81349 31.2688Z" fill="white" fill-opacity="0.28"/>\n                                <path d="M5.04033 30.4571L10.7131 24.7844C9.30243 23.0605 8.4561 20.857 8.4561 18.4557C8.4561 16.4175 9.06588 14.5217 10.113 12.9408L4.39251 7.22037C1.9291 10.2998 0.456055 14.2059 0.456055 18.4561C0.456054 23.0667 2.18955 27.2724 5.04033 30.4571Z" fill="white" fill-opacity="0.28"/>\n                                <path d="M6.45507 5.04029C9.63973 2.18953 13.8455 0.456055 18.4561 0.456055C23.0667 0.456054 27.2724 2.18955 30.4571 5.04034L24.7847 10.7127C23.0609 9.30207 20.8573 8.45575 18.4561 8.45575C16.0549 8.45575 13.8513 9.30207 12.1275 10.7127L6.45507 5.04029Z" fill="white" fill-opacity="0.28"/>\n                                <circle cx="18.4565" cy="18.4561" r="7" fill="white"/>\n                            </svg>\n                        </div>\n                        <div class="cardify-trailer__remote-text">'.concat(
					Lampa.Lang.translate("cardify_enable_sound"),
					"</div>\n                    </div>\n                </div>\n"
				) : "") + '            </div>\n        '
			);
		}

		_createClass(Player,[
            {
                key: "initYoutube",
                value: function initYoutube() {
                    var _this = this;
                    var bgSound = Main.cases()[Main.stor()].field("cardify_bg_trailer_sound") === true;
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    
                    var h = (this.isBgMode || isHorizontal) ? window.innerHeight * 2 : '100%';
                    var w = (this.isBgMode || isHorizontal) ? window.innerWidth : '100%';

                    this.youtube = new window.YT.Player(
                        this.html.find(".cardify-trailer__youtube-iframe")[0],
                        {
                            host: 'https://www.youtube.com',
                            height: h,
                            width: w,
                            playerVars: {
                                controls: 0,
                                showinfo: 0,
                                autohide: 1,
                                modestbranding: 1,
                                autoplay: Lampa.Platform.is('android') ? 1 : 0,
                                disablekb: 1,
                                fs: 0,
                                enablejsapi: 1,
                                playsinline: 1,
                                rel: 0,
                                cc_load_policy: 0,
                                iv_load_policy: 3,
                                origin: window.location.protocol === 'file:' ? 'https://www.youtube.com' : (window.location.origin || 'https://www.youtube.com'),
                                widget_referrer: window.location.href,
                                suggestedQuality: "hd1080",
                                setPlaybackQuality: "hd1080",
                                mute: ((this.isBgMode && !bgSound) || Lampa.Platform.is('android')) ? 1 : 0,
                                start: (this.video && this.video.startTime !== undefined) ? this.video.startTime : 9
                            },
                            videoId: this.video.id,
                            events: {
                                onReady: function onReady(event) {
                                    _this.loaded = true;
                                    var iframe = $(_this.youtube.getIframe());
                                    
                                    var blurVal = parseInt(Main.cases()[Main.stor()].field("cardify_trailers_blur")) || 0;
                                    if (blurVal > 0) {
                                        iframe.css('filter', 'blur(' + blurVal + 'px)');
                                    }

                                    if (_this.isBgMode || isHorizontal) {
                                        var zoomVal = Main.cases()[Main.stor()].field("cardify_trailers_zoom");
                                        if (zoomVal === true) zoomVal = "33"; 
                                        if (zoomVal === false) zoomVal = "0";
                                        zoomVal = zoomVal || "0";

                                        if (zoomVal !== "0") {
                                            var scale = 1;
                                            if (zoomVal == "25") scale = 1.25;
                                            else if (zoomVal == "33") scale = 1.33;
                                            else if (zoomVal == "40") scale = 1.40;
                                            else if (zoomVal == "45") scale = 1.45;
                                            else if (zoomVal == "50") scale = 1.50;
                                            
                                            iframe.css('transform', 'scale(' + scale + ')');
                                        }
                                    }

                                    _this.listener.send("loaded");
                                },
                                onStateChange: function onStateChange(state) {
                                    if (state.data == window.YT.PlayerState.PLAYING) {
                                        _this.paused = false;
                                        try {
                                            _this.youtube.unloadModule("captions");
                                            _this.youtube.unloadModule("cc");
                                        } catch(e) {}
                                        
                                        clearInterval(_this.timer);
                                        _this.timer = setInterval(function () {
                                            var left = _this.youtube.getDuration() - _this.youtube.getCurrentTime();
                                            var toend = 2;
                                            if (left <= toend) {
                                                clearInterval(_this.timer);
                                                _this.listener.send("ended");
                                            }
                                        }, 100);

                                        _this.listener.send("play");
                                        setTimeout(function() {
                                            _this.listener.send("first_frame");
                                        }, 300);

                                        if (window.cardify_fist_unmute && !_this.isBgMode) _this.unmute();
                                    }

                                    if (state.data == window.YT.PlayerState.PAUSED) {
                                        _this.paused = true;
                                        clearInterval(_this.timer);
                                        _this.listener.send("paused");
                                    }

                                    if (state.data == window.YT.PlayerState.ENDED) {
                                        _this.listener.send("ended");
                                    }

                                    if (state.data == window.YT.PlayerState.BUFFERING) {
                                        state.target.setPlaybackQuality("hd1080");
                                    }
                                },
                                onError: function onError(e) {
                                    _this.loaded = false;
                                    _this.listener.send("error");
                                }
                            }
                        }
                    );
                }
            },
            {
                key: "initHtml5",
                value: function initHtml5() {
                    var _this = this;
                    var blurVal = parseInt(Main.cases()[Main.stor()].field("cardify_trailers_blur")) || 0;
                    var zoomVal = Main.cases()[Main.stor()].field("cardify_trailers_zoom");
                    var bgSound = Main.cases()[Main.stor()].field("cardify_bg_trailer_sound") === true;
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    
                    if (zoomVal === true) zoomVal = "33";
                    if (zoomVal === false) zoomVal = "0";
                    zoomVal = zoomVal || "0";

                    var scale = 1;
                    if (zoomVal == "25") scale = 1.25;
                    else if (zoomVal == "33") scale = 1.33;
                    else if (zoomVal == "40") scale = 1.40;
                    else if (zoomVal == "45") scale = 1.45;
                    else if (zoomVal == "50") scale = 1.50;

                    var container = this.html.find(".cardify-trailer__youtube-iframe");
                    container.empty();
                    
                    var videoElem = document.createElement('video');
                    videoElem.autoplay = true;
                    videoElem.loop = true;
                    videoElem.setAttribute('loop', '');
                    videoElem.playsInline = true;
                    videoElem.setAttribute('playsinline', '');
                    videoElem.setAttribute('webkit-playsinline', '');
                    videoElem.setAttribute('x-webkit-airplay', 'deny');
                    videoElem.setAttribute('x5-playsinline', '');
                    videoElem.setAttribute('x5-video-player-type', 'h5');
                    videoElem.setAttribute('x5-video-player-fullscreen', 'false');
                    videoElem.setAttribute('x5-video-orientation', 'portrait');
                    videoElem.controls = false; 
                    videoElem.removeAttribute('controls');
                    videoElem.disablePictureInPicture = true;
                    videoElem.disableRemotePlayback = true;
                    videoElem.preload = 'auto';
                    videoElem.setAttribute('preload', 'auto');

                    // Crucial for browser autoplay policy:
                    // Videos MUST have muted property AND HTML attribute to allow autoplay
                    videoElem.muted = true;
                    videoElem.defaultMuted = true;
                    videoElem.setAttribute('muted', '');
                    
                    videoElem.style.width = '100%';
                    videoElem.style.height = '100%';
                    videoElem.style.objectFit = (!this.isBgMode && !isHorizontal) ? 'contain' : 'cover';
                    videoElem.style.border = 'none';
                    videoElem.style.pointerEvents = 'none';
                    videoElem.style.outline = 'none';
                    videoElem.style.background = 'transparent';
                    videoElem.tabIndex = -1; 
                    if (this.isBgMode) {
                        videoElem.style.opacity = '0';
                        videoElem.style.transition = 'opacity 1.5s ease-in-out';
                    }

                    if (blurVal > 0) videoElem.style.filter = 'blur(' + blurVal + 'px)';
                    if (scale > 1 && (this.isBgMode || isHorizontal)) videoElem.style.transform = 'scale(' + scale + ')';

                    this.videoNode = videoElem;

                    var triggerLoaded = function() {
                        if (!_this.loaded) {
                            _this.loaded = true;
                            _this.listener.send("loaded");
                        }
                    };

                    var checkFirstFrame = function() {
                        if (_this.firstFrameReady) return;
                        var startTime = (_this.video && _this.video.startTime) || 0;
                        var curTime = _this.videoNode ? _this.videoNode.currentTime : 0;
                        if (curTime >= (startTime > 0.5 ? (startTime - 0.3) : 0.1)) {
                            _this.firstFrameReady = true;
                            if (_this.videoNode) {
                                _this.videoNode.style.opacity = '1';
                            }
                            _this.listener.send("first_frame");
                        }
                    };

                    this.videoNode.addEventListener('loadeddata', triggerLoaded);
                    this.videoNode.addEventListener('canplay', triggerLoaded);
                    this.videoNode.addEventListener('playing', function() {
                        triggerLoaded();
                        setTimeout(checkFirstFrame, 80);
                    });
                    this.videoNode.addEventListener('timeupdate', function() {
                        triggerLoaded();
                        checkFirstFrame();
                    });

                    var applyStartTime = function() {
                        if (_this.video.startTime && !_this.seeked) {
                            _this.seeked = true;
                            try {
                                if (_this.videoNode.currentTime < _this.video.startTime) {
                                    _this.videoNode.currentTime = _this.video.startTime;
                                }
                            } catch(e) {}
                        }
                    };

                    this.videoNode.addEventListener('loadedmetadata', function() {
                        triggerLoaded();
                        applyStartTime();
                    });

                    this.videoNode.addEventListener('canplay', function() {
                        triggerLoaded();
                        applyStartTime();
                    });

                    this.videoNode.addEventListener('seeked', function() {
                        if (_this.videoNode && _this.videoNode.paused) {
                            try { _this.videoNode.play(); } catch(e) {}
                        }
                    });

                    this.videoNode.addEventListener('play', function() {
                        _this.paused = false;
                        clearInterval(_this.timer);
                        _this.timer = setInterval(function() {
                            if (_this.videoNode && !_this.videoNode.paused && !_this.videoNode.ended && _this.videoNode.duration) 
