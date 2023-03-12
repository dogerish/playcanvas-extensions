// ==UserScript==
// @name        PlayCanvas Hierarchy Tree Extension
// @namespace   PlayCanvas Scripts
// @match       *://playcanvas.com/editor/scene/*
// @grant       none
// @version     1.0
// @author      -
// @description Extends tree functionality in PlayCanvas.
// ==/UserScript==

function getSelection()
{
    let selection = editor.call('selector:items');
    let entity = editor.call('entities:contextmenu:entity');
    return selection.includes(entity) ? selection : [entity];
}

function setStates(ents, val)
{
    for (let e of ents)
    {
        let states = editor.call('entities:panel:getExpandedState', e);
        for (let k of Object.keys(states)) states[k] = val;
        editor.call('entities:panel:restoreExpandedState', states);
    }
}

// Wait until the Editor is available before adding the button
editor.once('entities:load', function () {
    editor.call(
        'entities:contextmenu:add',
        {
            text: "Ext Tree",
            items: [
                {
                    text: "Expand Recursively",
                    onSelect: () => setStates(getSelection(), true)
                },
                {
                    text: "Collapse Recursively",
                    onSelect: () => setStates(getSelection(), false)
                }
            ]
        }
    );
});
