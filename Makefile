AUTO_GEN_DIR          := public/javascripts/auto_generated
STATIC_JS_WITH_DEV    := $(AUTO_GEN_DIR)/avocado.js
STATIC_JS_WITHOUT_DEV := $(AUTO_GEN_DIR)/avocado.without_dev.js
STATIC_JS_WITH_DEV_3D := $(AUTO_GEN_DIR)/avocado.3D.js

all: $(STATIC_JS_WITH_DEV) $(STATIC_JS_WITHOUT_DEV) $(STATIC_JS_WITH_DEV_3D)

clean:
	rm -r $(AUTO_GEN_DIR)

$(AUTO_GEN_DIR):
	mkdir $(AUTO_GEN_DIR)

$(STATIC_JS_WITH_DEV): $(AUTO_GEN_DIR) script/produceStaticJSFile.rb script/load_order.with_dev.rb
	script/produceStaticJSFile.rb < script/load_order.with_dev.rb > $(STATIC_JS_WITH_DEV)

$(STATIC_JS_WITH_DEV_3D): $(AUTO_GEN_DIR) script/produceStaticJSFile.rb script/load_order.with_dev.3D.rb
	script/produceStaticJSFile.rb < script/load_order.with_dev.3D.rb > $(STATIC_JS_WITH_DEV_3D)

$(STATIC_JS_WITHOUT_DEV): $(AUTO_GEN_DIR) script/produceStaticJSFile.rb script/load_order.without_dev.rb
	script/produceStaticJSFile.rb < script/load_order.without_dev.rb > $(STATIC_JS_WITHOUT_DEV)
