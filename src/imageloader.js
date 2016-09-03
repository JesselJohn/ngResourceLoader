'use strict';

/*!
 * Jessel John - May, 04, 2014
 * https://github.com/JesselJohn
 * MIT Licence
 */
! function(window, document, undefined) {
    angular.module('ng.resourceloader',[])
        .directive('ngLazyLoadImg', ['$window', '$rootScope', '$timeout', function($window, $rootScope, $timeout) {
            var objOfOnLoadImgElems = {},
                objOfLazyImgElems = {},
                objOfLazyImgElemsInViewport = {},
                arrOfPrevDisplayedElements = [],
                loadTimeoutId,
                scrollTimeoutId,
                resizeTimeoutId,
                ngLazyLoadImg = {
                    scope: {
                        'defaultImage': '=?',
                        'unLoadOnScroll': '=?',
                        'imgsrc': '=',
                        'onWinLoad': '=?'
                    },
                    replace: true,
                    template: function(elem, attrs) {
                        return attrs.elemType == 'img' ?
                            '<img class="ty-async-img" ng-src="{{tyShow.imgsrc}}" ng-class="{\'loaded\':loaded}"></img>' :
                            '<div class="ty-async-img" ng-style="{\'background-image\':\'url(\'+tyShow.imgsrc+\')\'}" ng-class="{\'loaded\':loaded}"></div>';
                    },
                    restrict: 'E',
                    controllerAs: 'tyShow',
                    controller: ['$scope', '$element',
                        function($scope, $element) {
                            var that = this,
                                $elementOffsetTop = $element[0].getBoundingClientRect().top;
    
                            function populateLazyElemsFn(obj) {
                                if (obj[$elementOffsetTop] === undefined) {
                                    obj[$elementOffsetTop] = [];
                                }
                                obj[$elementOffsetTop].push({
                                    'that': that,
                                    'scope': $scope,
                                    'elem': $element
                                });
                            }
    
                            that.imgsrc = $scope.defaultImage;
    
                            if (!$scope.onWinLoad) {
                                $scope.unLoadOnScroll = $scope.unLoadOnScroll === undefined ? true : $scope.unLoadOnScroll;
                                populateLazyElemsFn(objOfLazyImgElems);
                            } else {
                                $scope.unLoadOnScroll = $scope.unLoadOnScroll === undefined ? false : $scope.unLoadOnScroll;
                                populateLazyElemsFn(objOfOnLoadImgElems);
                            }
    
                            $timeout.cancel(loadTimeoutId);
                            loadTimeoutId = $timeout(executeWhenAllLoaded, 300);
                        }
                    ],
                    link: function postLink(scope, element, attrs) {}
                };
    
            function getDocumentHeight() {
                var body = document.body,
                    html = document.documentElement,
                    height = Math.max(body.scrollHeight, body.offsetHeight,
                        html.clientHeight, html.scrollHeight, html.offsetHeight);
    
                return height;
            }
    
            function setImageIfInViewportFn(obj, forceLoad) {
                var doc = document.documentElement,
                    $windowScrollTop = ($window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0),
                    $windowHeight = window.outerHeight,
                    $documentHeight = getDocumentHeight(),
                    arrOfPrevDisplayedElementsCopy = arrOfPrevDisplayedElements;
    
                arrOfPrevDisplayedElements = [];
                arrOfPrevDisplayedElementsCopy.forEach(function(item, index) {
                    var eachElemClientRect = item.elem[0].getBoundingClientRect(),
                        $elementOffsetTop = eachElemClientRect.top +
                        ($windowScrollTop - $windowHeight),
                        offsetTop = (eachElemClientRect.height !== 0 ? $elementOffsetTop : $documentHeight + 10);
                    if ((offsetTop < $windowScrollTop - $windowHeight - eachElemClientRect.height) || offsetTop > $windowScrollTop) {
                        item.scope.loaded = false;
                    }
                });
                for (var a in obj) {
                    var eachBlock = obj[a];
                    for (var i = 0, len = eachBlock.length; i < len; i++) {
                        var img = document.createElement('img');
                        img.src = eachBlock[i].scope.imgsrc;
                        img.onload = function(eachElem) {
                            if (eachElem.scope.unLoadOnScroll) {
                                arrOfPrevDisplayedElements.push(eachElem);
                            }
                            return function() {
                                eachElem.that.imgsrc = eachElem.scope.imgsrc;
                                eachElem.scope.loaded = true;
                                eachElem.scope.$digest();
                            }
                        }(eachBlock[i]);
    
                        img.onerror = function(eachElem) {
                            return function() {
                                eachElem.scope.loaded = true;
                                eachElem.scope.$digest();
                            }
                        }(eachBlock[i]);
                    }
                }
            }
    
            function addValueToObjArrProp(obj, prop, value) {
                if (obj[prop] === undefined) {
                    obj[prop] = [];
                }
    
                obj[prop].push(value);
            }
    
            function recalculateOffsetFn() {
                var lazyObjCopy = objOfLazyImgElems,
                    doc = document.documentElement,
                    $windowScrollTop = ($window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0),
                    $windowHeight = window.outerHeight,
                    $documentHeight = getDocumentHeight();
                objOfLazyImgElemsInViewport = {};
                objOfLazyImgElems = {};
    
                for (var a in lazyObjCopy) {
                    var eachObj = lazyObjCopy[a];
                    for (var i = 0, len = eachObj.length; i < len; i++) {
                        var eachElem = eachObj[i],
                            eachElemClientRect = eachElem.elem[0].getBoundingClientRect(),
                            $elementOffsetTop = eachElemClientRect.top +
                            ($windowScrollTop - $windowHeight),
                            offsetTop = (eachElemClientRect.height !== 0 ? $elementOffsetTop : $documentHeight + 10),
                            newEachElemObj = {
                                'that': eachElem.that,
                                'scope': eachElem.scope,
                                'elem': eachElem.elem
                            };
    
                        addValueToObjArrProp(objOfLazyImgElems, offsetTop, newEachElemObj);
    
                        if ((offsetTop >= $windowScrollTop - $windowHeight - eachElemClientRect.height) && offsetTop < $windowScrollTop) {
                            addValueToObjArrProp(objOfLazyImgElemsInViewport, offsetTop, newEachElemObj);
                        }
                    }
                }
            }
    
            function executeWhenAllLoaded() {
                setImageIfInViewportFn(objOfOnLoadImgElems, true);
                recalculateOffsetFn();
                setImageIfInViewportFn(objOfLazyImgElemsInViewport, false);
            }
    
            window.addEventListener('scroll', function() {
                $timeout.cancel(scrollTimeoutId);
                scrollTimeoutId = $timeout(function() {
                    recalculateOffsetFn();
                    setImageIfInViewportFn(objOfLazyImgElemsInViewport, false);
                }, 300);
            }, false);
    
            window.addEventListener('resize', function() {
                $timeout.cancel(resizeTimeoutId);
                resizeTimeoutId = $timeout(function() {
                    recalculateOffsetFn();
                    setImageIfInViewportFn(objOfLazyImgElemsInViewport, false);
                }, 300);
            }, false);
    
            $rootScope.$on('trigger.lazyload', function(e) {
                $timeout(function() {
                    recalculateOffsetFn();
                    setImageIfInViewportFn(objOfLazyImgElemsInViewport, false);
                }, 300);
            });
    
            return ngLazyLoadImg;
        }]);
}(window, document);

