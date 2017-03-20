# stickystack

Vanilla Javascript implementation allowing multiple sticky elements, accounting for horizontal offsets and with options for "semi" stickyness, and mobile skipping.

## Installation

Just include `stickystack.js` in your page's javascript, and add appropriate classes to the HTML elements you want to be sticky. (The script registers a handler which fires on page load to initialise the elements, and on resize to recalculate if necessary.)

## Usage

Apply appropriate styles to the elements you want to be involved with the stickyness:

* `js-stickystack` -- Elements that should become sticky instead of scrolling offscreen

* `js-stickystack-top` -- The element whose top edge should be considered the point at which stickyness begins. This allows external toolbars and other elements that may have other stickyness to remain visible. (Can be applied to an element without the `js-stickystack` class.)

### Modifiers

Elements with the `js-stickystack`can be further modified by adding the classes below.

* `js-stickystack-semi` -- Elements that will stick until pushed offscreen by another sticky element

* `js-stickystack-nomobile` -- Elements that will not be sticky on smaller screens. (Currently hard-coded to <= 768px.)

## How it works

More detail coming soon, but basically it gathers a list of sticky HTML elements based on class, creates a set of placeholders that get actived when the respective element is taken out of the layout flow by assigning `position: fixed;`, and assigns CSS `top` and `z-index` values based on page scroll and the stickystack heirarchy.

"Stuck" elements get class `stickystack-stuck` added to them (and removed when they become unstuck) making it simple to apply theming changes when an element becomes stuck.
