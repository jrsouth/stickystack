'use strict';

/* @preserve
 *
 * StickyStack
 *
 * A vanilla javascript sticky-element stacker
 *
 * For licence details and usage see:
 * https://github.com/jrsouth/stickystack
 *
 */

(function () {
    "use strict";

    var StickyStack = {

        mobileBreak: 768,
        list: [],
        number: 0,
        stackTop: 0,
        pageBottom: null,

        init: function init() {

            StickyStack.stopObserving();

            // Clean up if init already run
            if (StickyStack.pageBottom) {
                StickyStack.pageBottom.parentNode.removeChild(StickyStack.pageBottom);
            }

            for (var i = 0; i < StickyStack.number; i++) {

                var placeholder = StickyStack.list[i].placeholder;
                var currElement = StickyStack.list[i].element;

                placeholder.parentNode.removeChild(placeholder);
                StickyStack.removeClass(currElement, 'stickystack-stuck');

                currElement.style.position = null;
                currElement.style.top = null;
                currElement.style.left = null;
                currElement.style.width = null;
                currElement.style.marginTop = null;
                currElement.style.marginBottom = null;
            }

            // Create element to push bottom of the page up

            //        <div style="height:0;width:100%;" class="js-stickystack"></div>

            StickyStack.pageBottom = document.createElement('div');
            StickyStack.pageBottom.style.height = 0;
            StickyStack.pageBottom.style.width = "100%";
            StickyStack.addClass(StickyStack.pageBottom, "js-stickystack");

            document.body.appendChild(StickyStack.pageBottom);

            // Reset StickyStack.number
            StickyStack.number = 0;

            // Get elements with 'js-stickystack' class
            var elementList = document.getElementsByClassName('js-stickystack');

            // If on a small screen, strip out elements marked
            // to _not_ stick on mobile (js-stickystack-nomobile)
            // TODO: Dynamically load/assign mobile breakpoint
            if (window.innerWidth <= StickyStack.mobileBreak) {
                var newElementList = [];
                for (var _i = 0; _i < elementList.length; _i++) {
                    if (!StickyStack.hasClass(elementList[_i], 'js-stickystack-nomobile')) {
                        newElementList.push(elementList[_i]);
                    }
                }
                elementList = newElementList;
            }

            StickyStack.number = elementList.length;
            StickyStack.list = [];
            StickyStack.stackTop = 0;

            for (var _i2 = 0; _i2 < StickyStack.number; _i2++) {

                // Get element's computed style
                // Used both to set up the placeholder and to get needed list[] values
                var style = window.getComputedStyle(elementList[_i2]);

                // Create placeholder block element, replicating all
                // layout-affecting properties of the sticky element
                var placeholderElement = document.createElement('div');
                placeholderElement.style.width = style.getPropertyValue("width");
                placeholderElement.style.height = style.getPropertyValue("height");
                placeholderElement.style.top = style.getPropertyValue("top");
                placeholderElement.style.right = style.getPropertyValue("right");
                placeholderElement.style.bottom = style.getPropertyValue("bottom");
                placeholderElement.style.left = style.getPropertyValue("left");
                placeholderElement.style.margin = style.getPropertyValue("margin");
                placeholderElement.style.padding = style.getPropertyValue("padding");
                placeholderElement.style.border = style.getPropertyValue("border");
                placeholderElement.style.float = style.getPropertyValue("float");
                placeholderElement.style.clear = style.getPropertyValue("clear");
                placeholderElement.style.position = style.getPropertyValue("position");

                // Hide the placeholder until it's needed
                // And have it invisible even when it IS needed
                placeholderElement.style.display = 'none';
                placeholderElement.style.visibility = 'hidden';

                // Add it to the DOM, immediately before the sticky element
                elementList[_i2].parentNode.insertBefore(placeholderElement, elementList[_i2]);

                var coords = StickyStack.getCoords(elementList[_i2]);

                StickyStack.list.push({
                    element: elementList[_i2],
                    top: coords.top,
                    left: coords.left - parseFloat(style.getPropertyValue("margin-left")),
                    width: parseFloat(style.getPropertyValue("width")),
                    placeholder: placeholderElement,
                    semistuck: StickyStack.hasClass(elementList[_i2], 'js-stickystack-semi'),
                    zIndex: 100 - _i2
                });
            }

            // Sort the list top down
            StickyStack.list.sort(StickyStack.sortByTop);

            // Set the stack top to (the top of) the highest-placed element
            // with the js-stickystack-top class. Note that this element
            // does not have to be sticky itself (otherwise we could just use the
            // existing vertically-sorted list).
            //
            // This allows other sticky elements (admin toolbars etc.) to
            // peacefully co-exist with StickyStack.
            //
            // Defaults to 0 (the top of the viewport) if no elements are found.

            StickyStack.stackTop = 0;

            elementList = document.getElementsByClassName('js-stickystack-top');
            for (var _i3 = 0; _i3 < elementList.length; _i3++) {
                var top = StickyStack.getCoords(elementList[_i3]).top;
                if (_i3 == 0) {
                    StickyStack.stackTop = top;
                } else {
                    StickyStack.stackTop = Math.min(StickyStack.stackTop, top);
                }
            }

            // Fire the initial calculation
            StickyStack.update();
            StickyStack.startObserving();
        },

        update: function update() {

            var stack = [[StickyStack.stackTop, 0, document.body.offsetWidth]];
            var pageOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

            for (var i = 0; i < StickyStack.number; i++) {

                var curr = StickyStack.list[i];

                var currElement = curr.element;
                var currPlaceholder = curr.placeholder;
                var currLeft = curr.left;
                var currTop = curr.top - pageOffset;
                var currWidth = curr.width;

                var overlapData = StickyStack.getOverlap([currTop, currLeft, currWidth], stack);

                if (overlapData.overlap > 0) {

                    currPlaceholder.style.display = 'block';

                    StickyStack.addClass(currElement, 'stickystack-stuck');

                    var scrollback = 0;

                    // Semi-sticky handling

                    // Only bother if this element is "semistuck" and there are
                    // further elements in the list.
                    if (StickyStack.list[i].semistuck && i + 1 < StickyStack.number) {

                        var tempStack = [[overlapData.absolute + currElement.offsetHeight, currLeft, currWidth]];

                        // Check each following element for collision/overlap
                        for (var j = i + 1; j < StickyStack.number; j++) {

                            var testBlock = [StickyStack.list[j].top - pageOffset, StickyStack.list[j].left, StickyStack.list[j].width];
                            var overlapSemiData = StickyStack.getOverlap(testBlock, tempStack);

                            if (overlapSemiData.overlap > 0) {
                                scrollback = overlapSemiData.overlap;
                                break;
                            }
                        }
                    }

                    currElement.style.position = 'fixed';
                    currElement.style.top = overlapData.absolute - scrollback + 'px';
                    currElement.style.left = currLeft + 'px';
                    currElement.style.width = currWidth + 'px';
                    currElement.style.zIndex = curr.zIndex;
                    currElement.style.marginTop = 0;
                    currElement.style.marginBottom = 0;

                    stack.push([overlapData.absolute + currElement.offsetHeight - scrollback, currElement.offsetLeft, currElement.offsetWidth]);
                } else {

                    StickyStack.removeClass(currElement, 'stickystack-stuck');

                    currElement.style.position = null;
                    currElement.style.top = null;
                    currElement.style.left = null;
                    currElement.style.width = null;
                    currElement.style.zIndex = null;
                    currElement.style.marginTop = null;
                    currElement.style.marginBottom = null;

                    currPlaceholder.style.display = 'none';
                }
            }
        },

        startObserving: function startObserving() {

            // If there's no existing MutationObserver object, create one to
            // trigger a recalulation on changes in the sticky elements.
            // If there is one, stop it.
            if (!StickyStack.observer) {
                var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
                StickyStack.observer = new MutationObserver(StickyStack.init);
            } else {
                StickyStack.observer.disconnect();
            }

            // Since any change to the document might require a re-layout, observe EVERYTHING
            // TODO: Check performance penalty, if any.
            StickyStack.observer.observe(document.body, {
                attributes: true,
                characterData: true,
                subtree: true
            });
        },

        stopObserving: function stopObserving() {
            if (StickyStack.observer) {
                StickyStack.observer.disconnect();
            }
        },

        getOverlap: function getOverlap(block, stack) {
            var overlap = 0;
            var absolute = 0;
            for (var i = 0; i < stack.length; i++) {
                if (block[0] < stack[i][0] && block[1] + block[2] > stack[i][1] && stack[i][1] + stack[i][2] > block[1]) {
                    overlap = Math.max(overlap, stack[i][0] - block[0]);
                    absolute = Math.max(absolute, stack[i][0]);
                }
            }
            return { overlap: overlap, absolute: absolute };
        },

        sortByTop: function sortByTop(a, b) {
            return a.top - b.top;
        },

        getCoords: function getCoords(el) {
            // From http://stackoverflow.com/a/26230989

            var box = el.getBoundingClientRect();

            var body = document.body;
            var docEl = document.documentElement;

            var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

            var clientTop = docEl.clientTop || body.clientTop || 0;
            var clientLeft = docEl.clientLeft || body.clientLeft || 0;

            var top = box.top + scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;

            return { top: Math.round(top), left: Math.round(left) };
        },

        // Helper-functions pilfered wholesale from
        // http://jaketrent.com/post/addremove-classes-raw-javascript/

        hasClass: function hasClass(el, className) {
            if (el.classList) {
                return el.classList.contains(className);
            } else {
                return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
            }
        },

        addClass: function addClass(el, className) {
            if (el.classList) {
                el.classList.add(className);
            } else if (!StickyStack.hasClass(el, className)) {
                el.className += " " + className;
            }
        },

        removeClass: function removeClass(el, className) {
            if (el.classList) {
                el.classList.remove(className);
            } else if (StickyStack.hasClass(el, className)) {
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                el.className = el.className.replace(reg, ' ');
            }
        }

    };

    // Set up listeners to fire on load
    window.addEventListener('DOMContentLoaded', StickyStack.init);
    window.addEventListener('load', StickyStack.init);
    window.addEventListener('resize', StickyStack.init);

    // Set up listeners to fire on scroll
    window.addEventListener('scroll', StickyStack.update);
    window.addEventListener('touchmove', StickyStack.update);

    // Add a hacky empty function to cause iOS to update the scroll offset value while scrolling
    // Still doesn't update during momentum scrolling
    // From https://remysharp.com/2012/05/24/issues-with-position-fixed-scrolling-on-ios/
    // TODO: Check if needed now that touchmove event has update() attached
    window.ontouchstart = function () {};

    // Trigger delayed extra recalculations, in case elements change
    // size as a result of the first init() call.
    window.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            StickyStack.update();
        }, 500);
    });
    window.addEventListener('load', function () {
        setTimeout(function () {
            StickyStack.update();
        }, 500);
    });
})();
