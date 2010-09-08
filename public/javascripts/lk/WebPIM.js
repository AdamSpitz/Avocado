/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * WebPIM.js: Web-based information manager application
 */

// Pointer to application instance while it is running
var PIM; 

// This application can be used in four different modes
// Change the value of 'usageMode' below to choose the mode
const PIM_DemoMode = 1;    // Application used as a PIM with sample data
const PIM_ServerMode = 2;  // Application used as a PIM with data from web server
const BrowserMode = 3;     // Application used as a JavaScript object browser
                           // with object pre-analysis
const FastBrowserMode = 4; // Application used as a JavaScript object browser
                           // without pre-analysis

var usageMode = PIM_DemoMode; 

// For debugging and serialization: Generate a unique ID for each (model) item
const BASE_ID = 1; // Must not be 0
var currId = BASE_ID;
function GenerateNewId() {
    return currId++;    
}

// Path for accessing resources
var PIM_RSC = "Resources/PIM/";

// ===========================================================================
// Application-specific data structures (the MVC "Model" part)
// ===========================================================================

/* Summary of the Model class inheritance hierarchy:
   SelectorItem
    - subclass SelectorFolder
    - subclass SelectorNote 
*/

/**
 * @class SelectorItem: Abstract parent class for Folders and Notes
 * Do not instantiate objects from this class. 
 */

Object.subclass('SelectorItem', {

    initialize: function(owner, caption) {
        this.parent = owner;
        this.caption = caption;
        this.contents = null;
        this.id = GenerateNewId(); // ID for debugging and serialization
        this.dependent = null; // Pointer to the corresponding view item
        this.found = false; // True if this object was found in the last search
        return this;
    },

    getId: function() {
        return this.id;
    },

    getParent: function() {
        return this.parent;
    },

    setParent: function(newParent) {
        this.parent = newParent;
    },

    // Caption is the "name" of the folder or note
    // that is shown in the selector (tree view).
    getCaption: function() {
        return this.caption;
    },

    setCaption: function(value) {
        this.caption = value;
    },
    
    // Contents is the content text that is shown in the content view.
    // Normally only notes, not folders, have content.
    getContents: function() {
        return this.contents;
    },

    setContents: function(value) {
        this.contents = value;
    },

    // View dependency management    
    getViewItem: function() {
        return this.dependent;
    },

    setViewItem: function(viewItem) {
        this.dependent = viewItem;
    },

    updateView: function() {
        return;
    },

    // Shortcuts to frequently needed operations
    isFolder: function() {
        return false;
    },

    isOpenFolder: function() {
        return false;
    },
    
    isEmptyFolder: function() {
        return false;
    },
    
    // Check if the given object is a child of the current item
    isParentOf: function(child) {
        var pointer = child;
        while (pointer) {
            if (pointer == this) return true;
            pointer = pointer.getParent();
        }
        return false;        
    },
    
    // Returns true if this item was found as part of the latest search operation
    isFound: function() {
        return this.found;
    }

});

/**
 * @class SelectorFolder: Data folder that contains other items
 */
SelectorItem.subclass('SelectorFolder', {

    initialize: function($super, owner, caption, items) {
        $super(owner, caption);
        this.state = 0; // 0: closed, 1: opened
        this.items = items ? items : []; // Array of SelectorItems
        return this;
    },
    
    open: function() {
        this.state = 1;
    },

    close: function() {
        this.state = 0;
    },

    isOpen: function() {
        return (this.state == 1);
    },

    isClosed: function() {
        return (this.state == 0);
    },

    isFolder: function() {
        return true;
    },
    
    isOpenFolder: function(){
        return this.isOpen();
    },
    
    isEmptyFolder: function() {
        return this.items.length == 0;
    },
    
    // This operation updates the view of a single item.
    // Currently, this operation is used only when opening
    // or closing empty folders.
    updateView: function() {
        var dependent = this.dependent;
        if (dependent) dependent.updateIcon();
    },

    // Folders don't usually have any content text.
    // We show a summary of folder contents instead.
    getContents: function() {
        var result = null;
        var localItems = this.items.length;
        if (localItems == 0) {
             result = "[ empty folder ]";
        } else {
            var totalNumberOfItems = this.calculateStatistics();
            if (localItems == totalNumberOfItems)
                 result = "[ folder with " + localItems + " items, " + this.totalCharacters + " characters ]";
            else result = "[ folder with " + localItems + " items, " + totalNumberOfItems + " including subfolders, "
                        + this.totalCharacters + " characters total ]";
            if (PIM && PIM.selectorView.searchMode) result += "\n[ " + this.totalFoundItems + " items match the search filter ]";
        }
        if (this.contents) result += "\n\n" + this.contents;
        return result;
    },

    setContents: function(contents) {
        return;    
    },

    // Calculate total number of items in this folder and all its subfolders.
    // During calculation, also count the total amount of text in all the items,
    // as well as the total number of items matching the latest search key.
    calculateStatistics: function() {
        var tally = this.items.length;
        this.totalCharacters = 0;
        this.totalFoundItems = 0;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            this.totalCharacters += item.getCaption().length;
            
            if (item.isFound()) this.totalFoundItems++;

            if (item.isFolder()) {
                tally += item.calculateStatistics();
                this.totalCharacters += item.totalCharacters;
                this.totalFoundItems += item.totalFoundItems;
            } else {
                this.totalCharacters += item.getContents().length;
            }
        }

        return tally;
    },
    
    // Returns true if any of the items in the folder or its subfolders
    // contains items that were found during the latest search operation
    containsFoundItems: function() {
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (item.found) return true;
            if (item.isFolder() && item.containsFoundItems()) return true;
        }
    }

});

/**
 * @class SelectorNote: Item that contains editable text
 */
SelectorItem.subclass('SelectorNote', {

    initialize: function($super, owner, caption, contents) {
        $super(owner, caption);
        this.contents = contents;
        return this;
    }

});

// ===========================================================================
// Application-specific data structures (the MVC "View-Controller" part)
// ===========================================================================

/* Summary of the View class aggregate data structure (containment hierarchy):

   SelectorView
    - contains a number of SelectorViewItems
      - each SelectorViewItem contains a CaptionImageMorph and a CaptionTextMorph

        CaptionImageMorph and CaptionTextMorph are variants of classes
        ImageMorph and TextMorph, respectively.

*/

/**
 * @class CaptionTextMorph: Variant of TextMorph that saves its
 * contents automatically upon a blur event.  Also, CaptionTextMorph
 * responds to carriage returns & up and down arrow keys differently.  
 */
TextMorph.subclass("CaptionTextMorph", {

    initialize: function($super, initialBounds, text, model) {
        $super(initialBounds, text);
        this.setWrapStyle(lively.Text.WrapStyle.NONE);
        this.setFill(Color.gray);
        this.setBorderWidth(0); // Use unbordered text
        this.suppressHandles = true; // No handles!
        this.focusHaloBorderWidth = 0; // No halo around text!
        
        // Contains a pointer to the SelectorItem (folder or note)
        // that is being displayed by this CaptionTextMorph
        this.MVCmodel = model;

        return this;
    },

    // Prevent the object from being moved accidentally
    okToBeGrabbedBy: function(event) {
        return null;
    },

    getModel: function() {
        return this.MVCmodel;
    },

    // Gets a backpointer to the SelectorViewItem that owns this CaptionTextMorph
    getParent: function() {
        return this.owner; // Note: 'owner' property is defined by the Morph class
    },

    // Called automatically when this CaptionTextMorph receives focus.
    // Among other things, we must auto-save the caption and contents
    // related to the previously current item, and then auto-load
    // the contents of the new current item.
    onFocus: function($super, event) {
        $super(event);
        
        // Change focus to this item
        PIM.selectorView.setCurrentViewItem(this.getParent());
    },

    // Called automatically when this CaptionTextMorph loses focus.
    // We must auto-save the contents of the edited text in the content
    // pane when this occurs.
    onBlur: function($super, event) {
        $super(event);

        // Ensure that the (possibly) edited caption is saved
        this.MVCmodel.setCaption(this.textString);
    },

    // Special treatment of key codes for CaptionTextMorphs
    onKeyDown: function($super, event) {
        switch (event.getKeyCode()) {

            // CaptionTextMorphs contain a single line only; disable carriage returns
            case Event.KEY_RETURN:
                var item = this.getModel();

                // Save the edited caption immediately when return key 
                // is pressed in the selector
                item.setCaption(this.textString);

                // If we are currently on a SelectorFolder, open/close the folder
                if (item.isFolder()) {
                    if (item.isClosed()) item.open();
                    else item.close();

                    // Optimization: If the folder does not contain any items,
                    // we can simply update the icon instead of redrawing the tree
                    if (item.isEmptyFolder()) item.updateView();
                    else PIM.selectorView.updateView();
                }
                event.stop();
                break;

            case Event.KEY_DELETE:
                if (PIM.selectorView.deleteCurrentViewItem()) {
                    PIM.selectorView.updateView();
                    PIM.selectorView.setCurrentViewItem(null);
                    PIM.contentView.setTextString("(item deleted)");
                }
                event.stop();
                break;

            // Up and down arrows allow items to be moved up and down in the selector
            case Event.KEY_UP:
                var item = this.getModel();

                // Save the edited caption 
                item.setCaption(this.textString);

                // Move the current item up
                var currentViewItem = PIM.selectorView.getCurrentViewItem();
                if (currentViewItem && currentViewItem.getModel() == item) {
                    if (PIM.selectorView.moveItem(item, -1)) {
                        PIM.selectorView.updateView();
                    }
                }
                event.stop();
                break;

            case Event.KEY_DOWN:
                var item = this.getModel();

                // Save the edited caption 
                item.setCaption(this.textString);

                // Move the current item down
                var currentViewItem = PIM.selectorView.getCurrentViewItem();
                if (currentViewItem && currentViewItem.getModel() == item) {
                    var moveDist = +1;

                    if (item.isOpenFolder()) {
                        // A folder cannot be moved into itself!
                        // Skip over the open items
                        moveDist = PIM.selectorView.findNextWithSameIndent(currentViewItem);
                    }
                    
                    if (moveDist > 0) {
                        if (PIM.selectorView.moveItem(item, moveDist)) {
                            PIM.selectorView.updateView();
                        }
                    }
                }
                event.stop();
                break;

            default: 
                // Process all the other key codes normally
                $super(event);
        }
    }

});

/**
 * @class CaptionImageMorph: Variant of ImageMorph that automatically
 * loads the application-specific icons during instantiation, and 
 * responds to mouse clicks and drags in an application-specific way.
 */
ImageMorph.subclass("CaptionImageMorph", {

    // Constants
    ITEMHEIGHT: 20,
    MOVETHRESHOLD: 5,

    initialize: function($super, initialBounds, model) {

        this.MVCmodel = model;
        var imageName = null;

        // TODO: We should avoid reloading the same images/URLs all over again

        // Note: Folder icon color changes based on folder state
        // (empty/non-empty, open/closed, or whether the folder
        // contains found items or not)
        
        var imageName = null;
        if (model instanceof SelectorFolder) {
            if (model.isOpen()) { 
                if (model.isEmptyFolder()) {
                    imageName = PIM_RSC + "Icon_Folder_Opened_Empty.PNG";
                } else {
                    if (PIM && PIM.selectorView.searchMode && model.containsFoundItems()) {
                        imageName = PIM_RSC + "Icon_Folder_Opened_Found.PNG";
                    } else {
                        imageName = PIM_RSC + "Icon_Folder_Opened.PNG";
                    }                
                }
            }
            else {
                if (model.isEmptyFolder()) {
                    imageName = PIM_RSC + "Icon_Folder_Closed_Empty.PNG";
                } else {
                    if (PIM && PIM.selectorView.searchMode && model.containsFoundItems()) {
                        imageName = PIM_RSC + "Icon_Folder_Closed_Found.PNG";
                    } else {
                        imageName = PIM_RSC + "Icon_Folder_Closed.PNG";
                    }
                }
            }
        } else {        
            if (model instanceof SelectorNote) {
                imageName = PIM_RSC + "Icon_Note.PNG";
            }
        }

        $super(initialBounds, imageName);
        this.suppressHandles = true; // No handles!
        this.openForDragAndDrop = false;

        // Instance variables for mouse handling
        this.lastMouseDownPoint = null;
        this.dragger = null;

        return this;
    },

    // Gets a backpointer to the SelectorViewItem that owns this CaptionImageMorph
    getParent: function() {
        return this.owner; // Note: 'owner' property is defined by the Morph class
    },

    handlesMouseDown: function(event) {
        return true;
    },

    onMouseDown: function(event) {

        // Change focus to this item
        PIM.selectorView.setCurrentViewItem(this.getParent());

        // Make sure the previously edited TextMorph cursor is undrawn
        PIM.contentView.relinquishKeyboardFocus(this.world().firstHand());

        // Record location in which mouse click occurred
        this.lastMouseDownPoint = event.mousePoint;
        this.dragger = null;
    },

    onMouseMove: function(event) {
        // Sanity check
        if (this.lastMouseDownPoint == null) return;
        
        // Move/drag an item
        if (event.mousePoint.dist(this.lastMouseDownPoint) >= this.MOVETHRESHOLD) { 
            // Draw a horizontal drag cursor ("dragger") inside the selector 
            var localPoint = PIM.selectorView.localize(event.mousePoint);
            localPoint.x = 0; // We are only interested in the Y coordinate
            if (this.dragger) {
                // Move the dragger
                this.dragger.setPosition(localPoint);
            } else {
                // Create a dragger
                this.dragger = Morph.makeLine([localPoint, localPoint.addXY(300, 0)], 2, Color.blue);
                PIM.selectorView.addMorph(this.dragger);
            }
        }
    },

    onMouseUp: function(event) {
        // Sanity check
        if (this.lastMouseDownPoint == null) return;
        
        // If not dragging and mouse has not moved much, open/close folder
        if (this.dragger == null && event.mousePoint.dist(this.lastMouseDownPoint) < this.MOVETHRESHOLD) {
            var model = this.MVCmodel;
            if (model.isFolder()) {
                if (model.isClosed()) model.open();
                else model.close();
                        
                // Optimization: If the folder does not contain any items,
                // we can simply update the icon instead of redrawing the tree
                if (model.isEmptyFolder()) model.updateView();
                else PIM.selectorView.updateView();
            }
        } else {
            // If mouse cursor moved between mousedown and mouseup, 
            // complete the DnD operation to move the selected object.
            
            // Calculate how much the mouse moved vertically
            var vertDist = event.mousePoint.y - this.lastMouseDownPoint.y;
            if (vertDist < 0) 
                 vertDist += this.localize(this.lastMouseDownPoint).y;
            else vertDist -= this.localize(this.lastMouseDownPoint).y;

            var howMuch = Math.round(vertDist / this.ITEMHEIGHT);
            if (PIM.selectorView.moveItem(this.MVCmodel, howMuch)) {
                PIM.selectorView.updateView();
            }
        }

        this.lastMouseDownPoint = null;
        if (this.dragger) {
            PIM.selectorView.removeMorph(this.dragger);
            this.dragger = null;
        }
    }

});

/**
 * @class SelectorViewItem: Displays an individual row (folder or note)
 * in the selector view (tree).  Each row contains a CaptionImageMorph
 * and a CaptionTextMorph.  
 */
BoxMorph.subclass("SelectorViewItem", {

    // Constants for icon placement
    ICONLEFTPADDING: 6,
    ICONTOPPADDING: 2,
    ICONWIDTH: 14,
    ICONHEIGHT: 16,

    // Constants for text placement
    TEXTLEFTPADDING: 21,
    TEXTTOPPADDING: 0,
    TEXTWIDTH: 500,
    TEXTHEIGHT: 20,

    initialize: function($super, initialBounds, model, indentLevel) {
        $super(initialBounds);
        this.setFill(Color.gray);
        this.setBorderColor(Color.gray);
        this.suppressHandles = true; // No handles!
        this.openForDragAndDrop = false;
        this.ignoreEvents(); // Will not respond nor get focus!

        // Contains a pointer to the SelectorItem (folder or note)
        // that is being displayed by this SelectorViewItem
        this.MVCmodel = model;

        // Contains view-specific information about how "deep"
        // in the folder hierarchy this item is contained
        this.indentLevel = indentLevel;

        // Initialize the substructures (icon and text)
        this.imageMorph = new CaptionImageMorph(new Rectangle(
            this.ICONLEFTPADDING, this.ICONTOPPADDING, 
            this.ICONWIDTH, this.ICONHEIGHT), model);
        this.addMorph(this.imageMorph);
        this.textMorph = new CaptionTextMorph(new Rectangle(
            this.TEXTLEFTPADDING, this.TEXTTOPPADDING,
            this.TEXTWIDTH, this.TEXTHEIGHT), model.getCaption(), model);
        this.addMorph(this.textMorph);

        // Make the model object aware of its view item
        model.setViewItem(this);

        return this;
    },

    // Prevent the object from being moved accidentally
    okToBeGrabbedBy: function(event) {
        return null;
    },

    // Update the icon in the SelectorViewItem based
    // on the current state of the model 
    updateIcon: function() {
        if (this.imageMorph) this.removeMorph(this.imageMorph);
        this.imageMorph = new CaptionImageMorph(new Rectangle(
            this.ICONLEFTPADDING, this.ICONTOPPADDING, 
            this.ICONWIDTH, this.ICONHEIGHT), this.MVCmodel);
        this.addMorph(this.imageMorph);
    },

    // Gets a backpointer to the SelectorView that owns this view item
    getParent: function() {
        return this.owner; // Note: 'owner' property is defined by the Morph class
    },

    getModel: function() {
        return this.MVCmodel;
    }

});

/**
 * @class SelectorView: Displays the contents of the entire selector tree
 */
Morph.subclass("SelectorView", {

    // Constants for item placement
    LEFTPADDING: 4,
    INDENTFACTOR: 20,
    ITEMWIDTH: 600,
    ITEMHEIGHT: 20,

    initialize: function($super, initialBounds) {
        $super(new lively.scene.Rectangle(initialBounds));
        this.setFill(Color.gray);

        // Contains an array of SelectorViewItems
        this.viewItems = null;

        // Currently selected selector view item (a SelectorViewItem)
        this.currentViewItem = null;

        // Define the gray highlight border that is drawn
        // around the currently selected view item
        if (!this.highlight) {
            this.highlight = Morph.makePolygon(
                [pt(this.LEFTPADDING, 0), pt(this.LEFTPADDING, this.ITEMHEIGHT), 
                 pt(this.ITEMHEIGHT, this.ITEMHEIGHT), pt(this.ITEMHEIGHT, 0), 
                 pt(this.LEFTPADDING, 0)], 2, Color.darkGray, Color.gray);
            this.highlight.suppressHandles = true; // No handles!
        } 

        // MVC model must be provided explicitly using 'setModel'
        this.MVCmodel = null;

        // Search mode is off initially
        this.searchMode = false;

        return this;
    },

    // Prevent the object from being moved accidentally
    okToBeGrabbedBy: function(event) {
        return null;
    },

    getModel: function() {
        return this.MVCmodel;
    },

    setModel: function(model) {
        this.MVCmodel = model;
    },

    // Contains a pointer to SelectorViewItem that has current focus in the selector
    getCurrentViewItem: function() {
        return this.currentViewItem; // a SelectorViewItem
    },
    
    setCurrentViewItem: function(value) {
        var previousCurrentViewItem = this.currentViewItem;
        this.currentViewItem = value;
        
        // Special case: In browser mode we get the reflective data
        // from the JavaScript VM upon clicking a folder
        if (value && (usageMode == BrowserMode || usageMode == FastBrowserMode)) {
            var model = value.getModel();
            // Get the reflective data only if it hasn't been obtained yet!
            if (model && model.JSobject && model.items && (model.items.length == 0)) {
                PIM.generateFolderContents(model, model.JSobject, model.JSpathname, 0);
                model.updateView();
            }
        }
            
        if (previousCurrentViewItem) {
            // Remove highlight from the previously selected view item
            previousCurrentViewItem.removeMorph(this.highlight);
            
            // Auto-save the (possibly) edited caption and contents
            previousCurrentViewItem.getModel().setContents(PIM.contentView.textString);
            previousCurrentViewItem.getModel().setCaption(previousCurrentViewItem.textMorph.textString);            
        }

        if (value) {
            // Draw highlight around the currently selected view item
            value.addMorphBack(this.highlight);

            // Auto-load the new contents of the content pane
            PIM.contentView.setTextString(value.getModel().getContents());
        }
    },

    /* 
       TODO: The current implementation regenerates the selector view
       (and all the morphs in it) from scratch each time the structure
       of the model changes.  This is not always necessary.  Optimize later.
    */ 
    updateView: function() {
        this.removeAllMorphs();
        this.suppressHandles = true;
        this.openForDragAndDrop = false;

        this.viewItems = [];
        var viewItemCount = 0;
        var indentLevel = 0;
        
        var modelItems = this.MVCmodel.items;

        viewItemCount = this.updateFolder(modelItems, indentLevel, viewItemCount);

        // If we are in search mode, add the highlight color to found items 
        if (this.searchMode) this.addSearchColor();

        // Enable this line to perform additional integrity checking (for debugging)
        // if (PIM) PIM.checkModelIntegrity();

        // Make sure scrollbars (especially in the selector view) are updated correctly
        if (PIM) PIM.panel.adjustForNewBounds();

        return viewItemCount; // Total number of SelectorViewItems drawn
    },

    // Update a single opened folder in the selector
    // Returns the total number of items drawn in the selector view
    updateFolder: function(folderItems, indentLevel, itemsDrawn) {
    
        var currentViewItem = this.getCurrentViewItem();

        for (var i = 0; i < folderItems.length; i++) {
            var item = folderItems[i]; // Note: model item, not view item!
            
            var bounds = new Rectangle(indentLevel*this.INDENTFACTOR, 
                this.LEFTPADDING+itemsDrawn*this.ITEMHEIGHT, 
                this.ITEMWIDTH, this.ITEMHEIGHT);
            var selectorViewItem = new SelectorViewItem(bounds, item, indentLevel); 

            this.viewItems[itemsDrawn++] = selectorViewItem;
            this.addMorph(selectorViewItem);

            // Update the highlight for the currently selected item
            if (currentViewItem && currentViewItem.getModel() == item) {
                this.setCurrentViewItem(selectorViewItem);
            }

            // If the item is a folder that is open, subitems must be drawn, too.
            // Note: Subitems are automatically drawn indented.
            if (item.isOpenFolder()) {
                itemsDrawn = this.updateFolder(item.items, indentLevel+1, itemsDrawn);
            }

        }

        return itemsDrawn;
    },

    // Add highlight color to those SelectorViewItems
    // that matched the search key
    addSearchColor: function() {
    
        var foundItemCount = 0;

        for (var i = 0; i < this.viewItems.length; i++) {
            var viewItem = this.viewItems[i];
            var model = viewItem.getModel();
            if (model.isFound()) {
                foundItemCount++;
                viewItem.textMorph.setTextColor(Color.red);
            }
        }

        return foundItemCount;
    },

    // Move the given item up or down based on the given distance
    // (how many items up or down; negative values = up; positive
    // values = down, e.g., -2 = two items higher)

    // TODO: This code should be simplified later
    // (for instance, we should use collections 
    // instead of ugly C-style loops)
    moveItem: function(modelToBeMoved, howMuch) {

        // Items are placed _after_ the index specified by 'howMuch'.
        // For items above and including the current item, we need to 
        // use an index that is one _before_ 'howMuch')
        if (howMuch <= 0) howMuch -= 1; 

        // ======================================================
        // Remove the item from its current location in the model
        var oldParent = modelToBeMoved.getParent();
        var oldParentItems = oldParent.items;
        var oldIndex = -1;

        for (var i = 0; i < oldParentItems.length; i++) {
            var item = oldParentItems[i];
            if (item == modelToBeMoved) {
                oldIndex = i;
                break;
            }
        }

        // Should never happen
        if (oldIndex == -1) { alert("Invariant move1 broken"); return false; }

        // Remove the item from its previous parent
        var removed = oldParentItems.splice(oldIndex, 1);
        if (removed[0] != modelToBeMoved) alert("Invariant move1B broken");

        // ====================================================
        // Find the (index of the) item to be moved in the view
        var oldViewIndex = -1;
        for (var i = 0; i < this.viewItems.length; i++) {
            var item = this.viewItems[i];

            if (item.getModel() == modelToBeMoved) {
                oldViewIndex = i;
                break;
            }
        }

        // Should never happen
        if (oldViewIndex == -1) { alert("Invariant move2 broken"); return false; }

        // ===================================
        // Calculate new position for the item
        var newViewIndex = oldViewIndex + howMuch;
        if (newViewIndex >= this.viewItems.length) newViewIndex = this.viewItems.length - 1;

        // =================================
        // Move the item to its new location

        // Special case 1: last item cannot be moved down
        if (newViewIndex >= this.viewItems.length - 1 && 
            this.viewItems[newViewIndex].getModel() == modelToBeMoved) {
            // Restore the item that was deleted above
            oldParentItems.push(modelToBeMoved);
            return false; // Nothing changed -> no need to repaint
        }

        // Special case 2: adding to the beginning of the tree
        if (newViewIndex < 0) {
            PIM.items.splice(0, 0, modelToBeMoved);        
            modelToBeMoved.setParent(PIM);            
            return true; // Must repaint
        }

        // Calculate the new position in the model tree
        var newModel = this.viewItems[newViewIndex].getModel();
        var newParent = newModel.getParent();
        var newParentItems = newParent.items;
        var newIndex = -1;

        for (var i = 0; i < newParentItems.length; i++) {
            var item = newParentItems[i];
            if (item == newModel) {
                newIndex = i;
                break;
            }
        }

        // Should never happen
        if (newIndex == -1) { alert("Invariant move3 broken"); return false; }

        // Special case 3: If the item to be moved is an open folder,
        // we must not move the item into itself.  This would create a
        // parentless, circular structure that would get deleted immediately.
        if (modelToBeMoved.isOpenFolder() && modelToBeMoved.isParentOf(newParent)) {
            // Restore the item that was deleted above
            oldParentItems.push(modelToBeMoved);
            return false; // Nothing changed -> no need to repaint
        }

        if (newModel.isOpenFolder()) {
            // If adding after an open folder, add the item INTO the folder
            newModel.items.splice(0, 0, modelToBeMoved);        
            modelToBeMoved.setParent(newModel);
        } else {
            // Regular case: Add item immediately AFTER the current one
            newParentItems.splice(newIndex+1, 0, modelToBeMoved);
            modelToBeMoved.setParent(newParent);
        }
        
        return true; // Must repaint
    },
    
    // Called when adding new items (notes or folders)
    // after the currently selected view item
    insertAfterCurrentViewItem: function(newItem) { 
        var currentViewItem = this.currentViewItem;
        var currentModel = currentViewItem.getModel();
        var currentModelParent = currentModel.getParent();
        var currentModelParentItems = currentModelParent.items;
        var item;

        var index = -1;
        for (var i = 0; i < currentModelParentItems.length; i++) {
            item = currentModelParentItems[i];
            if (item == currentModel) {
                index = i;
                break;
            }
        }
        
        // Should never happen
        if (index == -1) { alert("Invariant insert1 broken"); return; }
        
        if (item.isOpenFolder()) {
            // If adding after an open folder, add the item INTO the folder
            currentModel.items.splice(0, 0, newItem);        
            newItem.setParent(currentModel);
        } else {
            // Regular case: Add item immediately AFTER the current one
            currentModelParentItems.splice(index+1, 0, newItem);
            newItem.setParent(currentModelParent);
        }
        
    },

    deleteCurrentViewItem: function() {
        var currentViewItem = this.currentViewItem;
        if (!currentViewItem) return false; // Nothing deleted

        var currentModel = currentViewItem.getModel();
        var answer = false;

        // Show different confirmation dialog based on item type
        if (currentModel.isFolder()) {
            if (currentModel.items.length > 0) {
                answer = confirm("Delete this folder and everything in it? '"
                       + currentModel.getCaption() + "'");
            } else {
                answer = confirm("Delete empty folder? '"
                       + currentModel.getCaption() + "'");
            }
        } else {
            answer = confirm("Delete this item? '"
                   + currentModel.getCaption() + "'");
        }

        // Don't delete anything without user confirmation
        if (answer == false) return false;

        var parent = currentModel.getParent();
        var parentItems = parent.items;

        // Remove the current item from the parent item array
        for (var i = 0; i < parentItems.length; i++) {
            if (parentItems[i] == currentModel) {
                parentItems.splice(i, 1);
                break;
            }
        }

        return true; // Deletion completed successfully -> repaint
    },
    
    // Given a SelectorViewItem, find the next SelectorViewItem that 
    // has an indent level that is equal to or less than the indent 
    // level of the given item.  Return the difference of their positions
    // in the view tree, or 0 if no matching item is found.  This operation
    // is used when moving open folders downwards in the selector.
    findNextWithSameIndent: function(givenViewItem) {

        var itemIndex = -1;
        for (var i = 0; i < this.viewItems.length; i++) {
            var viewItem = this.viewItems[i];
            if (viewItem == givenViewItem) {
                itemIndex = i;
                break;
            }
        }

        if (itemIndex == -1) return 0;

        var givenIndentLevel = givenViewItem.indentLevel;

        for (i = itemIndex+1; i < this.viewItems.length; i++) {
            var viewItem = this.viewItems[i];
            if (viewItem.indentLevel <= givenIndentLevel) return (i - itemIndex);
        }
        
        return 0;
    },
    
    getSearchMode: function() {
        return this.searchMode;
    },

    // Set search model on & repaint
    setSearchMode: function() {
        this.searchMode = true;
        this.updateView();
    },

    // Toggle search mode on/off & repaint
    toggleSearchMode: function() {
        this.searchMode = this.searchMode ? false : true;
        this.updateView();    
    },
    
    // This is used by the 'Find Next' UI operation.
    // It "rotates" the currently selected view item
    // based on those items that were found as part
    // of the latest search operation.
    setNextFoundAsCurrentViewItem: function() {
        /* 
        if (!this.searchMode) {
            alert("Find Next: No Items Found");
            return;
        }
        */

        for (var attempts = 0; attempts <= 1; attempts++) {

            var startIndex = 0;

            if (attempts == 0) {
                var currentViewItem = this.currentViewItem;
                if (currentViewItem) {
                    var currentModel = currentViewItem.getModel();
                    for (var i = 0; i < this.viewItems.length; i++) {
                        var viewItem = this.viewItems[i];
                        if (viewItem.getModel() == currentModel) {
                            startIndex = i+1;
                            break;
                        }
                    }
                }
            }

            // Search for the next found item
            for (i = startIndex; i < this.viewItems.length; i++) {
                var viewItem = this.viewItems[i];
                var model = viewItem.getModel();
                if (model.found) {
                    this.setCurrentViewItem(viewItem);

                    // Make sure the selected item is always visible (auto-scroll)
                    var currentViewItem = this.getCurrentViewItem();
                    if (PIM && currentViewItem) {
		                var sp = PIM.panel.treePane;
                        var rectangle = currentViewItem.getPosition().extent(currentViewItem.getExtent());
		                sp.scrollRectIntoView(rectangle);
                    }

                    return;
                }
            }    
        }

        alert("Find Next: No Items Found");
    }

});

/**
 * @class TreePane: Creates a new tree pane (for the SelectorView))
 */
function TreePane(initialBounds) {
    return new ScrollPane(new SelectorView(initialBounds), initialBounds); 
};

/**
 * @class IconPane: Pane that contains the action buttons/icons of the application
 */
ClipMorph.subclass("IconPane", {

    initialize: function($super, initialBounds) {
    
        $super(initialBounds);

        var BSIZE = 30; // Button size (constant)
        var TOP = 14;   // Vertical positioning of buttons (constant)
        var POS = 10;   // Horizontal positioning of buttons (variable)
        var PAD = 8;    // Horizontal padding between the buttons (constant) 

        // Add icon buttons to the icon pane
        this.newFolderButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE), 
            PIM_RSC + "Button_NewFolder.PNG", PIM_RSC + "Button_NewFolder_Selected.PNG"); 
        this.addMorph(this.newFolderButton); POS += BSIZE + PAD;

        this.newNoteButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE), 
            PIM_RSC + "Button_NewNote.PNG", PIM_RSC + "Button_NewNote_Selected.PNG"); 
        this.addMorph(this.newNoteButton); POS += BSIZE + PAD;
        
        this.deleteButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE), 
            PIM_RSC + "Button_Delete.PNG", PIM_RSC + "Button_Delete_Selected.PNG"); 
        this.addMorph(this.deleteButton); POS += BSIZE + PAD;
        
        this.searchButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE), 
            PIM_RSC + "Button_Search.PNG", PIM_RSC + "Button_Search_Selected.PNG"); 
        this.addMorph(this.searchButton); POS += BSIZE + PAD;

        this.findNextButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE),
            PIM_RSC + "Button_FindNext.PNG", PIM_RSC + "Button_FindNext_Selected.PNG"); 
        this.addMorph(this.findNextButton); POS += BSIZE + PAD;

        this.toggleSearchButton = new ImageButtonMorph(new Rectangle(POS, TOP, BSIZE, BSIZE), 
            PIM_RSC + "Button_ToggleSearch.PNG", PIM_RSC + "Button_ToggleSearch_Selected.PNG"); 
        this.addMorph(this.toggleSearchButton); POS += BSIZE + PAD;

        return this;
    },
    
    // Prevent the object from being moved accidentally
    okToBeGrabbedBy: function(event) {
        return null;
    },

    // Connect buttons to application behavior
    connectButtons: function(application) {
        this.newNoteButton.connectModel(      {model: application, setValue: "insertNewNote"});
        this.newFolderButton.connectModel(    {model: application, setValue: "insertNewFolder"});
        this.deleteButton.connectModel(       {model: application, setValue: "deleteCurrentItem"});
        this.searchButton.connectModel(       {model: application, setValue: "openSearchDialog"});
        this.findNextButton.connectModel(     {model: application, setValue: "findNextDialog"});
        this.toggleSearchButton.connectModel( {model: application, setValue: "toggleSearchDialog"});
    }
    
});

// ===========================================================================
// Putting it all together
// ===========================================================================

/**
 * @class WebPIM: The main application class
 */
Object.subclass('WebPIM', {

    initialize: function() {

        // Pointers to main visual structures
        this.panel = null;        // The main panel that contains three other panes 
        this.selectorView = null; // The selector (tree) pane
        this.contentView = null;  // The content pane
        this.caption = "root";    // For serialization only

        // Generate MVC model data
        switch (usageMode) {
        case PIM_DemoMode:
            // If web server is not enabled, generate sample PIM data
            this.items = this.generateSamplePIMData();
            break;
            
        case PIM_ServerMode:
            // If the web server is enabled, data is read from from the Web
            this.items = [];
            PIM = this;
            this.unserializeDataFromWebServer();
            break;
            
        case BrowserMode:
        case FastBrowserMode:
            // If the browser feature is enabled, the application
            // displays reflective data from the JavaScript VM itself 
            this.items = this.generateBrowserData();
            break;
        }

        return this;
    },

    getParent: function() {
        return null;
    },

    getId: function() {
        return this.caption;
    },

    getCaption: function() {
        return "";
    },

    isFolder: function() {
        return true;
    },

    isOpen: function() {
        return true;
    },

    isOpenFolder: function() {
        return true;
    },

    openIn: function(world, location) {
        var window = new WindowMorph(this.buildView(pt(800, 600)), 'WebPIM version 0.6');
        // var window = this.buildView(pt(800, 600)); // Without an enclosing window
        world.addMorphAt(window, location);

        // Make sure scroll bars are initialized correctly
        this.panel.adjustForNewBounds();
        return this;
    },

    buildView: function(extent) {
        var panel = this.panel = PanelMorph.makePanedPanel(extent, [
            ['iconPane', IconPane, new Rectangle(0.0, 0.0, 0.3, 0.1)],
            ['treePane', TreePane, new Rectangle(0.0, 0.1, 0.3, 0.9)],
            ['textPane', newTextPane, new Rectangle(0.3, 0.0, 0.7, 1.0)]
        ]);

        // Connect icon pane buttons to the application
        panel.iconPane.connectButtons(this);

        // Generate the selector view
        this.selectorView = panel.treePane.innerMorph();
        this.selectorView.setModel(this);
        this.selectorView.updateView();

        // Generate content view with help text
        this.contentView = panel.textPane.innerMorph();
        this.contentView.setFontSize(16);
        this.contentView.setTextString('This is the content view.  ' 
        + 'Choose an item from the selector (tree view) on the left, and edit the contents of the item here.  '
        + 'The name ("caption") of each item can be edited in the selector.\n\n'
        + 'Objects are selected by clicking their names (captions) or icons in the selector.\n\n'
        + 'Folders can be opened and closed using the RETURN key, or by '
        + 'clicking the folder icons.\n\n'
        + 'Use the UP and DOWN arrow keys to move items in the selector.  '
        + 'You can move an item in the selector also by dragging its icon up and down with the mouse.\n\n'
        + 'New folders or notes can be created either in the end of the selector '
        +  '(when nothing is selected), or under the currently selected item.\n\n'
        + 'When you use the search features, the found items are highlighted '
        +  'with red color in the selector.\n\n'
        + 'The storage features are not available yet.'
        );

        // Make serialization operations available in the Window menu
        panel.morphMenu = function(evt) { 
            var menu = Class.getPrototype(this).morphMenu.call(this, evt);
            menu.addLine();
            menu.addItem(['load data from web server', function() {
                PIM.unserializeDataFromWebServer();
            }]);
            menu.addItem(['save data to web server', function() {
                PIM.serializeDataToWebServer();
            }]);
            menu.addItem(['generate sample PIM data', function() {
                PIM.items = null; // Allow garbage collection
                PIM.items = PIM.generateSamplePIMData();
                PIM.selectorView.updateView();
            }]);
            menu.addItem(['use the application as a JavaScript browser', function() {
                PIM.items = PIM.generateBrowserData();
                PIM.selectorView.updateView();
            }]);
            return menu; 
        }

        return panel;
    },
    
    // Search functionality.  Returns the total number of matching items.
    search: function(searchKey) {
        var itemsFound = 0;
        return this.searchFolder(this.items, searchKey, itemsFound);
    },

    searchFolder: function(items, searchKey, itemsFound) {

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // If folder, recurse immediately
            if (item.isFolder()) {
                itemsFound = this.searchFolder(item.items, searchKey, itemsFound);
            }

            // Reset the search result info
            item.found = false;

            // Search the caption
            var caption = item.getCaption();
            if (caption.indexOf(searchKey) != -1) {
                item.found = true;
                itemsFound++;
                continue;
            }

            if (item.isFolder()) continue;
            
            // If not a folder, also search the content text
            var contents = item.getContents();
            if (contents.indexOf(searchKey) != -1) {
                item.found = true;
                itemsFound++;
            }            
        }

        return itemsFound;
    },

    // Button event handlers (for the icon pane) are defined below

    insertNewNote: function(value) {
        if (value == false) { // Only on mouseUp!

            // Create the new note
            var newItem = new SelectorNote(this, "New Note", "(empty note)");

            var currentViewItem = this.selectorView.getCurrentViewItem(); 
            if (currentViewItem == null) {
                // If no item is currently selected, add the new item 
                // to the end of the selector
                this.items.push(newItem);
            } else {
                // If an item is selected, add the new item immediately 
                // after the selected item.
                // Special case: if the current item is an open folder, 
                // add the item into the folder
                this.selectorView.insertAfterCurrentViewItem(newItem);
            }

            // Update the view
            this.selectorView.updateView();
            
            // Set the new item as current item
            var newCurrentItem = newItem.getViewItem();
            if (newCurrentItem) this.selectorView.setCurrentViewItem(newCurrentItem);
        }
    },

    insertNewFolder: function(value) {
        if (value == false) { // Only on mouseUp!

            // Create the new folder
            var newItem = new SelectorFolder(this, "New Folder", []);

            var currentViewItem = this.selectorView.getCurrentViewItem(); 
            if (currentViewItem == null) {
                // If no item is currently selected, add the new item 
                // to the end of the selector
                this.items.push(newItem);
            } else {
                // If an item is selected, add the new item immediately 
                // after the selected item.
                // Special case: if the current item is an open folder, 
                // add the item into the folder
                this.selectorView.insertAfterCurrentViewItem(newItem);
            }

            // Update the view
            this.selectorView.updateView();

            // Set the new item as current item
            var newCurrentItem = newItem.getViewItem();
            if (newCurrentItem) this.selectorView.setCurrentViewItem(newCurrentItem);
        }
    },
    
    deleteCurrentItem: function(value) {
        if (value == false) { // Only on mouseUp!

            if (this.selectorView.deleteCurrentViewItem()) {
                this.selectorView.updateView();
                this.selectorView.setCurrentViewItem(null);
                this.contentView.setTextString("(item deleted)");
            }

        }
    },

    openSearchDialog: function(value) {
        if (value == false) { // Only on mouseUp!
            var value = prompt("Enter Search Text");
            if (value) {
                var itemsFound = this.search(value);
                if (itemsFound) {
                    this.selectorView.setSearchMode(); // Will also update the display
                    this.panel.iconPane.toggleSearchButton.changeAppearanceFor(true);
                } else {
                    alert("No matching Items found");
                }
            }
        }
    },

    findNextDialog: function(value) {
        if (value == false) { // Only on mouseUp!
            this.selectorView.setNextFoundAsCurrentViewItem();
        }
    },

    toggleSearchDialog: function(value) {
        if (value == false) {
            this.selectorView.toggleSearchMode(); // Will also update the display
            if (this.selectorView.getSearchMode()) 
                 this.panel.iconPane.toggleSearchButton.changeAppearanceFor(true);
            else this.panel.iconPane.toggleSearchButton.changeAppearanceFor(false);
        }
    },
    
    // ===================================================================
    // Integrity check (test code): Ensure recursively that all the parent 
    // pointers in the model tree are correct.  Also ensure that each item 
    // is contained in the tree only once.
    checkModelIntegrity: function() {

        var unique = {};
        for (var i = 0; i < PIM.items.length; i++) {
            var item = PIM.items[i];

            // Ensure item is truly unique
            var id = item.getId() + "##" + item.getCaption(); // + item.getContents();
            if (unique[id])
                 alert("Assertion error: item contained in the tree twice: " + id);
            else unique[id] = true;

            var parent = item.getParent();
            if (parent != this) alert("Assertion error: incorrect parent pointer for: " + id);
            if (item.isFolder()) this.checkFolder(item, unique);
        }
    },
    
    checkFolder: function(folder, unique) {
        for (var i = 0; i < folder.items.length; i++) {
            var item = folder.items[i];
            
            // Ensure item is truly unique
            var id = item.getId() + "##" + item.getCaption(); // + item.getContents();
            if (unique[id])
                 alert("Assertion failure 2: item contained in the tree twice: " + id);
            else unique[id] = true;
            
            var parent = item.getParent();
            if (parent != folder) alert("Assertion failure 2: Incorrect parent pointer for: " + id);
            if (item.isFolder()) this.checkFolder(item, unique);
        }
    },
    
    // Note: This is SAMPLE DATA only! ===============================
    generateSamplePIMData: function() {        
        var subitems = [];
        var subitems2 = [];
        var subitems3 = [];
        var subsubitems = [];

        var items = [
            new SelectorNote  (this, "Note 1",   "Contents 1"),
            new SelectorNote  (this, "Note 2",   "Contents 2"),
            new SelectorFolder(this, "Folder 1", []),
            new SelectorNote  (this, "Note 3",   "Contents 3"),
            new SelectorNote  (this, "Note 4",   "Contents 4"),
            new SelectorFolder(this, "Folder 2", subitems),
            new SelectorNote  (this, "Note 5",   "Contents 5"),
            new SelectorFolder(this, "Folder 3", subitems2),
            new SelectorFolder(this, "Folder 4", subitems3),
            new SelectorFolder(this, "Folder 5", []),
            new SelectorNote  (this, "Note 6",   "Contents 6"),
            new SelectorNote  (this, "Note 7",   "Contents 7")
        ];

        subitems.push(new SelectorNote  (items[5], "Subnote 1",   "Subcontents 1"));
        subitems.push(new SelectorNote  (items[5], "Subnote 2",   "Subcontents 2"));
        subitems.push(new SelectorFolder(items[5], "Subfolder 1", subsubitems));
        subitems.push(new SelectorNote  (items[5], "Subnote 3",   "Subcontents 3"));
        subitems.push(new SelectorFolder(items[5], "Subfolder 2", []));

        subitems2.push(new SelectorNote (items[7], "Subnote 1",   "Subcontents 1"));
        subitems3.push(new SelectorNote (items[8], "Subnote 1",   "Subcontents 1"));

        subsubitems.push(new SelectorNote(subitems[2], "Subsubnote 1", "Subsubcontents 1"));
        subsubitems.push(new SelectorNote(subitems[2], "Subsubnote 2", "Subsubcontents 2"));

        items[5].open();
        items[7].open();
        subitems[2].open();
        
        return items;
        // End of SAMPLE DATA definition =================================
    },

    // ======================================================================
    // Web server serialization / unserialization operations are defined here
    
    unserializeDataFromWebServer: function() {        
        Database.getAllFromTable("PIM", this.parseDatabase)
    },
    
    serializeDataToWebServer: function() {
        this.serializeFolder(this);
    },

    serializeFolder: function(folder) {
        var serialized;
        
        if (folder.isOpen()) 
             serialized = "O";
        else serialized = "C";
        serialized += folder.caption + "\n";

        for (var i = 0; i < folder.items.length; i++) {
            var item = folder.items[i];
            serialized += item.getId() + " ";
        }

        Database.setValue("PIM", folder.getId().toString(), serialized /* .substring(0, 512) */, null);    

        for (i = 0; i < folder.items.length; i++) {
            var item = folder.items[i];
            if (item instanceof SelectorFolder) this.serializeFolder(item);
            else if (item instanceof SelectorNote) this.serializeNote(item);
        }
    },

    serializeNote: function(note) {
        var serialized = "N" + note.caption + "\n" + note.contents;
        Database.setValue("PIM", note.getId().toString(), serialized /*.substring(0, 512) */, null);    
    },

    // Warning: This is a callback function.  'this' pointer is not available!
    parseDatabase: function(database) {
        if (!PIM) {
            alert("Application not initialized yet.  Unable to read data from web server.");
            return;
        }

        // Data on our web server is stored as a large key-value store.
        // We read the data into a hash object for preprocessing.
        var hash = {};
        for (var i = 0; i < database.length; i++) {
            var key = database[i][0];
            var value = database[i][1];
            hash[key] = value;
        }

        // Find the root object
        var value = hash["root"];
        if (value) {
            var rootObject = PIM.unserializeValue(hash, value, BASE_ID-1, PIM);
            PIM.items = rootObject.items;
        }
        else alert("Root object not found on the web server");

        PIM.selectorView.updateView();
    },

    unserializeValue: function(hash, value, id, parent) {
        // Items are current represented in two different formats:
        // If the value (string) begins with a "C" or "O", the 
        // value represents a closed or open folder.  The items
        // in the folder are represented by numeric object IDs,
        // separated by spaces.
        // If the value (string) begins with an "N", the value
        // represents a note.
        
        var result;

        var firstChar = value.charAt(0);
        var firstCR = value.indexOf("\n");

        var caption = "";
        if (firstCR != -1) caption = value.substring(1, firstCR);
        
        // alert("ID: " + id + ", caption: " + caption);

        switch (firstChar) {
        case "C":
        case "O": {
            result = new SelectorFolder(parent, caption, []);
            result.id = id; // Manually set original ID

            // Open the folder if it was open during serialization
            if (firstChar == "O") result.open();            
            
            var items = result.items;

            // Parse the serialized object IDs
            var fromHere = firstCR+1;
            var toHere = value.indexOf(" ", fromHere)
            while (toHere != -1) {
                var subIdString = value.substring(fromHere, toHere);
                // alert(subIdString);
                fromHere = toHere+1;
                toHere = value.indexOf(" ", fromHere);

                var subId = parseInt(subIdString);

                // Filter out illegal object IDs
                if (isNaN(subId)) {
                    // alert("Illegal subobject ID encountered");
                    continue;
                }

                var subValue = hash[subId];
                if (subValue) {
                    var subObject = this.unserializeValue(hash, subValue, subId, result);
                    items.push(subObject);
                }
                // else alert("Object not found on the web server");
            }
            
            break;
        }
        case "N": {
            var contents = value.substring(firstCR+1, value.length);
            //alert("New note. Caption: '" + caption + "', Contents: " + contents + "'");
            result = new SelectorNote(parent, caption, contents);
            result.id = id; // Manually set original ID
            break;
        }
        default:
            alert("Unrecognized object in the database"); 
        }

        return result;
    },

    // ==============================================================
    // The code below turns the PIM application into a JavaScript IDE

    generateBrowserData: function() {

        var items = [
            new SelectorFolder(this, "Global", [])
        ];
        var target = items[0];
        target.open();

        this.generateFolderContents(target, Global, "", 0);

        return items;
    },

    generateFolderContents: function(target, objectToView, fullPath, recursion) {

        // Sanity/safety check
        if (objectToView == null) return;
        
        // In fast browser mode, we only generate one level of data at a time,
        // i.e., we do not recurse into substructures until those structures
        // are actually accessed by the user
        if (usageMode == FastBrowserMode && recursion > 0) return;

        // Avoid memory overflow / excessive recursion
        if (recursion > 4) return;

        // Avoid analyzing the Global namespace more than once
        if (recursion > 0 && (objectToView == Global || fullPath == "")) return;

        // Get a sorted list of attributes/methods inside the objectToView
        var list = [];
        for (var name in objectToView) {
            list.push(name);
        }
        list.sort();

        var path;
        var name;
        var object;
        var text;
        var newItem;
        var isLivelyClass;
        var JSpathname;

        // Generate SelectorItems based on the sorted list
        for (var i = 0; i < list.length; i++) {
            name = list[i];

            // Treat arrays specially
            if (Object.isArray(objectToView)) {
                // Skip additional array methods generated by Prototype library
                if (isNaN(parseInt(name))) continue;
                path = fullPath;
                if (!path || path.length == 0) path = "Global";
                path = path + "[" + parseInt(name) + "]";
                name = "[" + name + "]";
            } else {
                path = fullPath;
                if (path != "") path += ".";
                path += name;
            }

            // Preserve the original JavaScript object name
            JSpathname = path;

            // Eliminate some browser-specific crud from the tree.
            // Safari runs out of memory if there is too much stuff to analyze.
            if (path.substring(0, 1) == "$") continue;
            if (path.substring(0, 4) == "XSLT") continue
            if (path.substring(0, 5) == "XPath") continue;
            if (path.substring(0, 4) == "HTML") continue;
            if (path.substring(0, 3) == "CSS") continue;
            if (path.substring(0, 3) == "XML") continue;
            if (path.substring(0, 5) == "Range") continue;
            if (path.substring(0, 7) == "Element") continue;
            if (path.substring(0, 8) == "Mutation") continue;

            if (path.substring(0, 3) == "DOM") continue;
            if (path.substring(0, 4) == "Node") continue;
            if (path.substring(0, 8) == "document" || path.substring(0, 8) == "Document") continue;
            if (path.substring(0, 9) == "Namespace") continue;
            if (path.substring(0, 9) == "navigator") continue;
            if (path.substring(0, 7) == "toolbar" || path.substring(0, 7) == "menubar" || path.substring(0, 10) == "scrollbars") continue;

            // Ignore all items that point to superclass or constructor.
            // These can create recursive structures.
            if (path.indexOf(".superclass") != -1) continue;
            if (path.indexOf(".constructor") != -1) continue;

            try {
                isLivelyClass = false;

                // Get an object pointer based on the path (string)
                object = eval(path);
                if (object == null) {
                    name += " (null)";
                    text = "null";
                } else {
                    text = object.toString();
                    // Clip large amounts of text to conserve memory
                    // if (text.length > 512) text = text.substring(0, 512) + "\n\n... (more) ...";
                }

                // In Lively, classes are actually JavaScript functions.
                // Here's some special code to deal with that feature.
                if (Class.isClass(object)) {
                    name += " (a Class)";
                    
                    // The real methods of Lively classes are found under '.prototype'
                    // Skip over the "irrelevant" layer of stuff
                    path += ".prototype";
                    JSpathname += ".prototype";
                    object = eval(path);
                    isLivelyClass = true;
                }
                else if (Object.isFunction(object)) name += "()";
                else if (Object.isString(object)) name += " (a String)";
                else if (Object.isArray(object)) name += " (an Array)";
                else if (Object.isNumber(object)) name += " (a Number)";
                else if (text == "false" || text == "true") name += " (a Boolean)";
                else if (object == Global) name += " (points to Global)";
            } catch(e) {
                // All unrecognized objects are treated as "native"
                object = null;
                name += " (NATIVE)";
                text = "(NATIVE)";
            }
            
            // Add warning label to large items
            if (object && object.length > 100) name += " (LARGE)"; 

            // Prevent the PIM application from overriding empty strings
            if (text == null) text = " ";

            // Create different type of a SelectorItem based on object type
            if (Object.isFunction(object)
                || Object.isString(object)
                || Object.isNumber(object)
                || text == "false"
                || text == "true"
                || text == "null") {
                newItem = new SelectorNote(target, name, text);
                target.items.push(newItem);
            } else {            
                newItem = new SelectorFolder(target, name, []);
                newItem.contents = text; // Must not use setContents()
                target.items.push(newItem);
            }
            newItem.JSpathname = JSpathname;

            if (!object) continue;
            
            // Do not recurse into functions, strings, numbers or booleans
            if      (Class.isClass(object) || isLivelyClass) /* Intentionally empty */;
            else if (Object.isFunction(object)) continue;
            else if (Object.isString(object)) continue;
            else if (Object.isNumber(object)) continue;
            else if (text == "false" || text == "true") continue;
            else if (object == Global) continue;

            newItem.JSobject = object;

            // Recurse into subcomponents
            this.generateFolderContents(newItem, object, path, recursion+1);
        }
    }

});

// Some more test data for JavaScript browsing
var testArray1 = [ 123, 234, 345, 456 ];
var testArray2 = new Array();
var testArray3 = [ "Hello!", Class, 123, [14], null, true, undefined, currId ];

