'use strict';

/*!
 * Jessel John - May, 04, 2014
 * https://github.com/JesselJohn
 * MIT Licence
 */
! function(window, document, undefined) {
    angular.module('ngLazyImg', [])
        .directive('ngLazyLoadImgParent', [function() {
            var ngLazyLoadImgParent = {
                restrict: 'A',
                controller: ['$element',
                    function($element) {
                        var self = this;

                        self.elem = $element;
                    }
                ]
            };

            return ngLazyLoadImgParent;
        }])
        .directive('ngLazyLoadImg', [
            '$window',
            '$rootScope',
            '$timeout',
            function(
                $window,
                $rootScope,
                $timeout
            ) {
                var arrOfLazyImgElems = [],
                    animationFrameTimeoutId,
                    timeoutId,
                    ngLazyLoadImg = {
                        scope: {
                            'defaultImage': '=?',
                            'imgsrc': '=',
                            'onWinLoad': '=?',
                            'isImageLoaded': "=",
                            'imageInViewport': "&",
                            'elemWidth': "=?",
                            'elemHeight': "=?"
                        },
                        require: "^?ngLazyLoadImgParent",
                        replace: true,
                        bindToController: true,
                        template: function(elem, attrs) {
                            return attrs.elemType == 'img' ?
                                "<img class='lazy-img' ng-src=\"{{tyShow.imgsrc}}\" ng-class=\"{'show':tyShow.loaded}\"></img>" :
                                "<div class='lazy-img' ng-style=\"{'background-image':'url('+tyShow.imgsrc+')'}\" ng-class=\"{'show':tyShow.loaded}\"></div>";
                        },
                        restrict: 'E',
                        controllerAs: 'tyShow',
                        controller: ['$scope', '$element',
                            function($scope, $element) {
                                var self = this;

                                self.imgsrcRef = self.imgsrc;
                                self.imgsrc = null;
                                $scope.self = self;
                            }
                        ],
                        link: function postLink(scope, element, attrs, ngLazyLoadImgParent) {
                            var item = {
                                'scope': scope.self,
                                'elem': element
                            };

                            scope.self.parentViewport = ngLazyLoadImgParent && ngLazyLoadImgParent.elem ||
                                null;

                            if (scope.onWinLoad) {
                                loadItemFn(item, getWindowValuesFn());
                            } else {
                                arrOfLazyImgElems.push(item);
                            }
                        }
                    };

                function getWindowValuesFn() {
                    var doc = document.documentElement;

                    var $windowScrollTop = ($window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0),
                        $windowScrollLeft = ($window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
                        $windowScrollBottom = $windowScrollTop + $window.innerHeight,
                        $windowScrollRight = $windowScrollLeft + $window.innerWidth;

                    return {
                        top: $windowScrollTop,
                        right: $windowScrollRight,
                        bottom: $windowScrollBottom,
                        left: $windowScrollLeft
                    };
                }

                function getCoords(elem) { // crossbrowser version
                    var box = elem.getBoundingClientRect();

                    var body = document.body,
                        docEl = document.documentElement;

                    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop,
                        scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

                    var clientTop = docEl.clientTop || body.clientTop || 0,
                        clientLeft = docEl.clientLeft || body.clientLeft || 0;

                    var top = box.top + scrollTop - clientTop,
                        left = box.left + scrollLeft - clientLeft;

                    return {
                        top: Math.round(top),
                        left: Math.round(left)
                    };
                }

                function triggerImageInViewportFn(item, windowValues) {
                    if (isImageInViewPortFn(item, windowValues)) {
                        item.scope.imageInViewport({
                            item: item
                        });
                    }
                }

                function triggerGlobalDigestFn() {
                    $timeout.cancel(timeoutId);
                    timeoutId = $timeout(function() {
                        $timeout(angular.noop);
                    }, 300, false);
                }

                function loadItemFn(item, windowValues) {
                    if (!item.scope.imgsrcRef) {
                        return;
                    }
                    item.scope.imgsrc = item.scope.imgsrcRef;
                    item.scope.loaded = true;
                    if (!item.scope.isImageLoaded) {
                        item.elem[0].onload = function(e) {
                            item.scope.isImageLoaded = true;
                            triggerImageInViewportFn(item, windowValues);
                            triggerGlobalDigestFn();
                        };
                        item.elem[0].onerror = function(e) {
                            item.scope.isImageLoaded = true;
                            item.scope.imgsrc = item.scope.defaultImage;
                            triggerImageInViewportFn(item, windowValues);
                            triggerGlobalDigestFn();
                        };
                    } else {
                        triggerImageInViewportFn(item, windowValues);
                    }
                    triggerGlobalDigestFn();
                }

                function isImageInViewPortFn(item, windowValues) {
                    var box = item.elem[0].getBoundingClientRect();

                    var $elementTop = getCoords(item.elem[0]).top,
                        $elementLeft = getCoords(item.elem[0]).left;

                    var passedWidth = item.scope.elemWidth !== undefined && parseInt(item.scope.elemWidth, 10) || 1,
                        passedHeight = item.scope.elemHeight !== undefined && parseInt(item.scope.elemHeight, 10) || 1,
                        elemHeight = passedWidth !== undefined && passedHeight !== undefined ?
                        box.width * passedHeight / passedWidth :
                        box.height;

                    var $elementBottom = $elementTop + elemHeight,
                        $elementRight = $elementLeft + box.width;

                    var parentViewportBox,
                        $viewportTop, $viewportLeft, $viewportBottom, $viewportRight, $viewportRight,
                        isVisibleInParentViewport = true;

                    if (item.scope.parentViewport !== null) {
                        parentViewportBox = item.scope.parentViewport[0].getBoundingClientRect();

                        $viewportTop = getCoords(item.scope.parentViewport[0]).top;
                        $viewportLeft = getCoords(item.scope.parentViewport[0]).left;
                        $viewportBottom = $viewportTop + parentViewportBox.height;
                        $viewportRight = $viewportLeft + parentViewportBox.width;

                        isVisibleInParentViewport = (
                                $elementTop >= $viewportTop && $elementTop < $viewportBottom ||
                                $elementBottom <= $viewportBottom && $elementBottom > $viewportTop
                            ) &&
                            (
                                $elementLeft >= $viewportLeft && $elementLeft < $viewportRight ||
                                $elementRight <= $viewportRight && $elementRight > $viewportLeft
                            );
                    }

                    return isVisibleInParentViewport &&
                        ($elementTop - windowValues.top >= 0 && $elementTop - windowValues.bottom < 0 ||
                            $elementBottom - windowValues.top > 0 && $elementBottom - windowValues.bottom <= 0 ||
                            $elementTop <= windowValues.top && $elementBottom >= windowValues.bottom) &&
                        ($elementLeft - windowValues.left >= 0 && $elementLeft - windowValues.right < 0 ||
                            $elementRight - windowValues.left > 0 && $elementRight - windowValues.right <= 0 ||
                            $elementLeft <= windowValues.left && $elementRight >= windowValues.right);
                }

                function setImageForElemsInArrayFn(arr) {
                    var windowValues = getWindowValuesFn(),
                        i = 0,
                        reqAnimationFn = function() {
                            var item = arr[i++];
                            if (!item) {
                                return;
                            }
                            if (isImageInViewPortFn(item, windowValues)) {
                                loadItemFn(item, windowValues);
                            }
                            animationFrameTimeoutId = $window.requestAnimationFrame(reqAnimationFn);
                        };


                    return reqAnimationFn;
                }

                function setImageIfInViewportFn(arr) {
                    var sIFEIA = setImageForElemsInArrayFn(arr);
                    $window.cancelAnimationFrame(animationFrameTimeoutId);
                    animationFrameTimeoutId = $window.requestAnimationFrame(sIFEIA);
                }

                window.addEventListener('scroll', function() {
                    setImageIfInViewportFn(arrOfLazyImgElems, false);
                }, false);

                $rootScope.$on('trigger.ngLazyImg', function() {
                    setImageIfInViewportFn(arrOfLazyImgElems, false);
                });

                return ngLazyLoadImg;
            }
        ]);
}(window, document);
