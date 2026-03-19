/* ============================================================
   AVINASH & ASSOCIATES — js/utils.js
   Shared DOM utility functions (loaded first)
   ============================================================ */

'use strict';

/* Shorthand selectors — available globally across all JS files */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
