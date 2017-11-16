'use strict';

/*!
 * Jessel John - May, 04, 2014 - present
 * https://github.com/JesselJohn
 * MIT Licence
 */
! function(window, document, angular, undefined) {
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
                    scrollTimeoutId,
                    ngLazyLoadImg = {
                        scope: {
                            'defaultImage': '=?',
                            'imgsrc': '=',
                            'loadOffsetTop': '=?',
                            'loadOffsetLeft': '=?',
                            'onWinLoad': '=?',
                            'isImageLoaded': "=?",
                            'imageOnSet': "&",
                            'imageInViewport': "&",
                            'elemWidth': "=?",
                            'elemHeight': "=?"
                        },
                        require: "^?ngLazyLoadImgParent",
                        replace: true,
                        bindToController: true,
                        template: function(elem, attrs) {
                            return attrs.elemType == 'img' ?
                                "<img class='lazy-img' ng-src=\"{{tyShow.loaded && !tyShow.imgError && tyShow.imgsrc || tyShow.imgsrcRef}}\" ng-class=\"{'show':tyShow.loaded}\"></img>" :
                                "<div class='lazy-img' ng-style=\"{'background-image':'url('+(tyShow.loaded && !tyShow.imgError && tyShow.imgsrc || tyShow.imgsrcRef)+')'}\" ng-class=\"{'show':tyShow.loaded}\"></div>";
                        },
                        restrict: 'E',
                        controllerAs: 'tyShow',
                        controller: ['$scope', '$element',
                            function($scope, $element) {
                                var self = this;

                                $scope.self = self;
                                throwErrorsInPassedValuesFn(
                                    self.onWinLoad,
                                    self.preventLazyInview,
                                    self.loadOffsetTop,
                                    self.loadOffsetLeft,
                                    self.elemWidth,
                                    self.elemHeight
                                );
                            }
                        ],
                        link: function postLink(scope, element, attrs, ngLazyLoadImgParent) {
                            var item = {
                                'scope': scope,
                                'self': scope.self,
                                'elem': element
                            };

                            scope.self.parentViewport = ngLazyLoadImgParent && ngLazyLoadImgParent.elem ||
                                null;

                            scope.$$postDigest(function() {
                                if (isImageInViewPortFn(item, getWindowValuesFn())) {
                                    loadItemFn(item);
                                }
                            });

                            if (scope.self.onWinLoad) {
                                // Load Items needed to be loaded initially
                                loadItemFn(item);
                            } else {
                                // Push items to be tracked if its in viewport in array
                                arrOfLazyImgElems.push(item);
                                // Untrack item if scope destroyed
                                scope.$on('$destroy', function() {
                                    removeItemFromArrayFn(arrOfLazyImgElems, item);
                                });
                            }
                        }
                    };

                function checkBool(val) {
                    return typeof val === 'boolean' ||
                        (typeof val === 'object' &&
                            val !== null &&
                            typeof val.valueOf() === 'boolean');
                }

                function checkNum(val) {
                    return !isNaN(parseInt(val, 10));
                }

                function throwErrorFn(err) {
                    throw Error(err);
                }

                function throwErrorsInPassedValuesFn(
                    onWinLoad,
                    preventLazyInview,
                    loadOffsetTop,
                    loadOffsetLeft,
                    elemWidth,
                    elemHeight
                ) {
                    var ERROR_PREFIX = "`ngLazyLoadImg` directive : ";
                    if (onWinLoad !== undefined && !checkBool(onWinLoad)) {
                        throwErrorFn(ERROR_PREFIX + "Passed values of loadOffsetTop & loadOffsetLeft should be numbers");
                    }

                    if (preventLazyInview !== undefined && !checkBool(preventLazyInview)) {
                        throwErrorFn(ERROR_PREFIX + "Passed values of loadOffsetTop & loadOffsetLeft should be numbers");
                    }

                    if (loadOffsetTop !== undefined && !checkNum(loadOffsetTop) ||
                        loadOffsetLeft !== undefined && !checkNum(loadOffsetLeft)) {
                        throwErrorFn(ERROR_PREFIX + "Passed values of loadOffsetTop & loadOffsetLeft should be numbers");
                    }

                    if (elemWidth !== undefined && !checkNum(elemWidth) ||
                        elemHeight !== undefined && !checkNum(elemHeight)) {
                        throwErrorFn(ERROR_PREFIX + "Passed values of elemWidth & elemHeight should be numbers");
                    }
                }

                function removeItemFromArrayFn(arr, item) {
                    var index = arr.findIndex(i => i === item);
                    if (index > -1) {
                        arr.splice(arr.findIndex(i => i === item), 1);
                    }
                }

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

                function triggerImageInViewportFn(obj, bypassCondition) {
                    var isInView = isImageInViewPortFn(obj.item, obj.windowValues);
                    if (isInView || bypassCondition) {
                        obj.item.self.imageInViewport({
                            item: obj.item,
                            // Boolean value. `true` if image in view
                            isInView: isInView,
                            // Boolean value to track image failure. `true` if image load failed
                            error: obj.error
                        });
                    }
                }

                function triggerLocalDigestFn(scope) {
                    if (!$rootScope.$$phase && !scope.$$phase) {
                        scope.$digest();
                    }
                }

                function triggerGlobalDigestFn() {
                    $timeout.cancel(timeoutId);
                    timeoutId = $timeout(function() {
                        $timeout(angular.noop);
                    }, 300, false);
                }

                function loadItemFn(item) {
                    if (!item.self.imgsrc) {
                        item.self.imgsrcRef = item.self.defaultImage;
                        item.self.loaded = true;
                        item.self.imgError = false;
                        item.self.isImageLoaded = true;
                        item.self.isImageLoadedTracker = true;
                        triggerImageInViewportFn({
                            item: item,
                            windowValues: getWindowValuesFn(),
                            error: false
                        }, true);
                        triggerGlobalDigestFn();
                        return;
                    }

                    if (!item.self.loaded) {
                        item.self.imgsrcRef = item.self.imgsrc;
                        item.self.loaded = true;
                        item.self.imageOnSet({
                            item: item
                        });

                        item.elem[0].onload = function(e) {
                            if (item.self.imgsrcRef == item.self.defaultImage) {
                                return;
                            }
                            item.self.isImageLoaded = true;
                            item.self.isImageLoadedTracker = true;
                            item.self.imgError = false;
                            triggerImageInViewportFn({
                                item: item,
                                windowValues: getWindowValuesFn(),
                                error: false
                            }, true);
                            triggerGlobalDigestFn();
                        };
                        item.elem[0].onerror = function(e) {
                            item.self.isImageLoaded = true;
                            item.self.isImageLoadedTracker = true;
                            item.self.imgError = true;
                            item.self.imgsrcRef = item.self.defaultImage;
                            triggerImageInViewportFn({
                                item: item,
                                windowValues: getWindowValuesFn(),
                                error: true
                            }, true);
                            triggerGlobalDigestFn();
                        };
                    }

                    triggerLocalDigestFn(item.scope);
                }

                function isImageInViewPortFn(item, windowValues, loadOffsetTop = 0, loadOffsetLeft = 0) {
                    var box = item.elem[0].getBoundingClientRect();

                    var loadOffsetTopAbs = Math.abs(parseInt(loadOffsetTop, 10)),
                        loadOffsetLeftAbs = Math.abs(parseInt(loadOffsetLeft, 10));

                    var $elementTop = getCoords(item.elem[0]).top - loadOffsetTopAbs,
                        $elementLeft = getCoords(item.elem[0]).left - loadOffsetLeftAbs;

                    var passedWidth = item.self.elemWidth !== undefined && parseInt(item.self.elemWidth, 10) || 1,
                        passedHeight = item.self.elemHeight !== undefined && parseInt(item.self.elemHeight, 10) || 1,
                        elemHeight = passedWidth !== undefined && passedHeight !== undefined ?
                        box.width * passedHeight / passedWidth :
                        box.height;

                    var $elementBottom = $elementTop + elemHeight + (loadOffsetTopAbs * 2),
                        $elementRight = $elementLeft + box.width + (loadOffsetLeftAbs * 2);

                    var parentViewportBox,
                        $viewportTop, $viewportLeft, $viewportBottom, $viewportRight, $viewportRight,
                        isVisibleInParentViewport = true;

                    if (item.self.parentViewport !== null) {
                        parentViewportBox = item.self.parentViewport[0].getBoundingClientRect();

                        $viewportTop = getCoords(item.self.parentViewport[0]).top;
                        $viewportLeft = getCoords(item.self.parentViewport[0]).left;
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

                function setImageIfInViewportFn() {
                    var windowValues = getWindowValuesFn(),
                        arrOfLoadedElems = [];
                    arrOfLazyImgElems.forEach(function(item, index) {
                        var isCompletelyInView = isImageInViewPortFn(item, windowValues);
                        if ((isImageInViewPortFn(item, windowValues, item.self.loadOffsetTop, item.self.loadOffsetLeft) || isCompletelyInView) && !item.self.loaded) {
                            loadItemFn(item);
                        } else if (item.self.isImageLoadedTracker && !item.self.imgError) {
                            triggerImageInViewportFn({
                                item,
                                windowValues,
                                error: false
                            });
                        }
                        if (isCompletelyInView) {
                            arrOfLoadedElems.push(item);
                        }
                    });
                    arrOfLoadedElems.forEach(function(item, index) {
                        // If image loaded remove item from tracking array
                        removeItemFromArrayFn(arrOfLazyImgElems, item);
                    });
                    triggerGlobalDigestFn();
                }

                function setImageForElemsInArrayFn() {
                    $window.cancelAnimationFrame(animationFrameTimeoutId);
                    animationFrameTimeoutId = $window.requestAnimationFrame(setImageIfInViewportFn);
                }

                window.addEventListener('scroll', function() {
                    $timeout.cancel(scrollTimeoutId);
                    scrollTimeoutId = $timeout(setImageForElemsInArrayFn, 10, false);
                }, false);

                $rootScope.$on('trigger.ngLazyImg', function(event, timeout = 0) {
                    $timeout(setImageForElemsInArrayFn, timeout);
                });

                return ngLazyLoadImg;
            }
        ]);
}(window, document, angular);
