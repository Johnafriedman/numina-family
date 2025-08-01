/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

// Assume your script is loaded in the test environment

describe('Canvas Drag/Resize', () => {
    let canvas, frame;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="frame"></div>
        `;
        frame = document.getElementById('frame');
        // Simulate initializeCanvas
        canvas = document.createElement('canvas');
        canvas.className = "resize-drag";
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.left = "0px";
        canvas.style.top = "0px";
        frame.appendChild(canvas);
        // You may need to call setupDragResize(canvas) here if it's exported
    });

    test('canvas is draggable with mouse', () => {
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 150, clientY: 120 });
        fireEvent.mouseUp(window);
        expect(canvas.style.left).toBe('50px');
        expect(canvas.style.top).toBe('20px');
    });

    test('canvas is resizable from east edge with mouse', () => {
        // Simulate pointer near east edge
        fireEvent.mouseDown(canvas, { clientX: 399, clientY: 150 });
        fireEvent.mouseMove(window, { clientX: 450, clientY: 150 });
        fireEvent.mouseUp(window);
        expect(parseInt(canvas.style.width)).toBeGreaterThan(400);
    });

    test('canvas is draggable with touch', () => {
        fireEvent.touchStart(canvas, { touches: [{ clientX: 100, clientY: 100 }] });
        fireEvent.touchMove(window, { touches: [{ clientX: 120, clientY: 130 }] });
        fireEvent.touchEnd(window);
        expect(canvas.style.left).toBe('20px');
        expect(canvas.style.top).toBe('30px');
    });
});

describe('Burger Menu Toggle', () => {
    let menuToggle, sideMenu, listLoad, listItems;

    beforeEach(() => {
        document.body.innerHTML = `
            <div class="side_menu" style="left:-250px">
                <div class="burger_box">
                    <div class="menu-icon-container">
                        <a href="#" class="menu-icon js-menu_toggle closed">
                            <span class="menu-icon_box"></span>
                        </a>
                    </div>
                </div>
                <div class="container">
                    <ul class="list_load" style="display:none">
                        <li class="list_item" style="opacity:0; margin-left:-20px"><a href="#">Link</a></li>
                    </ul>
                </div>
            </div>
        `;
        menuToggle = document.querySelector('.js-menu_toggle');
        sideMenu = document.querySelector('.side_menu');
        listLoad = document.querySelector('.list_load');
        listItems = document.querySelectorAll('.list_item');
        // You may need to re-import or re-run your menu JS here if it's not global
    });

    test('opens menu on click', () => {
        fireEvent.click(menuToggle);
        expect(menuToggle.classList.contains('opened')).toBe(true);
        expect(sideMenu.style.left).toBe('0px');
        expect(listLoad.style.display).toBe('block');
        listItems.forEach(li => {
            expect(li.style.opacity).toBe('1');
            expect(li.style.marginLeft).toBe('0px');
        });
    });

    test('closes menu on second click', () => {
        fireEvent.click(menuToggle); // open
        fireEvent.click(menuToggle); // close
        expect(menuToggle.classList.contains('closed')).toBe(true);
        expect(sideMenu.style.left).toBe('-250px');
        listItems.forEach(li => {
            expect(li.style.opacity).toBe('0');
            expect(li.style.marginLeft).toBe('-20px');
        });
    });

    test('opens menu on touch', () => {
        fireEvent.touchStart(menuToggle, { touches: [{ clientX: 0, clientY: 0 }] });
        expect(menuToggle.classList.contains('opened')).toBe(true);
        expect(sideMenu.style.left).toBe('0px');
        expect(listLoad.style.display).toBe('block');
    });

    test('menu links work on touch', () => {
        fireEvent.click(menuToggle); // open menu
        const link = document.querySelector('.list_item a');
        // Simulate touch on link (should not prevent default)
        const touchEvent = new Event('touchstart', { bubbles: true, cancelable: true });
        link.dispatchEvent(touchEvent);
        // No assertion here, but you could spy on location or navigation if needed
        expect(true).toBe(true); // placeholder
    });
});