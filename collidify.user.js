// ==UserScript==
// @name        PlayCanvas Collidify Button
// @namespace   PlayCanvas Scripts
// @match       *://playcanvas.com/editor/scene/*
// @grant       none
// @version     1.0
// @author      -
// @description add collisions and rigidbody to selected render entities in playcanvas
// ==/UserScript==

class CollidifyHistory
{
  constructor()
  {
    this._history = new Map();
  }

  restore(item)
  {
    // no entry
    if (!this._history.has(item)) return;
    let e = this._history.get(item);

    // restore collision
    if (!e.collision) item.removeComponent("collision");
    else item.addComponent("collision", e.collision);

    // restore rigidbody
    if (!e.rigidbody) item.removeComponent("rigidbody");
    else item.addComponent("rigidbody", e.rigidbody);

    // delete entry
    this.del(item);
  }

  add(item)
  {
    let c = item.get("components");

    // save entry
    this._history.set(item, { collision: c.collision, rigidbody: c.rigidbody });
  }

  del(item)
  {
    // delete map entry
    this._history.delete(item);
  }
}

const hist = new CollidifyHistory();

function collidify(item)
{
  let components = item.get('components');
  if (!components.render?.asset) return;
  hist.add(item);
  // add components
  item.addComponent(
    'collision',
    {
      type: "mesh",
      renderAsset: components.render.asset
    }
  );
  item.addComponent('rigidbody', { restitution: 0.01 });
}

function forSelected(fn)
{
  return editor.selection.items.forEach(fn);
}

function forChildren(fn)
{
  return editor.selection.items.forEach(item => item.children.forEach(fn));
}

// Wait until the Editor is available before adding the button
editor.once('entities:load', function () {
  editor.call(
    'entities:contextmenu:add',
    {
      text: "Collidify",
      items: [
        {
          text: "Selected",
          onSelect: () => forSelected(collidify)
        },
        {
          text: "Children",
          onSelect: () => forChildren(collidify)
        },
        {
          text: "Revert Selected",
          onSelect: () => forSelected(hist.restore.bind(hist))
        },
        {
          text: "Revert Children",
          onSelect: () => forChildren(hist.restore.bind(hist))
        }
      ]
    }
  );
});
