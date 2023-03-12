// ==UserScript==
// @name        PlayCanvas CopyPaste Extension
// @namespace   PlayCanvas Scripts
// @match       *://playcanvas.com/editor/scene/*
// @grant       none
// @version     1.1
// @author      -
// @description Extends copy/paste functionality in PlayCanvas.
// ==/UserScript==

const transforms = ["position", "rotation", "scale"];

let copiers = {
    components: {
        name: "Components",
        uses: null,
        copy: null,
        paste: (item, src) =>
        {
            for (let k of Object.keys(src))
                item.addComponent(k, src[k]);
        }
    },
    enabledComponents: {
        name: "Enabled Components",
        uses: "components",
        copy: item =>
        {
            let src = item.get('components');
            let out = {};
            for (let k of Object.keys(src))
                if (src[k].enabled)
                    out[k] = src[k];
            return out;
        },
        paste: (item, src) =>
        {
            for (let k of Object.keys(src))
                if (src[k].enabled)
                    item.addComponent(k, src[k]);
        }
    },
    collision: {
        name: "Collision",
        uses: "components",
        paste: (item, src) =>
        {
            if (src.collision)
                item.addComponent('collision', src.collision);
        }
    },
    transform: {
        name: "All Transformations",
        uses: "void",
        copy: (item, cb) => transforms.forEach(t => cb[t] = item.get(t)),
        paste: (item, src, cb) =>
        {
            transforms.forEach(t => { if (cb[t]) item.set(t, cb[t]); });
        }
    },
    position: null,
    rotation: null,
    scale: null
};

function getSelection()
{
    let selection = editor.call('selector:items');
    let entity = editor.call('entities:contextmenu:entity');
    return selection.includes(entity) ? selection : [entity];
};

let clipboard = {};
// prevent setting void data
clipboard.__defineGetter__("void", () => true);
// expose clipboard
editor.method("extcp:clipboard", () => clipboard);

function copy(copier)
{
    clipboard[copiers[copier].uses] = copiers[copier].copy(
        getSelection()[0].apiEntity,
        clipboard
    );
}

function paste(copier)
{
    let src = clipboard[copiers[copier].uses];
    if (!src) return;
    let paste = copiers[copier].paste;
    getSelection().forEach(item => paste(item.apiEntity, src, clipboard));
}


let defaultCopier = {
    name: what => what.charAt(0).toUpperCase() + what.slice(1),
    uses: what => what,
    copy: what => (item => clipboard[what] = item.get(what)),
    paste: what => ((item, src) => clipboard[what] = item.set(what, src))
};
function defaultProperty(what, prop, d)
{
    if (copiers[what][prop] === null)
        copiers[what][prop] = defaultCopier[prop](what);
}
function newDefaultCopier(what)
{
    return {
        name: defaultCopier["name"](what),
        uses: defaultCopier["uses"](what),
        copy: defaultCopier["copy"](what),
        paste: defaultCopier["paste"](what)
    }
}

for (let k of Object.keys(copiers))
{
    if (copiers[k] == null)
    {
        copiers[k] = newDefaultCopier(k);
        continue;
    }

    defaultProperty(k, "name");
    defaultProperty(k, "uses");
    defaultProperty(k, "copy");
    defaultProperty(k, "paste");

    if (!copiers[k].name || !copiers[k].uses)
        throw new Error("Faulty copier: " + k);
}

function generateButtons(mode)
{
    let op = (mode == 0) ? copy : paste;
    return Array.from(Object.keys(copiers)).filter(
        (mode == 0) ? (c => copiers[c].copy) : (c => copiers[c].paste)
    ).map(function(copier) {
        return { text: copiers[copier].name, onSelect: () => op(copier) };
    });
}


// Wait until the Editor is available before adding the button
editor.once('entities:load', function () {
    editor.call(
        'entities:contextmenu:add',
        {
            text: "Ext Copy",
            items: generateButtons(0)
        }
    );
    editor.call(
        'entities:contextmenu:add',
        {
            text: "Ext Paste",
            items: generateButtons(1)
        }
    );
});
