GS.TextInput = function(button) {
	this.textButton = button;

	this.modifyingText = false;

	this.onModifyingTextStart = function() {};
	this.onModifyingTextStop = function() {};
}

GS.TextInput.prototype = {
	init: function() {
		var that = this;

		$(document).on("keydown.keybindUse", function(e) {
			if (that.modifyingText) {
				return;
			}

			var keybind = _.find(that.keybinds, { code: e.keyCode });
			if (keybind) {
				keybind.inUse = true;
				e.preventDefault();
			}
		});

		$(document).on("keyup.keybindUse", function(e) {
			if (that.modifyingText) {
				return;
			}

			var keybind = _.find(that.keybinds, { code: e.keyCode });
			if (keybind) {
				keybind.inUse = false;
				e.preventDefault();
			}
		});

		$(document).on("mousedown.keybindUse", function(e) {
			if (that.modifyingText) {
				return;
			}

			var keybind = _.find(that.keybinds, { mouse: true, button: e.which });
			if (keybind) {
				keybind.inUse = true;
				e.preventDefault();
			}
		});

		$(document).on("mouseup.keybindUse", function(e) {
			if (that.modifyingText) {
				return;
			}

			var keybind = _.find(that.keybinds, { mouse: true, button: e.which });
			if (keybind) {
				keybind.inUse = false;
				e.preventDefault();
			}
		});
	},

	getKeybindByActionName: function(actionName) {
		return _.find(this.keybinds, { actionName: actionName });
	},

	modifyText: function(button) {
		var that = this;

		if (this.modifyingText) {
			return;
		}

		this.modifyingText = true;
    button.text = '';
		this.onModifyingTextStart({ button: button });

		$(document).on("keydown.modifyText", function(e) {
			var code = e.keyCode || e.which;

      if (code === 13) {
			  $(document).off("keydown.modifyText");
        that.modifyingText = false;
        that.onModifyingTextStop({ button: button, success: true });
        return
      } else if (code === 8) {
        button.text = (button.text || "").substring(0, button.text.length - 1);
      } else {

          var ok = that.changeText(button, e);

      }

			e.preventDefault();
		});
	},

	changeText: function(button, e) {
		var name = this.isKeyAllowed(e);
		if (!name) {
			return false;
		}

		e.preventDefault();

    button.text += name

		return true;
	},

	isKeyAllowed: function(e) {
		// A-Z, a-z
		if (e.keyCode >= 65 && e.keyCode <= 90) {
			return String.fromCharCode(e.keyCode);
		}

		// 0-9
		if (e.keyCode >= 48 && e.keyCode <= 57) {
			return String.fromCharCode(e.keyCode);
		}

		switch (e.keyCode) {
			case 32:
				return " ";
		}

		return false;
	}
};
